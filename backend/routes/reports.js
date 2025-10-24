const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const RiskFlag = require('../models/RiskFlag');
const Intervention = require('../models/Intervention');
const Message = require('../models/Message');
const { authenticateToken: auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const { stringify } = require('csv-stringify/sync');

// Get attendance report
router.get('/attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate, classId, format } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const query = {
      schoolId: req.user.schoolId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (classId) {
      const students = await Student.find({
        classroomId: classId,
        schoolId: req.user.schoolId
      }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    }

    const records = await Attendance.find(query)
      .populate('studentId', 'firstName lastName fullName classroomId')
      .sort({ date: -1, 'studentId.lastName': 1 });

    if (format === 'csv') {
      const csvData = records.map(r => ({
        Date: r.date.toLocaleDateString(),
        'Student Name': r.studentId.fullName,
        'Class': r.studentId.classroomId,
        Status: r.status,
        Reason: r.reason,
        'Reason Details': r.reasonDetails || '',
        Notes: r.notes || ''
      }));

      const csv = stringify(csvData, { header: true });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    logger.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance report',
      error: error.message
    });
  }
});

// Get performance report
router.get('/performance', auth, async (req, res) => {
  try {
    const { academicYear, term, classId, subject, format } = req.query;

    if (!academicYear || !term) {
      return res.status(400).json({
        success: false,
        message: 'academicYear and term are required'
      });
    }

    const query = {
      schoolId: req.user.schoolId,
      academicYear,
      term
    };

    if (classId) query.classId = classId;
    if (subject) query.subject = subject;

    const records = await Performance.find(query)
      .populate('studentId', 'firstName lastName fullName classroomId')
      .sort({ 'studentId.lastName': 1, subject: 1 });

    if (format === 'csv') {
      const csvData = records.map(r => ({
        'Student Name': r.studentId.fullName,
        'Class': r.studentId.classroomId,
        Subject: r.subject,
        Score: r.score,
        'Max Score': r.maxScore,
        Grade: r.grade,
        'Assessment Type': r.assessmentType,
        Term: r.term,
        'Academic Year': r.academicYear,
        Remarks: r.remarks || ''
      }));

      const csv = stringify(csvData, { header: true });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=performance-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    logger.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report',
      error: error.message
    });
  }
});

// Get risk report
router.get('/risk', auth, async (req, res) => {
  try {
    const { severity, type, isActive, format } = req.query;

    const query = { schoolId: req.user.schoolId };

    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const records = await RiskFlag.find(query)
      .populate('studentId', 'firstName lastName fullName classroomId riskLevel')
      .populate('createdBy', 'name')
      .sort({ severity: -1, createdAt: -1 });

    if (format === 'csv') {
      const csvData = records.map(r => ({
        'Student Name': r.studentId.fullName,
        'Class': r.studentId.classroomId,
        'Risk Level': r.studentId.riskLevel,
        Type: r.type,
        Severity: r.severity,
        Title: r.title,
        Description: r.description,
        'Created Date': r.createdAt.toLocaleDateString(),
        'Created By': r.createdBy.name,
        Active: r.isActive ? 'Yes' : 'No',
        Resolved: r.isResolved ? 'Yes' : 'No'
      }));

      const csv = stringify(csvData, { header: true });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=risk-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    logger.error('Error generating risk report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate risk report',
      error: error.message
    });
  }
});

// Get intervention report
router.get('/interventions', auth, async (req, res) => {
  try {
    const { status, type, startDate, endDate, format } = req.query;

    const query = { schoolId: req.user.schoolId };

    if (status) query.status = status;
    if (type) query.type = type;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const records = await Intervention.find(query)
      .populate('studentId', 'firstName lastName fullName classroomId')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    if (format === 'csv') {
      const csvData = records.map(r => ({
        'Student Name': r.studentId.fullName,
        'Class': r.studentId.classroomId,
        Title: r.title,
        Type: r.type,
        Priority: r.priority,
        Status: r.status,
        'Assigned To': r.assignedTo.name,
        'Created By': r.createdBy.name,
        'Due Date': r.dueDate.toLocaleDateString(),
        'Created Date': r.createdAt.toLocaleDateString(),
        Outcome: r.outcome,
        'Follow-up Required': r.followUpRequired ? 'Yes' : 'No'
      }));

      const csv = stringify(csvData, { header: true });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=interventions-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    logger.error('Error generating interventions report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interventions report',
      error: error.message
    });
  }
});

// Get messaging report
router.get('/messages', auth, async (req, res) => {
  try {
    const { startDate, endDate, type, status, format } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const query = {
      schoolId: req.user.schoolId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (type) query.type = type;
    if (status) query.status = status;

    const records = await Message.find(query)
      .populate('studentId', 'firstName lastName fullName')
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = records.map(r => ({
        Date: r.createdAt.toLocaleDateString(),
        'Student Name': r.studentId ? r.studentId.fullName : 'N/A',
        'Recipient Name': r.recipientName,
        'Recipient Phone': r.recipientPhone,
        Channel: r.channel,
        Type: r.type,
        Status: r.status,
        'SMS Status': r.smsStatus,
        'Email Status': r.emailStatus,
        'Sent By': r.sentBy.name
      }));

      const csv = stringify(csvData, { header: true });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=messages-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    logger.error('Error generating messages report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate messages report',
      error: error.message
    });
  }
});

// Get comprehensive school dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Get at-risk students summary
    const riskSummary = await RiskFlag.getSchoolSummary(schoolId);

    // Get intervention summary
    const interventionSummary = await Intervention.getDashboardSummary(schoolId);

    // Get recent attendance statistics
    const recentAttendance = await Attendance.find({
      schoolId,
      date: { $gte: thirtyDaysAgo }
    });

    const attendanceStats = {
      total: recentAttendance.length,
      present: recentAttendance.filter(a => a.status === 'PRESENT').length,
      absent: recentAttendance.filter(a => a.status === 'ABSENT').length,
      rate: 0
    };

    if (attendanceStats.total > 0) {
      attendanceStats.rate = ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2);
    }

    // Get message statistics
    const messageStats = await Message.getDeliveryStats(schoolId, thirtyDaysAgo, new Date());

    // Get student counts
    const totalStudents = await Student.countDocuments({ schoolId, isActive: true });
    const highRiskStudents = await Student.countDocuments({ schoolId, isActive: true, riskLevel: 'HIGH' });
    const mediumRiskStudents = await Student.countDocuments({ schoolId, isActive: true, riskLevel: 'MEDIUM' });

    res.json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          highRisk: highRiskStudents,
          mediumRisk: mediumRiskStudents
        },
        risks: riskSummary,
        interventions: interventionSummary,
        attendance: attendanceStats,
        messages: messageStats
      }
    });
  } catch (error) {
    logger.error('Error generating dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard data',
      error: error.message
    });
  }
});

module.exports = router;
