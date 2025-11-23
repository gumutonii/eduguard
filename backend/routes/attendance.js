const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { authenticateToken: auth } = require('../middleware/auth');
const riskDetectionService = require('../services/riskDetectionService');
const messageService = require('../services/messageService');
const logger = require('../utils/logger');

// Get attendance records with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, classId, date, startDate, endDate, status } = req.query;
    // SUPER_ADMIN can see all data, others are filtered by school
    const query = {};
    
    // Filter by school for non-SUPER_ADMIN users
    if (req.user.role !== 'SUPER_ADMIN' && req.user.schoolId) {
      query.schoolId = req.user.schoolId;
    }

    // For teachers, verify they have access to the requested student
    if (studentId && req.user.role === 'TEACHER') {
      const student = await Student.findOne({
        _id: studentId,
        assignedTeacher: req.user._id,
        schoolId: req.user.schoolId,
        isActive: true
      }).select('_id');
      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have access to this student'
        });
      }
    }
    
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    
    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    // Filter by classId if provided (use direct classId field for better performance)
    if (classId) {
      query.classId = classId;
    } else if (req.user.role === 'TEACHER' && !studentId) {
      // For teachers, filter by their assigned students ONLY if no specific studentId is requested
      // If studentId is provided, we should respect it (after verifying access in middleware if needed)
      const students = await Student.find({
        assignedTeacher: req.user._id,
        schoolId: req.user.schoolId,
        isActive: true
      }).select('_id');
      if (students.length > 0) {
        query.studentId = { $in: students.map(s => s._id) };
      } else {
        // No students assigned, return empty result
        query.studentId = { $in: [] };
      }
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'firstName lastName fullName classId studentId profilePicture')
      .populate('classId', 'name className grade section')
      .populate('markedBy', 'name email')
      .populate('modifiedBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .lean(); // Use lean() for better performance

    // Ensure consistent data structure
    const formattedAttendance = attendance.map(record => ({
      _id: record._id,
      studentId: record.studentId?._id || record.studentId,
      student: record.studentId ? {
        _id: record.studentId._id || record.studentId,
        firstName: record.studentId.firstName,
        lastName: record.studentId.lastName,
        fullName: record.studentId.fullName || `${record.studentId.firstName} ${record.studentId.lastName}`,
        studentId: record.studentId.studentId,
        profilePicture: record.studentId.profilePicture
      } : null,
      date: record.date,
      status: record.status,
      reason: record.reason || 'NONE',
      reasonDetails: record.reasonDetails,
      notes: record.notes,
      markedBy: record.markedBy,
      modifiedBy: record.modifiedBy,
      modifiedAt: record.modifiedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));

    res.json({
      success: true,
      count: formattedAttendance.length,
      data: formattedAttendance
    });
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
});

// Mark attendance (single or bulk)
// IMPORTANT: This is the ONLY legitimate route for creating attendance records.
// All attendance must be created through authenticated teachers/admins marking
// attendance from real student attendance lists. No sample/test data should be
// created through this or any other route.
router.post('/mark', auth, async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Records array is required and must not be empty'
      });
    }

    const createdRecords = [];
    const errors = [];
    const absentStudents = []; // Track absent students for async risk detection

    // Prepare all records for bulk operations
    const recordsToCreate = [];
    const recordsToUpdate = [];
    const dateMap = new Map(); // Map to track existing records

    // First, batch fetch all existing attendance records for the date range
    const dateStrings = [...new Set(records.map(r => r.date))];
    const dateObjects = dateStrings.map(d => {
      const date = new Date(d);
      date.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      return { start: date, end: endOfDay };
    });

    // Fetch all existing records in one query
    const studentIds = [...new Set(records.map(r => r.studentId))];
    const existingRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: {
        $gte: new Date(Math.min(...dateObjects.map(d => d.start.getTime()))),
        $lte: new Date(Math.max(...dateObjects.map(d => d.end.getTime())))
      }
    }).lean();

    // Create a map for quick lookup (normalize dates for consistent comparison)
    existingRecords.forEach(record => {
      const recordDate = new Date(record.date);
      recordDate.setUTCHours(0, 0, 0, 0);
      const key = `${record.studentId}_${recordDate.toISOString().split('T')[0]}`;
      dateMap.set(key, record);
    });

    // Validate and process all records
    for (const record of records) {
      try {
        // Validate required fields
        if (!record.studentId || !record.date || !record.status) {
          errors.push({
            studentId: record.studentId || 'unknown',
            error: 'Missing required fields: studentId, date, or status'
          });
          continue;
        }

        // Validate student exists and belongs to school
        const student = await Student.findOne({
          _id: record.studentId,
          schoolId: req.user.schoolId,
          isActive: true
        });
        if (!student) {
          errors.push({
            studentId: record.studentId,
            error: 'Student not found or not active'
          });
          continue;
        }

        // Validate status
        if (!['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(record.status)) {
          errors.push({
            studentId: record.studentId,
            error: `Invalid status: ${record.status}`
          });
          continue;
        }

        // Parse and normalize date (ensure consistent time normalization)
        const recordDate = new Date(record.date);
        if (isNaN(recordDate.getTime())) {
          errors.push({
            studentId: record.studentId,
            error: 'Invalid date format'
          });
          continue;
        }
        // Normalize date to start of day in UTC to ensure consistency
        recordDate.setUTCHours(0, 0, 0, 0);
        const dateKey = `${record.studentId}_${recordDate.toISOString().split('T')[0]}`;
        const existing = dateMap.get(dateKey);

        // Use upsert pattern with unique index to prevent duplicates
        if (existing) {
          // Update existing record
          recordsToUpdate.push({
            updateOne: {
              filter: { _id: existing._id },
              update: {
                $set: {
                  status: record.status,
                  reason: record.reason || 'NONE',
                  reasonDetails: record.reasonDetails,
                  notes: record.notes,
                  classId: student.classId, // Ensure classId is always up-to-date
                  modifiedBy: req.user._id,
                  modifiedAt: new Date()
                }
              }
            }
          });
          createdRecords.push({ ...existing, status: record.status, classId: student.classId });
        } else {
          // Create new record with classId from student
          recordsToCreate.push({
            studentId: record.studentId,
            classId: student.classId,
            date: recordDate,
            status: record.status,
            schoolId: req.user.schoolId,
            markedBy: req.user._id,
            reason: record.reason || 'NONE',
            reasonDetails: record.reasonDetails,
            notes: record.notes
          });
        }

        // Track absent students for async processing
        if (record.status === 'ABSENT') {
          absentStudents.push({
            studentId: record.studentId,
            date: recordDate.toISOString().split('T')[0]
          });
        }
      } catch (error) {
        logger.error(`Error preparing attendance for student ${record.studentId}:`, error);
        errors.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    // Bulk operations for faster saving with duplicate handling
    try {
      if (recordsToUpdate.length > 0) {
        const updateResult = await Attendance.bulkWrite(recordsToUpdate, { ordered: false });
        logger.info(`Updated ${updateResult.modifiedCount} attendance records`);
      }
      if (recordsToCreate.length > 0) {
        try {
          const newRecords = await Attendance.insertMany(recordsToCreate, { ordered: false });
          createdRecords.push(...newRecords);
          logger.info(`Created ${newRecords.length} new attendance records`);
        } catch (insertError) {
          // Handle duplicate key errors from unique index
          if (insertError.code === 11000 || insertError.name === 'MongoServerError') {
            logger.warn('Duplicate key error detected, attempting to update existing records instead');
            // For records that failed due to duplicates, try to update them
            const duplicateErrors = insertError.writeErrors || [];
            const successfulInserts = insertError.insertedIds || {};
            
            // Get IDs of successfully inserted records
            const insertedIds = Object.values(successfulInserts);
            const failedRecords = recordsToCreate.filter((r, idx) => {
              const recordId = insertedIds[idx];
              return !recordId && duplicateErrors.some(e => e.index === idx);
            });

            // Try to update the failed records (they might have been created between our check and insert)
            for (const failedRecord of failedRecords) {
              try {
                const existing = await Attendance.findOne({
                  studentId: failedRecord.studentId,
                  date: failedRecord.date
                });
                if (existing) {
                  existing.status = failedRecord.status;
                  existing.reason = failedRecord.reason || 'NONE';
                  existing.reasonDetails = failedRecord.reasonDetails;
                  existing.notes = failedRecord.notes;
                  existing.classId = failedRecord.classId;
                  existing.modifiedBy = req.user._id;
                  existing.modifiedAt = new Date();
                  await existing.save();
                  createdRecords.push(existing);
                }
              } catch (updateErr) {
                errors.push({
                  studentId: failedRecord.studentId,
                  error: 'Failed to save attendance record'
                });
              }
            }
          } else {
            throw insertError;
          }
        }
      }
    } catch (error) {
      logger.error('Error in bulk attendance operations:', error);
      // If it's a bulk write error, extract individual errors
      if (error.writeErrors && error.writeErrors.length > 0) {
        error.writeErrors.forEach(writeError => {
          // Skip duplicate key errors as we handle them above
          if (writeError.code !== 11000) {
            errors.push({
              studentId: 'unknown',
              error: writeError.errmsg || writeError.err.message
            });
          }
        });
      }
      // Don't throw - return partial success if some records were saved
      if (createdRecords.length === 0 && recordsToUpdate.length === 0) {
        throw error;
      }
    }

    // Return success immediately after saving records
    const totalSaved = createdRecords.length;
    const statusCode = errors.length > 0 ? 207 : (totalSaved > 0 ? 201 : 200);
    
    res.status(statusCode).json({
      success: totalSaved > 0 || recordsToUpdate.length > 0,
      message: totalSaved > 0 
        ? `Marked attendance for ${totalSaved} students${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
        : errors.length > 0 
          ? `Failed to save attendance: ${errors.length} errors`
          : 'No attendance records to save',
      data: createdRecords.length > 0 ? createdRecords : undefined,
      updated: recordsToUpdate.length,
      errors: errors.length > 0 ? errors : undefined
    });

    // Process weekly attendance risk detection and alerts asynchronously (non-blocking)
    // Use setTimeout to ensure response is sent first
    // Get unique students who had attendance marked this week
    const uniqueStudents = [...new Set(records.map(r => r.studentId))];
    
    if (uniqueStudents.length > 0) {
      setTimeout(async () => {
        for (const studentId of uniqueStudents) {
          try {
            // Run weekly attendance risk detection (current week, 5 days)
            riskDetectionService.detectWeeklyAttendanceRisks(
              studentId,
              req.user.schoolId,
              req.user._id
            ).catch(err => {
              logger.error(`Weekly attendance risk detection failed for student ${studentId}:`, err);
            });

            // Send absence alerts for absent students (non-blocking, don't await)
            const absentForStudent = absentStudents.filter(a => a.studentId.toString() === studentId.toString());
            for (const absent of absentForStudent) {
              messageService.sendAbsenceAlert(
                absent.studentId,
                absent.date,
                req.user._id
              ).catch(msgError => {
                // Silently fail - don't log every template error
                if (!msgError.message?.includes('Template')) {
                  logger.error('Failed to send absence alert:', msgError);
                }
              });
            }
          } catch (error) {
            logger.error(`Error processing attendance for student ${studentId}:`, error);
          }
        }
      }, 100); // Small delay to ensure response is sent
    }
  } catch (error) {
    logger.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
});

// Get attendance summary for a student
router.get('/summary/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await Attendance.getStudentSummary(studentId, start, end);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary',
      error: error.message
    });
  }
});

// Get attendance calendar data
router.get('/calendar', auth, async (req, res) => {
  try {
    const { studentId, month, year } = req.query;

    if (!studentId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'studentId, month, and year are required'
      });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const attendance = await Attendance.find({
      studentId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Format for calendar display
    const calendarData = attendance.map(a => ({
      date: a.date,
      status: a.status,
      reason: a.reason,
      reasonDetails: a.reasonDetails,
      notes: a.notes
    }));

    res.json({
      success: true,
      data: calendarData
    });
  } catch (error) {
    logger.error('Error fetching calendar data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar data',
      error: error.message
    });
  }
});

// Get attendance statistics for school/class
router.get('/statistics', auth, async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setUTCDate(new Date().getUTCDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    if (start) start.setUTCHours(0, 0, 0, 0);
    if (end) end.setUTCHours(23, 59, 59, 999);

    const query = {
      schoolId: req.user.schoolId,
      date: { $gte: start, $lte: end }
    };

    // Filter by class if specified (use direct classId field for better performance)
    if (classId) {
      query.classId = classId;
    }

    const attendance = await Attendance.find(query);

    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      excused: attendance.filter(a => a.status === 'EXCUSED').length,
      attendanceRate: 0
    };

    if (stats.total > 0) {
      stats.attendanceRate = ((stats.present + stats.late) / stats.total * 100).toFixed(2);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching attendance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Update attendance record
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, reasonDetails, notes } = req.body;

    const attendance = await Attendance.findById(id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    attendance.status = status || attendance.status;
    attendance.reason = reason || attendance.reason;
    attendance.reasonDetails = reasonDetails || attendance.reasonDetails;
    attendance.notes = notes || attendance.notes;
    attendance.modifiedBy = req.user._id;
    attendance.modifiedAt = new Date();

    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance
    });
  } catch (error) {
    logger.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record',
      error: error.message
    });
  }
});

// Delete attendance record (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete attendance records'
      });
    }

    const { id } = req.params;
    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message
    });
  }
});

module.exports = router;
