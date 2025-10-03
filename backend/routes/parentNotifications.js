const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { notifyParentsOfRisk, notifyParentsOfAttendance, notifyParentsOfPerformance } = require('../utils/notificationService');
const Student = require('../models/Student');

const router = express.Router();

// @route   POST /api/notifications/parent/risk-alert
// @desc    Send risk alert notifications to parents
// @access  Private (Admin, Teacher)
router.post('/risk-alert', authenticateToken, authorize('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { studentId, riskLevel, riskDescription } = req.body;

    if (!studentId || !riskLevel || !riskDescription) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, risk level, and risk description are required'
      });
    }

    // Verify student exists and user has access
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if user has access to this student
    if (req.user.role === 'TEACHER' && student.assignedTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    // Send notifications to parents
    const result = await notifyParentsOfRisk(studentId, riskLevel, riskDescription);

    res.json({
      success: true,
      message: 'Parent notifications sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Send parent risk alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send parent notifications'
    });
  }
});

// @route   POST /api/notifications/parent/attendance-alert
// @desc    Send attendance alert notifications to parents
// @access  Private (Admin, Teacher)
router.post('/attendance-alert', authenticateToken, authorize('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { studentId, attendanceData } = req.body;

    if (!studentId || !attendanceData) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and attendance data are required'
      });
    }

    // Verify student exists and user has access
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if user has access to this student
    if (req.user.role === 'TEACHER' && student.assignedTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    // Send attendance notifications to parents
    const result = await notifyParentsOfAttendance(studentId, attendanceData);

    res.json({
      success: true,
      message: 'Parent attendance notifications sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Send parent attendance alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send parent attendance notifications'
    });
  }
});

// @route   POST /api/notifications/parent/performance-alert
// @desc    Send performance alert notifications to parents
// @access  Private (Admin, Teacher)
router.post('/performance-alert', authenticateToken, authorize('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { studentId, performanceData } = req.body;

    if (!studentId || !performanceData) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and performance data are required'
      });
    }

    // Verify student exists and user has access
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if user has access to this student
    if (req.user.role === 'TEACHER' && student.assignedTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    // Send performance notifications to parents
    const result = await notifyParentsOfPerformance(studentId, performanceData);

    res.json({
      success: true,
      message: 'Parent performance notifications sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Send parent performance alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send parent performance notifications'
    });
  }
});

// @route   GET /api/notifications/parent/student/:studentId/contacts
// @desc    Get guardian contacts for a student
// @access  Private (Admin, Teacher)
router.get('/student/:studentId/contacts', authenticateToken, authorize('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).select('firstName lastName guardianContacts');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if user has access to this student
    if (req.user.role === 'TEACHER' && student.assignedTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    res.json({
      success: true,
      data: {
        studentName: `${student.firstName} ${student.lastName}`,
        guardianContacts: student.guardianContacts
      }
    });
  } catch (error) {
    console.error('Get student guardian contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guardian contacts'
    });
  }
});

module.exports = router;
