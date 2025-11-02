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
    
    let studentQuery = { schoolId: user.schoolId, isActive: true };
    let classQuery = { schoolId: user.schoolId, isActive: true };

    // Role-based filtering
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
    
    // Get teachers count (for admin only)
    let totalTeachers = 0;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      totalTeachers = await User.countDocuments({ 
        schoolId: user.schoolId, 
        role: 'TEACHER', 
        isActive: true 
      });
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
    
    const attendanceStats = await Attendance.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } }
        }
      }
    ]);

    const attendance = attendanceStats[0] || { totalRecords: 0, present: 0, absent: 0, excused: 0 };
    const attendanceRate = attendance.totalRecords > 0 ? 
      Math.round((attendance.present / attendance.totalRecords) * 100) : 0;

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

    // Get school performance data
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
          name: 1,
          district: 1,
          sector: 1,
          totalStudents: { $size: '$students' },
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
    const schools = await School.find({ isActive: true })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: schools
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
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
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

    // Get school data
    const school = await School.findOne({ _id: schoolId, isActive: true });

    // Get teachers data
    const teachers = await User.find({ 
      schoolId, 
      role: 'TEACHER', 
      isActive: true 
    }).sort({ createdAt: -1 });

    const pendingTeachers = await User.find({ 
      schoolId, 
      role: 'TEACHER', 
      isApproved: false,
      isActive: true 
    });

    // Get students data
    const totalStudents = await Student.countDocuments({ schoolId, isActive: true });
    const atRiskStudents = await Student.countDocuments({ 
      schoolId, 
      isActive: true, 
      riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } 
    });

    // Get classes data
    const totalClasses = await Class.countDocuments({ schoolId, isActive: true });
    const classesWithTeachers = await Class.countDocuments({ 
      schoolId, 
      isActive: true, 
      assignedTeacher: { $ne: null } 
    });

    // Get attendance data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceStats = await Attendance.aggregate([
      { $match: { schoolId, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } }
        }
      }
    ]);

    const attendance = attendanceStats[0] || { totalRecords: 0, present: 0, absent: 0, excused: 0 };
    const attendanceRate = attendance.totalRecords > 0 ? 
      Math.round((attendance.present / attendance.totalRecords) * 100) : 0;

    // Get performance data
    const performanceStats = await Performance.aggregate([
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
    ]);

    const performance = performanceStats[0] || { totalRecords: 0, averageScore: 0, passingRate: 0 };

    // Get risk flags data
    const riskStats = await RiskFlag.aggregate([
      { $match: { schoolId, isActive: true } },
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
    ]);

    const interventions = interventionStats[0] || { total: 0, planned: 0, inProgress: 0, completed: 0, cancelled: 0 };

    // Get messages data (last 30 days)
    const messageStats = await Message.aggregate([
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
    ]);

    const messages = messageStats[0] || { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };

    // Get class performance data - real-time from database
    const classPerformance = await Class.aggregate([
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
          averageScore: {
            $cond: {
              if: { $gt: [{ $size: '$students' }, 0] },
              then: {
                $avg: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$students',
                        cond: { $ifNull: ['$$this.averageScore', false] }
                      }
                    },
                    as: 'student',
                    in: '$$student.averageScore'
                  }
                }
              },
              else: 0
            }
          },
          assignedTeacher: 1
        }
      },
      { $sort: { totalStudents: -1 } },
      { $limit: 20 } // Limit to top 20 classes for better visualization
    ]);

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

    // Get teacher's classes
    const classes = await Class.find({ 
      assignedTeacher: teacherId, 
      isActive: true 
    }).sort({ className: 1 });

    // Get students assigned to this teacher
    const totalStudents = await Student.countDocuments({ 
      assignedTeacher: teacherId, 
      isActive: true 
    });

    const atRiskStudents = await Student.countDocuments({ 
      assignedTeacher: teacherId, 
      isActive: true, 
      riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } 
    });

    // Get attendance data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceStats = await Attendance.aggregate([
      { $match: { assignedTeacher: teacherId, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } }
        }
      }
    ]);

    const attendance = attendanceStats[0] || { totalRecords: 0, present: 0, absent: 0, excused: 0 };
    const attendanceRate = attendance.totalRecords > 0 ? 
      Math.round((attendance.present / attendance.totalRecords) * 100) : 0;

    // Get performance data
    const performanceStats = await Performance.aggregate([
      { $match: { assignedTeacher: teacherId } },
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

    // Get risk flags for teacher's students
    const riskStats = await RiskFlag.aggregate([
      { 
        $match: { 
          schoolId, 
          isActive: true,
          studentId: { $in: await Student.find({ assignedTeacher: teacherId }).distinct('_id') }
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
    ]);

    const riskFlags = riskStats[0] || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

    // Get interventions for teacher's students
    const interventionStats = await Intervention.aggregate([
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
    ]);

    const interventions = interventionStats[0] || { total: 0, planned: 0, inProgress: 0, completed: 0, cancelled: 0 };

    // Get messages sent by teacher (last 30 days)
    const messageStats = await Message.aggregate([
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
    ]);

    const messages = messageStats[0] || { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };

    // Get at-risk students details
    const atRiskStudentsList = await Student.find({
      assignedTeacher: teacherId,
      isActive: true,
      riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] }
    })
    .select('firstName lastName className riskLevel riskFlags')
    .sort({ riskLevel: -1, createdAt: -1 })
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
        
        // Classes
        classes: classes.map(cls => ({
          _id: cls._id,
          name: cls.className,
          studentCount: cls.studentCount || 0
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
