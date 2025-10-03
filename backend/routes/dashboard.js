const express = require('express');
const Student = require('../models/Student');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let query = { schoolId: user.schoolId, isActive: true };

    // Role-based filtering
    if (user.role === 'TEACHER') {
      query.assignedTeacherId = user._id;
    }

    const totalStudents = await Student.countDocuments(query);
    const atRiskStudents = await Student.countDocuments({ ...query, riskLevel: { $in: ['MEDIUM', 'HIGH'] } });
    const highRiskStudents = await Student.countDocuments({ ...query, riskLevel: 'HIGH' });
    const mediumRiskStudents = await Student.countDocuments({ ...query, riskLevel: 'MEDIUM' });
    const lowRiskStudents = await Student.countDocuments({ ...query, riskLevel: 'LOW' });

    // Get recent risk flags
    const recentRiskFlags = await Student.find({ ...query, 'riskFlags.0': { $exists: true } })
      .select('firstName lastName riskFlags')
      .sort({ 'riskFlags.createdAt': -1 })
      .limit(5);

    const stats = {
      totalStudents,
      atRiskStudents,
      riskBreakdown: {
        high: highRiskStudents,
        medium: mediumRiskStudents,
        low: lowRiskStudents
      },
      recentRiskFlags: recentRiskFlags.map(student => ({
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        latestFlag: student.riskFlags[0]
      }))
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// @route   GET /api/dashboard/at-risk-overview
// @desc    Get at-risk students overview
// @access  Private
router.get('/at-risk-overview', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let query = { schoolId: user.schoolId, isActive: true };

    // Role-based filtering
    if (user.role === 'TEACHER') {
      query.assignedTeacherId = user._id;
    }

    const highRisk = await Student.countDocuments({ ...query, riskLevel: 'HIGH' });
    const mediumRisk = await Student.countDocuments({ ...query, riskLevel: 'MEDIUM' });
    const lowRisk = await Student.countDocuments({ ...query, riskLevel: 'LOW' });
    const total = highRisk + mediumRisk + lowRisk;

    res.json({
      success: true,
      data: {
        high: highRisk,
        medium: mediumRisk,
        low: lowRisk,
        total
      }
    });
  } catch (error) {
    console.error('Get at-risk overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch at-risk overview'
    });
  }
});

// @route   GET /api/dashboard/attendance-trend
// @desc    Get attendance trend data
// @access  Private
router.get('/attendance-trend', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const user = req.user;
    let query = { schoolId: user.schoolId, isActive: true };

    // Role-based filtering
    if (user.role === 'TEACHER') {
      query.assignedTeacherId = user._id;
    }

    // Mock attendance trend data (in real app, this would come from attendance records)
    const trendData = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const rate = Math.random() * 20 + 80; // Random rate between 80-100
      
      trendData.push({
        date: dateStr,
        rate: Math.round(rate * 10) / 10,
        present: Math.floor(Math.random() * 25) + 20,
        absent: Math.floor(Math.random() * 5),
        excused: Math.floor(Math.random() * 3)
      });
    }

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Get attendance trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance trend'
    });
  }
});

// @route   GET /api/dashboard/performance-trend
// @desc    Get performance trend data
// @access  Private
router.get('/performance-trend', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const user = req.user;
    let query = { schoolId: user.schoolId, isActive: true };

    // Role-based filtering
    if (user.role === 'TEACHER') {
      query.assignedTeacherId = user._id;
    }

    // Mock performance trend data
    const subjects = ['Mathematics', 'Science', 'English', 'History'];
    const trendData = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      subjects.forEach(subject => {
        const average = Math.random() * 30 + 70; // Random average between 70-100
        trendData.push({
          date: dateStr,
          average: Math.round(average * 10) / 10,
          subject
        });
      });
    }

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Get performance trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trend'
    });
  }
});

// @route   GET /api/dashboard/intervention-pipeline
// @desc    Get intervention pipeline data
// @access  Private
router.get('/intervention-pipeline', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let query = { schoolId: user.schoolId, isActive: true };

    // Role-based filtering
    if (user.role === 'TEACHER') {
      query.assignedTeacherId = user._id;
    }

    // Mock intervention data (in real app, this would come from intervention records)
    const planned = Math.floor(Math.random() * 10) + 5;
    const inProgress = Math.floor(Math.random() * 8) + 3;
    const completed = Math.floor(Math.random() * 15) + 10;
    const total = planned + inProgress + completed;

    res.json({
      success: true,
      data: {
        planned,
        inProgress,
        completed,
        total
      }
    });
  } catch (error) {
    console.error('Get intervention pipeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch intervention pipeline'
    });
  }
});

// Teacher-specific dashboard routes
// @route   GET /api/teacher/classes
// @desc    Get teacher's classes
// @access  Private (Teacher)
router.get('/teacher/classes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get unique classrooms for this teacher
    const classrooms = await Student.aggregate([
      { $match: { assignedTeacherId: req.user._id, isActive: true } },
      { $group: { _id: '$classroomId', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Mock class schedule data
    const classes = classrooms.map((classroom, index) => ({
      id: classroom._id,
      name: `${classroom._id}`,
      time: ['9:00 AM', '11:00 AM', '2:00 PM'][index % 3],
      studentCount: classroom.count,
      teacherId: req.user._id
    }));

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher classes'
    });
  }
});

// @route   GET /api/teacher/at-risk-students
// @desc    Get teacher's at-risk students
// @access  Private (Teacher)
router.get('/teacher/at-risk-students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const students = await Student.find({
      assignedTeacherId: req.user._id,
      isActive: true,
      riskLevel: { $in: ['MEDIUM', 'HIGH'] }
    })
    .select('firstName lastName classroomId riskLevel riskFlags')
    .sort({ riskLevel: -1, createdAt: -1 })
    .limit(10);

    const atRiskStudents = students.map(student => ({
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      classroomId: student.classroomId,
      riskLevel: student.riskLevel,
      reason: student.riskFlags[0]?.description || 'No specific reason provided'
    }));

    res.json({
      success: true,
      data: atRiskStudents
    });
  } catch (error) {
    console.error('Get teacher at-risk students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch at-risk students'
    });
  }
});


module.exports = router;
