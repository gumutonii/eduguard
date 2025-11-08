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
    const query = { schoolId: req.user.schoolId };

    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    
    if (date) {
      const searchDate = new Date(date);
      query.date = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lte: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by classId if provided
    if (classId) {
      const classStudents = await Student.find({
        classId: classId,
        isActive: true
      }).select('_id');
      if (classStudents.length > 0) {
        query.studentId = { $in: classStudents.map(s => s._id) };
      } else {
        query.studentId = { $in: [] };
      }
    } else if (req.user.role === 'TEACHER') {
      // For teachers, filter by their assigned students
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
      .populate('studentId', 'firstName lastName fullName classroomId studentId profilePicture')
      .populate('markedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
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
      date.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
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

    // Create a map for quick lookup
    existingRecords.forEach(record => {
      const key = `${record.studentId}_${record.date.toISOString().split('T')[0]}`;
      dateMap.set(key, record);
    });

    // Process all records
    for (const record of records) {
      try {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        const dateKey = `${record.studentId}_${record.date}`;
        const existing = dateMap.get(dateKey);

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
                  modifiedBy: req.user._id,
                  modifiedAt: new Date()
                }
              }
            }
          });
          createdRecords.push({ ...existing, status: record.status });
        } else {
          // Create new record
          recordsToCreate.push({
            studentId: record.studentId,
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
            date: record.date
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

    // Bulk operations for faster saving
    try {
      if (recordsToUpdate.length > 0) {
        await Attendance.bulkWrite(recordsToUpdate);
      }
      if (recordsToCreate.length > 0) {
        const newRecords = await Attendance.insertMany(recordsToCreate);
        createdRecords.push(...newRecords);
      }
    } catch (error) {
      logger.error('Error in bulk attendance operations:', error);
      throw error;
    }

    // Return success immediately after saving records
    res.status(errors.length > 0 ? 207 : 201).json({
      success: true,
      message: `Marked attendance for ${createdRecords.length} students`,
      data: createdRecords,
      errors: errors.length > 0 ? errors : undefined
    });

    // Process risk detection and alerts asynchronously (non-blocking)
    // Use setTimeout to ensure response is sent first
    if (absentStudents.length > 0) {
      setTimeout(async () => {
        for (const absent of absentStudents) {
          try {
            // Run risk detection (non-blocking, don't await)
            riskDetectionService.detectRisksForStudent(
              absent.studentId,
              req.user.schoolId,
              req.user._id
            ).catch(err => {
              logger.error(`Risk detection failed for student ${absent.studentId}:`, err);
            });

            // Send absence alert (non-blocking, don't await)
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
          } catch (error) {
            logger.error(`Error processing absence for student ${absent.studentId}:`, error);
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

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

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
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const query = {
      schoolId: req.user.schoolId,
      date: { $gte: start, $lte: end }
    };

    // Filter by class if specified
    if (classId) {
      const students = await Student.find({
        classroomId: classId,
        schoolId: req.user.schoolId
      }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
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
