const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken, authorize, canAccessClass, canAccessSchool } = require('../middleware/auth');
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

// @route   GET /api/classes/:id/students
// @desc    Get students in a specific class
// @access  Private (Admin, Super Admin, Teacher)
// NOTE: This route must come before /:id to ensure proper matching
router.get('/:id/students', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Get class details
    const classData = await Class.findById(classId)
      .populate('schoolId', 'name district sector')
      .populate('assignedTeacher', 'name email role teacherTitle');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'ADMIN' && classData.schoolId && !classData.schoolId._id.equals(req.user.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view classes from your school.'
      });
    }

    if (req.user.role === 'TEACHER' && classData.assignedTeacher?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your assigned class.'
      });
    }

    // Get students in this class using classId (not classroomId)
    const students = await Student.find({ 
      classId: classId, 
      isActive: true 
    })
    .populate('classId', 'className name grade section')
    .select('firstName lastName studentId gender age dateOfBirth riskLevel guardianContacts address socioEconomic createdAt profilePicture')
    .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class students'
    });
  }
});

// @route   GET /api/classes/:id
// @desc    Get specific class details
// @access  Private (Admin, Super Admin, Teacher)
router.get('/:id', authenticateToken, canAccessClass, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTeacher', 'name email role teacherTitle')
      .populate('schoolId', 'name district sector');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: classData
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
    
    if (!className || !className.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Class name is required'
      });
    }

    // Parse className to extract grade and section
    // Examples: "P1 B" -> grade: "P1", section: "B"
    //           "P1" -> grade: "P1", section: "A" (default)
    //           "S6 Science" -> grade: "S6", section: "Science"
    //           "S3 PCB" -> grade: "S3", section: "PCB"
    const trimmedName = className.trim();
    let grade = trimmedName; // Default to className if parsing fails
    let section = 'A'; // Default section
    
    // Try to extract grade and section from className
    // Pattern: Grade (P1, S1, etc.) followed by optional section/stream
    const gradeSectionPattern = /^([PS]\d+)\s*(.+)?$/i;
    const match = trimmedName.match(gradeSectionPattern);
    
    if (match) {
      grade = match[1] || trimmedName; // P1, S6, etc. or fallback to className
      section = match[2] ? match[2].trim() : 'A'; // Section or default to 'A'
    } else {
      // If pattern doesn't match, try splitting by space
      const parts = trimmedName.split(/\s+/).filter(p => p.length > 0);
      if (parts.length >= 2) {
        // First part might be grade, second part is section
        const firstPart = parts[0];
        if (/^[PS]\d+$/i.test(firstPart)) {
          grade = firstPart;
          section = parts.slice(1).join(' '); // Join remaining parts as section
        } else {
          // If doesn't match pattern, use first part as grade, second as section
          grade = parts[0] || trimmedName;
          section = parts[1] || 'A';
        }
      } else if (parts.length === 1) {
        // Single word - try to extract grade, default section
        const singleWordMatch = trimmedName.match(/^([PS]\d+)/i);
        if (singleWordMatch) {
          grade = singleWordMatch[1];
          section = 'A';
        } else {
          // Last resort: use the whole string as grade, default section
          grade = trimmedName;
          section = 'A';
        }
      }
    }
    
    // Ensure grade and section are never empty or undefined
    if (!grade || grade.trim() === '') {
      grade = trimmedName;
    }
    if (!section || section.trim() === '') {
      section = 'A';
    }
    
    // Check if class already exists in the school
    const existingClass = await Class.findOne({
      className: trimmedName,
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
      className: trimmedName,
      grade: grade.trim(), // Ensure it's trimmed
      section: section.trim(), // Ensure it's trimmed
      schoolId: req.user.schoolId,
      createdBy: req.user._id
    });

    try {
      await newClass.save();
    } catch (saveError) {
      console.error('Create class validation error:', saveError);
      // Return more detailed validation errors
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors || {}).map(key => ({
          field: key,
          message: saveError.errors[key].message
        }));
        return res.status(400).json({
          success: false,
          message: 'Class validation failed',
          errors: validationErrors
        });
      }
      throw saveError; // Re-throw if it's not a validation error
    }

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class (Admin, Super Admin only)
// @access  Private (Admin, Super Admin)
router.put('/:id', authenticateToken, authorize('ADMIN', 'SUPER_ADMIN'), canAccessClass, [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Class name cannot be empty'),
  body('grade').optional().trim().isLength({ min: 1 }).withMessage('Class grade cannot be empty'),
  body('section').optional().trim().isLength({ min: 1 }).withMessage('Class section cannot be empty'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const classId = req.params.id;
    const { name, grade, section, description, className } = req.body;
    const classData = req.classData; // From canAccessClass middleware

    // Check for duplicate if updating name/grade/section
    if (name || grade || section || className) {
      const updateName = className || name || classData.className;
      const updateGrade = grade || classData.grade;
      const updateSection = section || classData.section;

      const existingClass = await Class.findOne({
        _id: { $ne: classId },
        className: updateName,
        grade: updateGrade,
        section: updateSection,
        schoolId: classData.schoolId,
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
    if (className) updateData.className = className;
    if (name) updateData.name = name;
    if (grade) updateData.grade = grade;
    if (section) updateData.section = section;
    if (description !== undefined) updateData.description = description;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role')
     .populate('assignedTeacher', 'name email role teacherTitle')
     .populate('schoolId', 'name district sector');

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
// @desc    Delete class (Admin, Super Admin only)
// @access  Private (Admin, Super Admin)
router.delete('/:id', authenticateToken, authorize('ADMIN', 'SUPER_ADMIN'), canAccessClass, async (req, res) => {
  try {
    const classId = req.params.id;
    const classData = req.classData; // From canAccessClass middleware

    // Check if class has students
    const studentCount = await Student.countDocuments({ classId: classId, isActive: true });
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
// @desc    Assign teacher to class (Admin, Super Admin only)
// @access  Private (Admin, Super Admin)
router.post('/:id/assign-teacher', authenticateToken, authorize('ADMIN', 'SUPER_ADMIN'), canAccessClass, [
  body('teacherId').isMongoId().withMessage('Valid teacher ID is required')
], async (req, res) => {
  try {
    const classId = req.params.id;
    const { teacherId } = req.body;
    const classData = req.classData; // From canAccessClass middleware

    // Check if teacher exists and belongs to the same school
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(400).json({
        success: false,
        message: 'Teacher not found or invalid role'
      });
    }

    // Check if teacher belongs to the same school (for ADMIN, SUPER_ADMIN can assign any teacher)
    if (req.user.role === 'ADMIN' && !canAccessSchool(req.user.schoolId, teacher.schoolId, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher must belong to your school.'
      });
    }

    // Check if class belongs to teacher's school
    const classSchoolId = classData.schoolId?._id || classData.schoolId;
    if (!canAccessSchool(teacher.schoolId, classSchoolId, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Teacher and class must belong to the same school'
      });
    }

    // Update class with assigned teacher
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { assignedTeacher: teacherId },
      { new: true }
    ).populate('assignedTeacher', 'name email role teacherTitle');

    // Also update teacher's assignedClasses and className fields
    if (!teacher.assignedClasses.includes(classId)) {
      teacher.assignedClasses.push(classId);
      teacher.className = classData.className;
      teacher.classGrade = classData.grade;
      teacher.classSection = classData.section;
      await teacher.save();
    }

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

// @route   GET /api/classes/teacher/my-classes
// @desc    Get teacher's assigned classes for student registration
// @access  Private (Teacher)
router.get('/teacher/my-classes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers can access this endpoint.'
      });
    }

    // Get classes assigned to this teacher
    const classes = await Class.find({
      assignedTeacher: req.user._id,
      isActive: true
    })
      .populate('schoolId', 'name district sector')
      .select('_id className name grade section studentCount')
      .sort({ grade: 1, name: 1, section: 1 });

    // If no classes assigned, get classes from user's assignedClasses
    if (classes.length === 0 && req.user.assignedClasses && req.user.assignedClasses.length > 0) {
      const classIds = req.user.assignedClasses;
      const assignedClasses = await Class.find({
        _id: { $in: classIds },
        isActive: true
      })
        .populate('schoolId', 'name district sector')
        .select('_id className name grade section studentCount')
        .sort({ grade: 1, name: 1, section: 1 });
      
      return res.json({
        success: true,
        data: assignedClasses
      });
    }

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher classes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;