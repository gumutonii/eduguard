const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const Class = require('../models/Class');
const User = require('../models/User');
const Student = require('../models/Student');

const router = express.Router();

// @route   GET /api/classes
// @desc    Get classes (Admin: school classes, Super Admin: all classes)
// @access  Private (Admin, Super Admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Super Admin can see all classes, Admin sees only their school classes
    if (req.user.role === 'ADMIN') {
      query.schoolId = req.user.schoolId;
    }

    const classes = await Class.find(query)
      .populate('schoolId', 'name district sector')
      .populate('createdBy', 'name email role')
      .populate('assignedTeacher', 'name email role teacherTitle')
      .sort({ className: 1 });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes'
    });
  }
});

// @route   GET /api/classes/for-school
// @desc    Get classes for a specific school (for teacher registration)
// @access  Public
router.get('/for-school', async (req, res) => {
  try {
    const { schoolName } = req.query;

    if (!schoolName) {
      return res.status(400).json({
        success: false,
        message: 'School name is required'
      });
    }

    // First find the school by name to get its ID
    const School = require('../models/School');
    const school = await School.findOne({ 
      name: schoolName,
      isActive: true 
    }).select('_id');

    if (!school) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Find classes for the specified school using schoolId
    const classes = await Class.find({ 
      schoolId: school._id,
      isActive: true 
    })
    .select('_id className grade section roomName')
    .sort({ className: 1 });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get classes for school error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes for school'
    });
  }
});

// @route   GET /api/classes/:id
// @desc    Get specific class details
// @access  Private (Admin, Super Admin, Teacher)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.id;
    const classData = await Class.findById(classId)
      .populate('createdBy', 'name email role')
      .populate('assignedTeacher', 'name email role teacherTitle');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'ADMIN' && classData.schoolName !== req.user.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view classes from your school.'
      });
    }

    if (req.user.role === 'TEACHER' && classData.assignedTeacher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your assigned class.'
      });
    }

    // Get students in this class
    const students = await Student.find({ 
      classroomId: classId, 
      isActive: true 
    }).select('firstName lastName gender age riskLevel guardianContacts');

    res.json({
      success: true,
      data: {
        class: classData,
        students: students
      }
    });
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class details'
    });
  }
});

// @route   POST /api/classes
// @desc    Create new class (Admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, authorize('ADMIN'), [
  body('className').trim().isLength({ min: 1 }).withMessage('Class name is required')
], async (req, res) => {
  try {
    const { className } = req.body;
    
    // Check if class already exists in the school
    const existingClass = await Class.findOne({
      className,
      schoolId: req.user.schoolId,
      isActive: true
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'A class with this name already exists in your school'
      });
    }

    const newClass = new Class({
      className,
      schoolId: req.user.schoolId,
      createdBy: req.user._id
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create class'
    });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticateToken, authorize('ADMIN'), [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Class name cannot be empty'),
  body('grade').optional().trim().isLength({ min: 1 }).withMessage('Class grade cannot be empty'),
  body('section').optional().trim().isLength({ min: 1 }).withMessage('Class section cannot be empty'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const classId = req.params.id;
    const { name, grade, section, description } = req.body;

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if class belongs to admin's school
    if (classData.schoolName !== req.user.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update classes from your school.'
      });
    }

    // Check for duplicate if updating name/grade/section
    if (name || grade || section) {
      const existingClass = await Class.findOne({
        _id: { $ne: classId },
        name: name || classData.name,
        grade: grade || classData.grade,
        section: section || classData.section,
        schoolName: req.user.schoolName,
        isActive: true
      });

      if (existingClass) {
        return res.status(400).json({
          success: false,
          message: 'A class with this name, grade, and section already exists in your school'
        });
      }
    }

    // Update class
    const updateData = {};
    if (name) updateData.name = name;
    if (grade) updateData.grade = grade;
    if (section) updateData.section = section;
    if (description !== undefined) updateData.description = description;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role')
     .populate('assignedTeacher', 'name email role teacherTitle');

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update class'
    });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const classId = req.params.id;

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if class belongs to admin's school
    if (!classData.schoolId.equals(req.user.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete classes from your school.'
      });
    }

    // Check if class has students
    const studentCount = await Student.countDocuments({ classroomId: classId, isActive: true });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class. It has ${studentCount} active students. Please reassign or remove students first.`
      });
    }

    // Soft delete the class
    await Class.findByIdAndUpdate(classId, { isActive: false });

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete class'
    });
  }
});

// @route   POST /api/classes/:id/assign-teacher
// @desc    Assign teacher to class (Admin only)
// @access  Private (Admin)
router.post('/:id/assign-teacher', authenticateToken, authorize('ADMIN'), [
  body('teacherId').isMongoId().withMessage('Valid teacher ID is required')
], async (req, res) => {
  try {
    const classId = req.params.id;
    const { teacherId } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if class belongs to admin's school
    if (classData.schoolName !== req.user.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only assign teachers to classes in your school.'
      });
    }

    // Check if teacher exists and belongs to the same school
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'TEACHER' || teacher.schoolName !== req.user.schoolName) {
      return res.status(400).json({
        success: false,
        message: 'Teacher not found or does not belong to your school'
      });
    }

    // Update class with assigned teacher
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { assignedTeacher: teacherId },
      { new: true }
    ).populate('assignedTeacher', 'name email role teacherTitle');

    res.json({
      success: true,
      message: 'Teacher assigned to class successfully',
      data: updatedClass
    });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign teacher to class'
    });
  }
});

// @route   GET /api/classes/school/:schoolName
// @desc    Get classes by school (Super Admin only)
// @access  Private (Super Admin)
router.get('/school/:schoolName', authenticateToken, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { schoolName } = req.params;
    
    const classes = await Class.find({ schoolName, isActive: true })
      .populate('createdBy', 'name email role')
      .populate('assignedTeacher', 'name email role teacherTitle')
      .sort({ grade: 1, name: 1, section: 1 });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get school classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school classes'
    });
  }
});

module.exports = router;