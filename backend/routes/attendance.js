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
      .populate('studentId', 'firstName lastName fullName classroomId')
      .populate('markedBy', 'name email')
      .sort({ date: -1 });

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

    for (const record of records) {
      try {
        // Check if attendance already exists for this student and date
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(recordDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingAttendance = await Attendance.findOne({
          studentId: record.studentId,
          date: {
            $gte: recordDate,
            $lte: endOfDay
          }
        });

        if (existingAttendance) {
          // Update existing record
          existingAttendance.status = record.status;
          existingAttendance.reason = record.reason || 'NONE';
          existingAttendance.reasonDetails = record.reasonDetails;
          existingAttendance.notes = record.notes;
          existingAttendance.modifiedBy = req.user._id;
          existingAttendance.modifiedAt = new Date();
          await existingAttendance.save();
          createdRecords.push(existingAttendance);
        } else {
          // Create new record
          const attendance = await Attendance.create({
            ...record,
            schoolId: req.user.schoolId,
            markedBy: req.user._id,
            reason: record.reason || 'NONE'
          });
          createdRecords.push(attendance);
        }

        // If student is absent, trigger risk detection and send alert
        if (record.status === 'ABSENT') {
          // Run risk detection
          await riskDetectionService.detectRisksForStudent(
            record.studentId,
            req.user.schoolId,
            req.user._id
          );

          // Send absence alert to guardian
          try {
            await messageService.sendAbsenceAlert(
              record.studentId,
              record.date,
              req.user._id
            );
          } catch (msgError) {
            logger.error('Failed to send absence alert:', msgError);
          }
        }
      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    res.status(errors.length > 0 ? 207 : 201).json({
      success: true,
      message: `Marked attendance for ${createdRecords.length} students`,
      data: createdRecords,
      errors: errors.length > 0 ? errors : undefined
    });
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
