const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
// const { testDropoutDetection } = require('../scripts/testDropoutDetection'); // Deleted script
const riskDetectionService = require('../services/riskDetectionService');
const { notifyParentsOfRisk } = require('../utils/notificationService');
const Student = require('../models/Student');
const User = require('../models/User');

const router = express.Router();

// Function to generate sample data and test dropout detection
async function generateSampleDataAndTest(teacherId) {
  try {
    // Generate 5 sample Rwandan students
    const sampleStudents = [
      {
        firstName: 'Jean',
        lastName: 'Mukamana',
        gender: 'F',
        age: 16,
        dob: '2007-05-15',
        classroomId: 'class1',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        address: {
          district: 'Kigali City',
          sector: 'Nyarugenge',
          cell: 'Nyakabanda',
          village: 'Kimisagara'
        },
        socioEconomic: {
          ubudeheLevel: 3,
          hasParents: true,
          parentJob: 'Farmer',
          familyConflict: false,
          numberOfSiblings: 3,
          parentEducationLevel: 'Primary'
        },
        guardianContacts: [
          {
            name: 'Mukamana Jean',
            relation: 'Father',
            phone: '+250788123456',
            email: 'jean.mukamana@email.com',
            isPrimary: true
          }
        ],
        assignedTeacherId: teacherId,
        isActive: true
      },
      {
        firstName: 'Paul',
        lastName: 'Nkurunziza',
        gender: 'M',
        age: 17,
        dob: '2006-08-20',
        classroomId: 'class1',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        address: {
          district: 'Kigali City',
          sector: 'Nyarugenge',
          cell: 'Nyakabanda',
          village: 'Kimisagara'
        },
        socioEconomic: {
          ubudeheLevel: 4,
          hasParents: false,
          parentJob: 'Unemployed',
          familyConflict: true,
          numberOfSiblings: 5,
          parentEducationLevel: 'None'
        },
        guardianContacts: [
          {
            name: 'Nkurunziza Marie',
            relation: 'Mother',
            phone: '+250788789012',
            isPrimary: true
          }
        ],
        assignedTeacherId: teacherId,
        isActive: true
      }
    ];

    // Create students in database
    const createdStudents = await Student.insertMany(sampleStudents);
    console.log(`✅ Created ${createdStudents.length} sample students`);

    // Run risk detection for each student
    const riskResults = [];
    for (const student of createdStudents) {
      const risks = await riskDetectionService.detectRisksForStudent(
        student._id,
        student.schoolName,
        teacherId
      );
      riskResults.push({
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        risks: risks
      });
    }

    return {
      studentsCreated: createdStudents.length,
      riskDetectionResults: riskResults,
      message: 'Sample data generated and risk detection completed'
    };

  } catch (error) {
    console.error('Error in generateSampleDataAndTest:', error);
    throw error;
  }
}

// @route   POST /api/test/dropout-detection
// @desc    Run dropout detection test with sample data
// @access  Private (Admin only)
router.post('/dropout-detection', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🚀 Starting dropout detection test...');
    
    // Generate sample data and test dropout detection
    const result = await generateSampleDataAndTest(req.user._id);
    
    res.json({
      success: true,
      message: 'Dropout detection test completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// @route   GET /api/test/students
// @desc    Get test students for testing interface
// @access  Private (Admin, Teacher)
router.get('/students', authenticateToken, async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .populate('schoolId', 'name')
      .populate('assignedTeacherId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get test students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test students'
    });
  }
});

// @route   POST /api/test/risk-detection/:studentId
// @desc    Run risk detection for specific student
// @access  Private (Admin, Teacher)
router.post('/risk-detection/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { schoolId } = req.user;

    // Run risk detection for the specific student
    const result = await riskDetectionService.detectRisksForStudent(
      studentId,
      schoolId,
      req.user._id
    );

    // If risks were detected, send notifications
    if (result.flagsCreated > 0) {
      const student = await Student.findById(studentId);
      if (student) {
        await notifyParentsOfRisk(
          studentId,
          'HIGH',
          'Risk factors detected through automated analysis'
        );
      }
    }

    res.json({
      success: true,
      message: 'Risk detection completed',
      data: result
    });
  } catch (error) {
    console.error('Risk detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Risk detection failed',
      error: error.message
    });
  }
});

// @route   POST /api/test/notify-parents/:studentId
// @desc    Send test notification to parents
// @access  Private (Admin, Teacher)
router.post('/notify-parents/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { riskLevel = 'HIGH', message = 'Test notification from EduGuard system' } = req.body;

    const result = await notifyParentsOfRisk(studentId, riskLevel, message);

    res.json({
      success: true,
      message: 'Parent notifications sent',
      data: result
    });
  } catch (error) {
    console.error('Parent notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send parent notifications',
      error: error.message
    });
  }
});

// @route   GET /api/test/risk-flags
// @desc    Get risk flags for testing
// @access  Private (Admin, Teacher)
router.get('/risk-flags', authenticateToken, async (req, res) => {
  try {
    const RiskFlag = require('../models/RiskFlag');
    const riskFlags = await RiskFlag.find({ isActive: true })
      .populate('studentId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: riskFlags
    });
  } catch (error) {
    console.error('Get risk flags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk flags'
    });
  }
});

// @route   GET /api/test/notifications
// @desc    Get notifications for testing
// @access  Private (Admin, Teacher)
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const NotificationHistory = require('../models/NotificationHistory');
    const notifications = await NotificationHistory.find()
      .populate('studentId', 'firstName lastName')
      .sort({ sentAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// @route   PUT /api/test/students/:id
// @desc    Update student details for testing
// @access  Private (Admin, Teacher)
router.put('/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user has access to this student
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'TEACHER' && student.assignedTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
});

// @route   DELETE /api/test/clear-data
// @desc    Clear test data
// @access  Private (Admin only)
router.delete('/clear-data', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    // Clear test data
    await Student.deleteMany({});
    await require('../models/Attendance').deleteMany({});
    await require('../models/Performance').deleteMany({});
    await require('../models/RiskFlag').deleteMany({});
    await require('../models/Message').deleteMany({});
    await require('../models/NotificationHistory').deleteMany({});

    res.json({
      success: true,
      message: 'Test data cleared successfully'
    });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear test data',
      error: error.message
    });
  }
});

module.exports = router;
