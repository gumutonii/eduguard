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
    const Class = require('../models/Class');
    
    // SUPER_ADMIN can see all data, others are filtered by school
    let studentQuery = { isActive: true };
    let classQuery = { isActive: true };
    
    // Filter by school for non-SUPER_ADMIN users
    if (user.role !== 'SUPER_ADMIN' && user.schoolId) {
      studentQuery.schoolId = user.schoolId;
      classQuery.schoolId = user.schoolId;
    }

    // Role-based filtering for teachers
    if (user.role === 'TEACHER') {
      studentQuery.assignedTeacher = user._id;
      classQuery.assignedTeacher = user._id;
    }

    // Get real-time counts from database
    const totalStudents = await Student.countDocuments(studentQuery);
    const atRiskStudents = await Student.countDocuments({ ...studentQuery, riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } });
    const highRiskStudents = await Student.countDocuments({ ...studentQuery, riskLevel: 'HIGH' });
    const mediumRiskStudents = await Student.countDocuments({ ...studentQuery, riskLevel: 'MEDIUM' });
    const lowRiskStudents = await Student.countDocuments({ ...studentQuery, riskLevel: 'LOW' });
    
    // Get classes count
    const totalClasses = await Class.countDocuments(classQuery);
    
    // Get teachers count (for admin and super admin only)
    let totalTeachers = 0;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const teacherQuery = { role: 'TEACHER', isActive: true };
      // Filter by school for ADMIN, SUPER_ADMIN sees all
      if (user.role === 'ADMIN' && user.schoolId) {
        teacherQuery.schoolId = user.schoolId;
      }
      totalTeachers = await User.countDocuments(teacherQuery);
    }

    // Get recent risk flags
    const recentRiskFlags = await Student.find({ ...studentQuery, 'riskFlags.0': { $exists: true } })
      .select('firstName lastName riskFlags')
      .sort({ 'riskFlags.createdAt': -1 })
      .limit(5);

    const stats = {
      totalStudents,
      totalClasses,
      totalTeachers,
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
    // SUPER_ADMIN can see all data, others are filtered by school
    let query = { isActive: true };
    
    // Filter by school for non-SUPER_ADMIN users
    if (user.role !== 'SUPER_ADMIN' && user.schoolId) {
      query.schoolId = user.schoolId;
    }

    // Role-based filtering for teachers
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
// @desc    Get attendance trend data (weekly aggregation from real attendance records)
// @access  Private
router.get('/attendance-trend', authenticateToken, async (req, res) => {
  try {
    const { weeks = 6 } = req.query;
    const user = req.user;
    const Attendance = require('../models/Attendance');
    const Student = require('../models/Student');
    
    // Calculate date range for last N weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (parseInt(weeks) * 7));
    
    // Build student query based on role
    let studentQuery = { schoolId: user.schoolId, isActive: true };
    if (user.role === 'TEACHER') {
      studentQuery.assignedTeacher = user._id;
    }

    // Get all students for this school/teacher
    const students = await Student.find(studentQuery).select('_id');
    const studentIds = students.map(s => s._id);
    
    if (studentIds.length === 0) {
      // No students, return empty trend with target line
    const trendData = [];
      for (let i = parseInt(weeks) - 1; i >= 0; i--) {
        const weekStart = new Date(endDate);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        trendData.push({
          week: `W${parseInt(weeks) - i}`,
          attendance: 0,
          target: 90
        });
      }
      return res.json({
        success: true,
        data: trendData
      });
    }
    
    // Get attendance records for the date range
    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: { $gte: startDate, $lte: endDate }
    }).select('date status');
    
    // Group attendance by week
    const weeklyData = new Map();
    const targetRate = 90;
    
    // Initialize weeks
    for (let i = parseInt(weeks) - 1; i >= 0; i--) {
      const weekStart = new Date(endDate);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekKey = `W${parseInt(weeks) - i}`;
      weeklyData.set(weekKey, {
        week: weekKey,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: 0,
        target: targetRate
      });
    }
    
    // Process attendance records
    attendanceRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const weekNum = Math.floor((endDate - recordDate) / (7 * 24 * 60 * 60 * 1000));
      
      if (weekNum >= 0 && weekNum < parseInt(weeks)) {
        const weekKey = `W${parseInt(weeks) - weekNum}`;
        const weekData = weeklyData.get(weekKey);
        
        if (weekData) {
          weekData.total++;
          if (record.status === 'PRESENT') {
            weekData.present++;
          } else if (record.status === 'LATE') {
            weekData.late++;
          } else if (record.status === 'ABSENT') {
            weekData.absent++;
          } else if (record.status === 'EXCUSED') {
            weekData.excused++;
          }
        }
      }
    });
    
    // Calculate attendance rates (LATE counts as present)
    const trendData = Array.from(weeklyData.values()).map(week => {
      const presentAndLate = (week.present || 0) + (week.late || 0);
      const attendanceRate = week.total > 0 
        ? Math.round((presentAndLate / week.total) * 100 * 10) / 10
        : 0;
      
      return {
        week: week.week,
        attendance: attendanceRate,
        target: week.target
      };
    });

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
// @desc    Get performance trend data (from real performance records)
// @access  Private
router.get('/performance-trend', authenticateToken, async (req, res) => {
  try {
    const { weeks = 6 } = req.query;
    const user = req.user;
    const Performance = require('../models/Performance');
    const Student = require('../models/Student');
    
    // Calculate date range for last N weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (parseInt(weeks) * 7));
    
    // Build student query based on role
    let studentQuery = { schoolId: user.schoolId, isActive: true };
    if (user.role === 'TEACHER') {
      studentQuery.assignedTeacher = user._id;
    }

    // Get all students for this school/teacher
    const students = await Student.find(studentQuery).select('_id');
    const studentIds = students.map(s => s._id);
    
    if (studentIds.length === 0) {
      // No students, return empty trend
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get performance records for the date range
    const performanceRecords = await Performance.find({
      studentId: { $in: studentIds },
      date: { $gte: startDate, $lte: endDate }
    }).select('date score subject');
    
    // Group performance by week and subject
    const weeklyData = new Map();
    
    // Initialize weeks
    for (let i = parseInt(weeks) - 1; i >= 0; i--) {
      const weekStart = new Date(endDate);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekKey = `W${parseInt(weeks) - i}`;
      weeklyData.set(weekKey, {
        week: weekKey,
        scores: [],
        total: 0
      });
    }
    
    // Process performance records
    performanceRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const weekNum = Math.floor((endDate - recordDate) / (7 * 24 * 60 * 60 * 1000));
      
      if (weekNum >= 0 && weekNum < parseInt(weeks)) {
        const weekKey = `W${parseInt(weeks) - weekNum}`;
        const weekData = weeklyData.get(weekKey);
        
        if (weekData && record.score !== undefined && record.score !== null) {
          weekData.scores.push(record.score);
          weekData.total++;
        }
      }
    });
    
    // Calculate average scores per week
    const trendData = Array.from(weeklyData.values()).map(week => {
      const average = week.scores.length > 0
        ? Math.round((week.scores.reduce((a, b) => a + b, 0) / week.scores.length) * 10) / 10
        : 0;
      
      return {
        week: week.week,
        average: average,
        total: week.total
      };
      });

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
// @desc    Get intervention pipeline data (from real intervention records)
// @access  Private
router.get('/intervention-pipeline', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const Intervention = require('../models/Intervention');
    
    let query = { schoolId: user.schoolId, isActive: true };

    // Role-based filtering
    if (user.role === 'TEACHER') {
      query.assignedTo = user._id;
    }

    // Get real intervention data from database
    const interventionStats = await Intervention.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          planned: { $sum: { $cond: [{ $eq: ['$status', 'PLANNED'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['PLANNED', 'IN_PROGRESS']] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          total: { $sum: 1 }
        }
      }
    ]);

    const stats = interventionStats[0] || { 
      planned: 0, 
      inProgress: 0, 
      completed: 0, 
      cancelled: 0, 
      overdue: 0,
      total: 0 
    };

    res.json({
      success: true,
      data: {
        planned: stats.planned,
        inProgress: stats.inProgress,
        completed: stats.completed,
        cancelled: stats.cancelled,
        overdue: stats.overdue,
        total: stats.total
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

    // Get teacher's assigned classes from Class model
    const Class = require('../models/Class');
    const teacherClasses = await Class.find({
      assignedTeacher: req.user._id,
      isActive: true
    })
    .populate('schoolId', 'name')
    .sort({ className: 1 });

    // Get student counts for each class
    const classes = await Promise.all(teacherClasses.map(async (cls) => {
      const studentCount = await Student.countDocuments({
        classId: cls._id,
        isActive: true
      });
      
      return {
        id: cls._id,
        name: cls.className,
        studentCount: studentCount,
        teacherId: req.user._id,
        grade: cls.grade,
        section: cls.section
      };
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


// @route   GET /api/dashboard/system-stats
// @desc    Get system-wide statistics (Super Admin only)
// @access  Private (Super Admin)
router.get('/system-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.'
      });
    }

    const School = require('../models/School');
    const Class = require('../models/Class');
    const Attendance = require('../models/Attendance');
    const Performance = require('../models/Performance');
    const RiskFlag = require('../models/RiskFlag');
    const Intervention = require('../models/Intervention');
    const Message = require('../models/Message');

    // Get total users by role
    const totalUsers = await User.countDocuments();
    const superAdmins = await User.countDocuments({ role: 'SUPER_ADMIN' });
    const admins = await User.countDocuments({ role: 'ADMIN' });
    const teachers = await User.countDocuments({ role: 'TEACHER' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingApprovals = await User.countDocuments({ isApproved: false });

    // Get schools data
    const schools = await School.find({ isActive: true });
    const totalSchools = schools.length;

    // Get students data
    const totalStudents = await Student.countDocuments({ isActive: true });
    const atRiskStudents = await Student.countDocuments({ 
      isActive: true, 
      riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } 
    });

    // Get classes data
    const totalClasses = await Class.countDocuments({ isActive: true });

    // Get attendance data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    
    const attendanceStats = await Attendance.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } }
        }
      }
    ]);

    const attendance = attendanceStats[0] || { totalRecords: 0, present: 0, late: 0, absent: 0, excused: 0 };
    // Attendance rate = (PRESENT + LATE) / total * 100 (LATE counts as present)
    const presentAndLate = (attendance.present || 0) + (attendance.late || 0);
    const attendanceRate = attendance.totalRecords > 0 ? 
      Math.round((presentAndLate / attendance.totalRecords) * 100) : 0;

    // Get performance data
    const performanceStats = await Performance.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          averageScore: { $avg: '$score' },
          passingRate: {
            $avg: { $cond: [{ $gte: ['$score', 60] }, 1, 0] }
          }
        }
      }
    ]);

    const performance = performanceStats[0] || { totalRecords: 0, averageScore: 0, passingRate: 0 };

    // Get risk flags data
    const riskStats = await RiskFlag.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] } }
        }
      }
    ]);

    const riskFlags = riskStats[0] || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

    // Get interventions data
    const interventionStats = await Intervention.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          planned: { $sum: { $cond: [{ $eq: ['$status', 'PLANNED'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } }
        }
      }
    ]);

    const interventions = interventionStats[0] || { total: 0, planned: 0, inProgress: 0, completed: 0, cancelled: 0 };

    // Get messages data (last 30 days)
    const messageStats = await Message.aggregate([
      { $match: { sentAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } }
        }
      }
    ]);

    const messages = messageStats[0] || { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };

    // Get attendance trend (weekly for last 6 weeks) - system-wide
    const weeks = 6;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeks * 7));
    
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).select('date status').lean();
    
    const weeklyData = new Map();
    const targetRate = 90;
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekKey = `W${weeks - i}`;
      weeklyData.set(weekKey, {
        week: weekKey,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: 0,
        target: targetRate
      });
    }
    
    attendanceRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const weekNum = Math.floor((endDate - recordDate) / (7 * 24 * 60 * 60 * 1000));
      
      if (weekNum >= 0 && weekNum < weeks) {
        const weekKey = `W${weeks - weekNum}`;
        const weekData = weeklyData.get(weekKey);
        
        if (weekData) {
          weekData.total++;
          if (record.status === 'PRESENT') {
            weekData.present++;
          } else if (record.status === 'LATE') {
            weekData.late++;
          } else if (record.status === 'ABSENT') {
            weekData.absent++;
          } else if (record.status === 'EXCUSED') {
            weekData.excused++;
          }
        }
      }
    });
    
    // Calculate attendance rates (LATE counts as present)
    const attendanceTrend = Array.from(weeklyData.values()).map(week => {
      const presentAndLate = (week.present || 0) + (week.late || 0);
      const attendanceRate = week.total > 0 
        ? Math.round((presentAndLate / week.total) * 100 * 10) / 10
        : 0;
      
      return {
        week: week.week,
        attendance: attendanceRate,
        target: week.target
      };
    });

    // Get performance trend (weekly for last 6 weeks) - system-wide
    const performanceRecords = await Performance.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).select('score createdAt').lean();
    
    const weeklyPerformanceData = new Map();
    const targetPerformance = 70; // Target average performance
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekKey = `W${weeks - i}`;
      weeklyPerformanceData.set(weekKey, {
        week: weekKey,
        scores: [],
        total: 0,
        target: targetPerformance
      });
    }
    
    performanceRecords.forEach(record => {
      const recordDate = new Date(record.createdAt);
      const weekNum = Math.floor((endDate - recordDate) / (7 * 24 * 60 * 60 * 1000));
      
      if (weekNum >= 0 && weekNum < weeks) {
        const weekKey = `W${weeks - weekNum}`;
        const weekData = weeklyPerformanceData.get(weekKey);
        
        if (weekData && record.score !== undefined && record.score !== null) {
          weekData.scores.push(record.score);
          weekData.total++;
        }
      }
    });
    
    // Calculate average performance rates per week
    const performanceTrend = Array.from(weeklyPerformanceData.values()).map(week => {
      const averageScore = week.scores.length > 0
        ? Math.round((week.scores.reduce((sum, score) => sum + score, 0) / week.scores.length) * 10) / 10
        : 0;
      
      return {
        week: week.week,
        performance: averageScore,
        target: week.target
      };
    });

    // Get school performance data with students count
    const schoolPerformance = await School.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'schoolId',
          as: 'students'
        }
      },
      {
        $lookup: {
          from: 'riskflags',
          localField: '_id',
          foreignField: 'schoolId',
          as: 'riskFlags'
        }
      },
      {
        $project: {
          name: 1, // Full name for tooltip
          district: 1,
          sector: 1,
          students: { $size: '$students' },
          totalStudents: { $size: '$students' },
          atRisk: {
            $size: {
              $filter: {
                input: '$students',
                cond: { $in: ['$$this.riskLevel', ['MEDIUM', 'HIGH', 'CRITICAL']] }
              }
            }
          },
          atRiskStudents: {
            $size: {
              $filter: {
                input: '$students',
                cond: { $in: ['$$this.riskLevel', ['MEDIUM', 'HIGH', 'CRITICAL']] }
              }
            }
          },
          totalRiskFlags: { $size: '$riskFlags' },
          riskRate: {
            $cond: [
              { $gt: [{ $size: '$students' }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$students',
                            cond: { $in: ['$$this.riskLevel', ['MEDIUM', 'HIGH', 'CRITICAL']] }
                          }
                        }
                      },
                      { $size: '$students' }
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { totalStudents: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        // Basic counts
        totalUsers,
        totalSchools,
        totalStudents,
        totalClasses,
        atRiskStudents,
        pendingApprovals,
        activeUsers,
        
        // User roles
        userRoles: {
          superAdmin: superAdmins,
          admin: admins,
          teacher: teachers
        },
        
        // Attendance
        attendance: {
          rate: attendanceRate,
          total: attendance.totalRecords,
          present: attendance.present,
          absent: attendance.absent,
          excused: attendance.excused
        },
        
        // Performance
        performance: {
          averageScore: Math.round(performance.averageScore || 0),
          passingRate: Math.round((performance.passingRate || 0) * 100),
          totalRecords: performance.totalRecords
        },
        
        // Risk flags
        riskFlags: {
          total: riskFlags.total,
          critical: riskFlags.critical,
          high: riskFlags.high,
          medium: riskFlags.medium,
          low: riskFlags.low
        },
        
        // Interventions
        interventions: {
          total: interventions.total,
          planned: interventions.planned,
          inProgress: interventions.inProgress,
          completed: interventions.completed,
          cancelled: interventions.cancelled
        },
        
        // Messages
        messages: {
          total: messages.total,
          sent: messages.sent,
          delivered: messages.delivered,
          failed: messages.failed,
          pending: messages.pending
        },
        
        // Attendance Trend
        attendanceTrend: attendanceTrend,
        
        // Performance Trend
        performanceTrend: performanceTrend,
        
        // Combined Attendance & Performance Trend (for combined chart)
        combinedTrend: attendanceTrend.map((att, index) => {
          const perf = performanceTrend[index] || { performance: 0 };
          return {
            week: att.week,
            attendance: att.attendance,
            performance: perf.performance,
            attendanceTarget: att.target,
            performanceTarget: perf.target || 70
          };
        }),
        
        // School performance
        schoolPerformance
      }
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system statistics'
    });
  }
});

// @route   GET /api/dashboard/risk-summary
// @desc    Get system-wide risk summary (Super Admin only)
// @access  Private (Super Admin)
router.get('/risk-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.'
      });
    }

    const RiskFlag = require('../models/RiskFlag');
    const Student = require('../models/Student');

    // Get risk flags summary
    const riskFlags = await RiskFlag.find({ isActive: true });
    const students = await Student.find({ isActive: true });

    const riskSummary = {
      totalRisks: riskFlags.length,
      criticalRisks: riskFlags.filter(r => r.severity === 'CRITICAL').length,
      highRisks: riskFlags.filter(r => r.severity === 'HIGH').length,
      mediumRisks: riskFlags.filter(r => r.severity === 'MEDIUM').length,
      lowRisks: riskFlags.filter(r => r.severity === 'LOW').length,
      bySchool: []
    };

    // Get risks by school
    const schools = await User.distinct('schoolName', { schoolName: { $exists: true, $ne: null } });
    
    for (const schoolName of schools) {
      const schoolRisks = riskFlags.filter(r => r.schoolName === schoolName);
      const schoolStudents = students.filter(s => s.schoolName === schoolName);
      const atRiskStudents = schoolStudents.filter(s => ['MEDIUM', 'HIGH'].includes(s.riskLevel));
      
      riskSummary.bySchool.push({
        schoolName,
        totalRisks: schoolRisks.length,
        atRiskStudents: atRiskStudents.length,
        totalStudents: schoolStudents.length,
        riskRate: schoolStudents.length > 0 ? Math.round((atRiskStudents.length / schoolStudents.length) * 100) : 0
      });
    }

    res.json({
      success: true,
      data: riskSummary
    });
  } catch (error) {
    console.error('Risk summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk summary'
    });
  }
});

// @route   GET /api/dashboard/all-schools
// @desc    Get all schools with statistics (Super Admin only)
// @access  Private (Super Admin)
router.get('/all-schools', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.'
      });
    }

    const School = require('../models/School');
    const User = require('../models/User');
    const Student = require('../models/Student');
    const Class = require('../models/Class');

    const schools = await School.find({ isActive: true })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    // Get statistics for each school
    const schoolsWithStats = await Promise.all(schools.map(async (school) => {
      // Count users by role
      const totalUsers = await User.countDocuments({ 
        schoolId: school._id, 
        isActive: true 
      });
      const admins = await User.countDocuments({ 
        schoolId: school._id, 
        role: 'ADMIN',
        isActive: true 
      });
      const teachers = await User.countDocuments({ 
        schoolId: school._id, 
        role: 'TEACHER',
        isActive: true 
      });

      // Count students
      const totalStudents = await Student.countDocuments({ 
        schoolId: school._id, 
        isActive: true 
      });

      // Count classes
      const totalClasses = await Class.countDocuments({ 
        schoolId: school._id, 
        isActive: true 
      });

      return {
        ...school,
        totalUsers,
        admins,
        teachers,
        totalStudents,
        totalClasses
      };
    }));

    res.json({
      success: true,
      data: schoolsWithStats
    });
  } catch (error) {
    console.error('Get all schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools'
    });
  }
});

// @route   GET /api/dashboard/all-users
// @desc    Get all users with statistics (Super Admin only)
// @access  Private (Super Admin)
router.get('/all-users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.'
      });
    }

    const users = await User.find()
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .populate('schoolId', 'name district sector')
      .sort({ createdAt: -1 })
      .lean();

    // Transform users to include school information in the expected format
    const transformedUsers = users.map(user => {
      const userObj = { ...user };
      
      // If schoolId is populated (it's an object), extract the school data
      if (user.schoolId && typeof user.schoolId === 'object' && user.schoolId.name) {
        userObj.schoolName = user.schoolId.name;
        userObj.schoolDistrict = user.schoolId.district || null;
        userObj.schoolSector = user.schoolId.sector || null;
      } else if (user.schoolId) {
        // If schoolId exists but wasn't populated (school might have been deleted)
        // This shouldn't happen normally, but handle it gracefully
        userObj.schoolName = null;
        userObj.schoolDistrict = null;
        userObj.schoolSector = null;
      }
      // For SUPER_ADMIN users, schoolId might be null/undefined - that's expected
      
      return userObj;
    });

    res.json({
      success: true,
      data: transformedUsers
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// @route   GET /api/dashboard/system-risk-summary
// @desc    Get system-wide risk summary (Super Admin only)
// @access  Private (Super Admin)
router.get('/system-risk-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.'
      });
    }

    const RiskFlag = require('../models/RiskFlag');
    const Student = require('../models/Student');

    // Get risk flags summary
    const riskFlags = await RiskFlag.find({ isActive: true });
    const students = await Student.find({ isActive: true });

    const riskSummary = {
      totalAtRisk: students.filter(s => ['MEDIUM', 'HIGH', 'CRITICAL'].includes(s.riskLevel)).length,
      totalRisks: riskFlags.length,
      critical: riskFlags.filter(r => r.severity === 'CRITICAL').length,
      high: riskFlags.filter(r => r.severity === 'HIGH').length,
      medium: riskFlags.filter(r => r.severity === 'MEDIUM').length,
      low: riskFlags.filter(r => r.severity === 'LOW').length,
      byType: {
        attendance: riskFlags.filter(r => r.type === 'ATTENDANCE').length,
        performance: riskFlags.filter(r => r.type === 'PERFORMANCE').length,
        behavior: riskFlags.filter(r => r.type === 'BEHAVIOR').length,
        socioeconomic: riskFlags.filter(r => r.type === 'SOCIOECONOMIC').length,
        combined: riskFlags.filter(r => r.type === 'COMBINED').length,
        other: riskFlags.filter(r => r.type === 'OTHER').length
      }
    };

    res.json({
      success: true,
      data: riskSummary
    });
  } catch (error) {
    console.error('System risk summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk summary'
    });
  }
});

// @route   GET /api/dashboard/school-admin-stats
// @desc    Get school admin dashboard statistics
// @access  Private (Admin)
router.get('/school-admin-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const School = require('../models/School');
    const Class = require('../models/Class');
    const Attendance = require('../models/Attendance');
    const Performance = require('../models/Performance');
    const RiskFlag = require('../models/RiskFlag');
    const Intervention = require('../models/Intervention');
    const Message = require('../models/Message');

    const schoolId = req.user.schoolId;
    const schoolName = req.user.schoolName;

    // Parallelize all independent queries
    const [
      school,
      teachers,
      pendingTeachers,
      totalStudents,
      atRiskStudents,
      totalClasses,
      classesWithTeachers
    ] = await Promise.all([
      School.findOne({ _id: schoolId, isActive: true }).lean(),
      User.find({ 
        schoolId, 
        role: 'TEACHER', 
        isActive: true 
      })
      .select('name email phone role teacherTitle profilePicture isApproved isActive createdAt assignedClasses')
      .sort({ createdAt: -1 })
      .lean(),
      User.find({ 
        schoolId, 
        role: 'TEACHER', 
        isApproved: false,
        isActive: true 
      })
      .select('name email phone role teacherTitle profilePicture isApproved isActive createdAt assignedClasses')
      .lean(),
      Student.countDocuments({ schoolId, isActive: true }),
      Student.countDocuments({ 
        schoolId, 
        isActive: true, 
        riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } 
      }),
      Class.countDocuments({ schoolId, isActive: true }),
      Class.countDocuments({ 
        schoolId, 
        isActive: true, 
        assignedTeacher: { $ne: null } 
      })
    ]);

    // Get attendance data (last 30 days) - normalized to UTC
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    
    // Parallelize all aggregations
    const [
      attendanceStats,
      performanceStats,
      riskStats,
      interventionStats,
      messageStats
    ] = await Promise.all([
      Attendance.aggregate([
        { $match: { schoolId, date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
            excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } }
          }
        }
      ]),
      Performance.aggregate([
        { $match: { schoolId } },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            averageScore: { $avg: '$score' },
            passingRate: {
              $avg: { $cond: [{ $gte: ['$score', 60] }, 1, 0] }
            }
          }
        }
      ]),
      RiskFlag.aggregate([
        { $match: { schoolId, isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            critical: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            medium: { $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] } },
            low: { $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                severity: '$severity'
              }
            }
          }
        }
      ]),
      Intervention.aggregate([
        { $match: { schoolId, isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            planned: { $sum: { $cond: [{ $eq: ['$status', 'PLANNED'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } }
          }
        }
      ]),
      Message.aggregate([
        { $match: { schoolId, sentAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const attendance = attendanceStats[0] || { totalRecords: 0, present: 0, late: 0, absent: 0, excused: 0 };
    // Attendance rate = (PRESENT + LATE) / total * 100 (LATE counts as present)
    const presentAndLate = (attendance.present || 0) + (attendance.late || 0);
    const attendanceRate = attendance.totalRecords > 0 ? 
      Math.round((presentAndLate / attendance.totalRecords) * 100) : 0;

    const performance = performanceStats[0] || { totalRecords: 0, averageScore: 0, passingRate: 0 };
    const riskFlagsRaw = riskStats[0] || { total: 0, critical: 0, high: 0, medium: 0, low: 0, byType: [] };
    
    // Process byType breakdown
    const byTypeCounts = {
      attendance: 0,
      performance: 0,
      behavior: 0,
      socioeconomic: 0,
      combined: 0,
      other: 0
    };
    
    if (riskFlagsRaw.byType && Array.isArray(riskFlagsRaw.byType)) {
      riskFlagsRaw.byType.forEach((item) => {
        const type = (item.type || 'OTHER').toUpperCase();
        if (type === 'ATTENDANCE') byTypeCounts.attendance++;
        else if (type === 'PERFORMANCE') byTypeCounts.performance++;
        else if (type === 'BEHAVIOR') byTypeCounts.behavior++;
        else if (type === 'SOCIOECONOMIC') byTypeCounts.socioeconomic++;
        else if (type === 'COMBINED') byTypeCounts.combined++;
        else byTypeCounts.other++;
      });
    }
    
    const riskFlags = {
      total: riskFlagsRaw.total || 0,
      critical: riskFlagsRaw.critical || 0,
      high: riskFlagsRaw.high || 0,
      medium: riskFlagsRaw.medium || 0,
      low: riskFlagsRaw.low || 0,
      byType: byTypeCounts
    };
    
    const interventions = interventionStats[0] || { total: 0, planned: 0, inProgress: 0, completed: 0, cancelled: 0 };
    const messages = messageStats[0] || { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };

    // Get attendance trend (weekly for last 6 weeks) - optimized with aggregation
    const weeks = 6;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeks * 7));
    
    // Use aggregation instead of fetching all records
    const attendanceTrendData = await Attendance.aggregate([
      {
        $match: {
          schoolId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          date: 1,
          status: 1,
          week: {
            $subtract: [
              weeks,
              {
                $floor: {
                  $divide: [
                    { $subtract: [endDate, '$date'] },
                    7 * 24 * 60 * 60 * 1000
                  ]
                }
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$week',
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);
    
    // Build weekly data map
    const attendanceRecords = attendanceTrendData;
    
    const weeklyData = new Map();
    const targetRate = 90;
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekKey = `W${weeks - i}`;
      weeklyData.set(weekKey, {
        week: weekKey,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: 0,
        target: targetRate
      });
    }
    
    attendanceRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const weekNum = Math.floor((endDate - recordDate) / (7 * 24 * 60 * 60 * 1000));
      
      if (weekNum >= 0 && weekNum < weeks) {
        const weekKey = `W${weeks - weekNum}`;
        const weekData = weeklyData.get(weekKey);
        
        if (weekData) {
          weekData.total++;
          if (record.status === 'PRESENT') {
            weekData.present++;
          } else if (record.status === 'LATE') {
            weekData.late++;
          } else if (record.status === 'ABSENT') {
            weekData.absent++;
          } else if (record.status === 'EXCUSED') {
            weekData.excused++;
          }
        }
      }
    });
    
    // Calculate attendance rates (LATE counts as present)
    const attendanceTrend = Array.from(weeklyData.values()).map(week => {
      const presentAndLate = (week.present || 0) + (week.late || 0);
      const attendanceRate = week.total > 0 
        ? Math.round((presentAndLate / week.total) * 100 * 10) / 10
        : 0;
      
      return {
        week: week.week,
        attendance: attendanceRate,
        target: week.target
      };
    });

    // Get class performance data - optimized aggregation
    // Include ALL classes (even those without students) for complete real-time data
    const currentYear = new Date().getFullYear();
    
    // Get all active classes for the school
    const allClasses = await Class.aggregate([
      { $match: { schoolId, isActive: true } },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'classId',
          as: 'students',
          pipeline: [
            { $match: { isActive: true } }
          ]
        }
      },
      {
        $project: {
          name: '$className',
          totalStudents: { $size: '$students' },
          atRiskStudents: {
            $size: {
              $filter: {
                input: '$students',
                cond: { $in: ['$$this.riskLevel', ['MEDIUM', 'HIGH', 'CRITICAL']] }
              }
            }
          },
          studentIds: {
            $map: {
              input: '$students',
              as: 'student',
              in: '$$student._id'
            }
          },
          assignedTeacher: 1
        }
      },
      { $sort: { name: 1 } } // Sort alphabetically for consistent display
    ]);
    
    // Calculate average scores from performance records for all classes
    const classPerformance = await Promise.all(allClasses.map(async (cls) => {
      let averageScore = 0;
      
      if (cls.studentIds && cls.studentIds.length > 0) {
        // Get all performance records for students in this class
        const performanceRecords = await Performance.find({
          studentId: { $in: cls.studentIds },
          academicYear: { $gte: currentYear - 1 } // Include current and previous year
        }).select('score maxScore').lean();
        
        if (performanceRecords.length > 0) {
          // Calculate average percentage across all performance records
          let totalPercentage = 0;
          let validRecords = 0;
          
          performanceRecords.forEach(record => {
            if (record.maxScore && record.maxScore > 0) {
              const percentage = (record.score / record.maxScore) * 100;
              totalPercentage += percentage;
              validRecords++;
            }
          });
          
          if (validRecords > 0) {
            averageScore = Math.round(totalPercentage / validRecords);
          }
        }
      }
      
      return {
        name: cls.name,
        totalStudents: cls.totalStudents,
        atRiskStudents: cls.atRiskStudents,
        averageScore: averageScore,
        assignedTeacher: cls.assignedTeacher
      };
    }));

    res.json({
      success: true,
      data: {
        // School info
        school: {
          name: school?.name || schoolName,
          district: school?.district || req.user.schoolDistrict,
          sector: school?.sector || req.user.schoolSector
        },
        
        // Basic counts
        totalTeachers: teachers.length,
        pendingTeachers: pendingTeachers.length,
        totalStudents,
        totalClasses,
        classesWithTeachers,
        atRiskStudents,
        
        // Attendance
        attendance: {
          rate: attendanceRate,
          total: attendance.totalRecords,
          present: attendance.present,
          absent: attendance.absent,
          excused: attendance.excused
        },
        
        // Performance
        performance: {
          averageScore: Math.round(performance.averageScore || 0),
          passingRate: Math.round((performance.passingRate || 0) * 100),
          totalRecords: performance.totalRecords
        },
        
        // Risk flags
        riskFlags: {
          total: riskFlags.total,
          critical: riskFlags.critical,
          high: riskFlags.high,
          medium: riskFlags.medium,
          low: riskFlags.low,
          byType: riskFlags.byType
        },
        
        // Interventions
        interventions: {
          total: interventions.total,
          planned: interventions.planned,
          inProgress: interventions.inProgress,
          completed: interventions.completed,
          cancelled: interventions.cancelled
        },
        
        // Messages
        messages: {
          total: messages.total,
          sent: messages.sent,
          delivered: messages.delivered,
          failed: messages.failed,
          pending: messages.pending
        },
        
        // Attendance Trend
        attendanceTrend: attendanceTrend,
        
        // Class performance
        classPerformance,
        
        // Teachers list
        teachers: teachers.map(teacher => ({
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          className: teacher.className,
          isApproved: teacher.isApproved,
          isActive: teacher.isActive,
          createdAt: teacher.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('School admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school admin statistics'
    });
  }
});

// @route   GET /api/dashboard/teacher-stats
// @desc    Get teacher dashboard statistics
// @access  Private (Teacher)
router.get('/teacher-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher only.'
      });
    }

    const Class = require('../models/Class');
    const Attendance = require('../models/Attendance');
    const Performance = require('../models/Performance');
    const RiskFlag = require('../models/RiskFlag');
    const Intervention = require('../models/Intervention');
    const Message = require('../models/Message');

    const teacherId = req.user._id;
    const schoolId = req.user.schoolId;

    // Parallelize initial queries
    const [
      classes,
      teacherStudents,
      totalStudents,
      atRiskStudents
    ] = await Promise.all([
      Class.find({ 
        assignedTeacher: teacherId, 
        isActive: true 
      }).sort({ className: 1 }).lean(),
      Student.find({ 
        assignedTeacher: teacherId, 
        isActive: true 
      }).select('_id').lean(),
      Student.countDocuments({ 
        assignedTeacher: teacherId, 
        isActive: true 
      }),
      Student.countDocuments({ 
        assignedTeacher: teacherId, 
        isActive: true, 
        riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } 
      })
    ]);
    
    const teacherStudentIds = teacherStudents.map(s => s._id);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    
    // Parallelize all aggregations - only run if we have students
    const aggregationPromises = teacherStudentIds.length > 0 ? [
      Attendance.aggregate([
        { 
          $match: { 
            studentId: { $in: teacherStudentIds },
            date: { $gte: thirtyDaysAgo } 
          } 
        },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
            excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } }
          }
        }
      ]),
      Performance.aggregate([
        { $match: { studentId: { $in: teacherStudentIds } } },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            averageScore: { $avg: '$score' },
            passingRate: {
              $avg: { $cond: [{ $gte: ['$score', 60] }, 1, 0] }
            }
          }
        }
      ]),
      RiskFlag.aggregate([
        { 
          $match: { 
            schoolId, 
            isActive: true,
            studentId: { $in: teacherStudentIds }
          } 
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            critical: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            medium: { $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] } },
            low: { $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] } }
          }
        }
      ])
    ] : [
      Promise.resolve([]),
      Promise.resolve([]),
      Promise.resolve([])
    ];
    
    const [
      attendanceStats,
      performanceStats,
      riskStats,
      interventionStats,
      messageStats
    ] = await Promise.all([
      ...aggregationPromises,
      Intervention.aggregate([
        { 
          $match: { 
            schoolId, 
            isActive: true,
            assignedTo: teacherId
          } 
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            planned: { $sum: { $cond: [{ $eq: ['$status', 'PLANNED'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } }
          }
        }
      ]),
      Message.aggregate([
        { $match: { sentBy: teacherId, sentAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const attendance = attendanceStats[0] || { totalRecords: 0, present: 0, late: 0, absent: 0, excused: 0 };
    const presentAndLate = (attendance.present || 0) + (attendance.late || 0);
    const attendanceRate = attendance.totalRecords > 0 ? 
      Math.round((presentAndLate / attendance.totalRecords) * 100) : 0;

    const performance = performanceStats[0] || { totalRecords: 0, averageScore: 0, passingRate: 0 };
    const riskFlags = riskStats[0] || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    const interventions = interventionStats[0] || { total: 0, planned: 0, inProgress: 0, completed: 0, cancelled: 0 };
    const messages = messageStats[0] || { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };

    // Get attendance trend (weekly for last 6 weeks)
    const weeks = 6;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeks * 7));
    
    const students = await Student.find({ 
      assignedTeacher: teacherId, 
      isActive: true 
    }).select('_id');
    const studentIds = students.map(s => s._id);
    
    const attendanceRecords = studentIds.length > 0 ? await Attendance.find({
      studentId: { $in: studentIds },
      date: { $gte: startDate, $lte: endDate }
    }).select('date status') : [];
    
    const weeklyData = new Map();
    const targetRate = 90;
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekKey = `W${weeks - i}`;
      weeklyData.set(weekKey, {
        week: weekKey,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: 0,
        target: targetRate
      });
    }
    
    attendanceRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const weekNum = Math.floor((endDate - recordDate) / (7 * 24 * 60 * 60 * 1000));
      
      if (weekNum >= 0 && weekNum < weeks) {
        const weekKey = `W${weeks - weekNum}`;
        const weekData = weeklyData.get(weekKey);
        
        if (weekData) {
          weekData.total++;
          if (record.status === 'PRESENT') {
            weekData.present++;
          } else if (record.status === 'LATE') {
            weekData.late++;
          } else if (record.status === 'ABSENT') {
            weekData.absent++;
          } else if (record.status === 'EXCUSED') {
            weekData.excused++;
          }
        }
      }
    });
    
    // Calculate attendance rates (LATE counts as present)
    const attendanceTrend = Array.from(weeklyData.values()).map(week => {
      const presentAndLate = (week.present || 0) + (week.late || 0);
      const attendanceRate = week.total > 0 
        ? Math.round((presentAndLate / week.total) * 100 * 10) / 10
        : 0;
      
      return {
        week: week.week,
        attendance: attendanceRate,
        target: week.target
      };
    });

    // Get at-risk students details
    const atRiskStudentsList = await Student.find({
      assignedTeacher: teacherId,
      isActive: true,
      riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] }
    })
    .select('firstName lastName className riskLevel riskFlags')
    .collation({ locale: 'en', strength: 2 }) // Case-insensitive sorting
    .sort({ riskLevel: -1, lastName: 1, firstName: 1 })
    .limit(10);

    // Get low score alerts
    const lowScoreAlerts = await Performance.aggregate([
      { $match: { assignedTeacher: teacherId, score: { $lt: 60 } } },
      { $sort: { score: 1, createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: 1,
          subject: 1,
          score: 1,
          grade: 1,
          createdAt: 1,
          student: {
            _id: 1,
            firstName: 1,
            lastName: 1
          }
        }
      }
    ]);

    // Get teacher's interventions
    const teacherInterventions = await Intervention.find({
      assignedTo: teacherId,
      isActive: true
    })
    .populate('studentId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        // Teacher info
        teacher: {
          name: req.user.name,
          email: req.user.email,
          className: req.user.className,
          schoolName: req.user.schoolName
        },
        
        // Basic counts
        totalStudents,
        atRiskStudents,
        totalClasses: classes.length,
        
        // Attendance
        attendance: {
          rate: attendanceRate,
          total: attendance.totalRecords,
          present: attendance.present,
          absent: attendance.absent,
          excused: attendance.excused
        },
        
        // Performance
        performance: {
          averageScore: Math.round(performance.averageScore || 0),
          passingRate: Math.round((performance.passingRate || 0) * 100),
          totalRecords: performance.totalRecords
        },
        
        // Risk flags
        riskFlags: {
          total: riskFlags.total,
          critical: riskFlags.critical,
          high: riskFlags.high,
          medium: riskFlags.medium,
          low: riskFlags.low
        },
        
        // Interventions
        interventions: {
          total: interventions.total,
          planned: interventions.planned,
          inProgress: interventions.inProgress,
          completed: interventions.completed,
          cancelled: interventions.cancelled
        },
        
        // Messages
        messages: {
          total: messages.total,
          sent: messages.sent,
          delivered: messages.delivered,
          failed: messages.failed,
          pending: messages.pending
        },
        
        // Attendance Trend
        attendanceTrend: attendanceTrend,
        
        // Classes with real-time student counts and at-risk counts
        classes: await Promise.all(classes.map(async (cls) => {
          const studentCount = await Student.countDocuments({ 
            classId: cls._id, 
            isActive: true 
          });
          const atRiskCount = await Student.countDocuments({ 
            classId: cls._id, 
            isActive: true,
            riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] }
          });
          
          // Calculate average score for this class from actual performance records
          const currentYear = new Date().getFullYear();
          const currentAcademicYear = `${currentYear}-${currentYear + 1}`;
          
          const classStudents = await Student.find({ 
            classId: cls._id, 
            isActive: true 
          }).select('_id').lean();
          
          const studentIds = classStudents.map(s => s._id);
          
          let averageScore = 0;
          if (studentIds.length > 0) {
            // Get all performance records for students in this class
            const performanceRecords = await Performance.find({
              studentId: { $in: studentIds },
              academicYear: { $gte: currentYear - 1 } // Include current and previous year
            }).select('score maxScore').lean();
            
            if (performanceRecords.length > 0) {
              // Calculate average percentage across all performance records
              let totalPercentage = 0;
              let validRecords = 0;
              
              performanceRecords.forEach(record => {
                if (record.maxScore && record.maxScore > 0) {
                  const percentage = (record.score / record.maxScore) * 100;
                  totalPercentage += percentage;
                  validRecords++;
                }
              });
              
              if (validRecords > 0) {
                averageScore = Math.round(totalPercentage / validRecords);
              }
            }
          }
          
          return {
          _id: cls._id,
            name: cls.className || cls.name,
            studentCount: studentCount,
            atRiskCount: atRiskCount,
            averageScore: averageScore
          };
        })),
        
        // At-risk students
        atRiskStudents: atRiskStudentsList.map(student => ({
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          className: student.className,
          riskLevel: student.riskLevel,
          reason: student.riskFlags[0]?.description || 'No specific reason provided'
        })),
        
        // Low score alerts
        lowScoreAlerts: lowScoreAlerts.map(alert => ({
          _id: alert._id,
          subject: alert.subject,
          score: alert.score,
          grade: alert.grade,
          createdAt: alert.createdAt,
          student: alert.student
        })),
        
        // Teacher interventions
        teacherInterventions: teacherInterventions.map(intervention => ({
          _id: intervention._id,
          title: intervention.title,
          description: intervention.description,
          status: intervention.status,
          priority: intervention.priority,
          dueDate: intervention.dueDate,
          student: intervention.studentId
        }))
      }
    });
  } catch (error) {
    console.error('Teacher stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher statistics'
    });
  }
});

module.exports = router;
