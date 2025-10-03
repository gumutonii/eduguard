const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { authenticateToken, authorize, canAccessStudent } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students with filtering
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      classroomId, 
      riskLevel, 
      gender, 
      search,
      assignedTeacherId 
    } = req.query;

    let query = { schoolId: req.user.schoolId, isActive: true };

    // Role-based filtering
    if (req.user.role === 'TEACHER') {
      query.assignedTeacherId = req.user._id;
    }

    // Additional filters
    if (classroomId) query.classroomId = classroomId;
    if (riskLevel) query.riskLevel = riskLevel;
    if (gender) query.gender = gender;
    if (assignedTeacherId && req.user.role === 'ADMIN') {
      query.assignedTeacherId = assignedTeacherId;
    }

    // Search by name
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('assignedTeacherId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', authenticateToken, canAccessStudent, async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate('assignedTeacherId', 'name email')
      .populate('riskFlags.resolvedBy', 'name')
      .populate('notes.createdBy', 'name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student'
    });
  }
});

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin, Teacher)
router.post('/', [
  authenticateToken,
  authorize('ADMIN', 'TEACHER'),
  // Personal information validation
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('middleName').optional().trim().isLength({ max: 50 }).withMessage('Middle name cannot exceed 50 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('gender').isIn(['M', 'F']).withMessage('Invalid gender'),
  body('age').isInt({ min: 3, max: 25 }).withMessage('Age must be between 3 and 25'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('classroomId').notEmpty().withMessage('Classroom ID is required'),
  
  // Address validation
  body('address.district').notEmpty().withMessage('District is required'),
  body('address.sector').notEmpty().withMessage('Sector is required'),
  body('address.cell').notEmpty().withMessage('Cell is required'),
  body('address.village').notEmpty().withMessage('Village is required'),
  
  // Socio-economic validation
  body('socioEconomic.ubudeheLevel').isInt({ min: 1, max: 4 }).withMessage('Ubudehe level must be between 1 and 4'),
  body('socioEconomic.hasParents').isBoolean().withMessage('Has parents must be a boolean'),
  body('socioEconomic.guardianType').optional().isIn(['Parent', 'Sibling', 'Relative', 'Other']).withMessage('Invalid guardian type'),
  body('socioEconomic.parentJob').optional().trim().isLength({ max: 100 }).withMessage('Parent job cannot exceed 100 characters'),
  body('socioEconomic.familyConflict').isBoolean().withMessage('Family conflict must be a boolean'),
  body('socioEconomic.numberOfSiblings').isInt({ min: 0, max: 20 }).withMessage('Number of siblings must be between 0 and 20'),
  body('socioEconomic.parentEducationLevel').isIn(['None', 'Primary', 'Secondary', 'University', 'Other']).withMessage('Invalid parent education level'),
  
  // Guardian contacts validation
  body('guardianContacts').isArray({ min: 1 }).withMessage('At least one guardian contact is required'),
  body('guardianContacts.*.name').trim().notEmpty().withMessage('Guardian name is required'),
  body('guardianContacts.*.relation').isIn(['Father', 'Mother', 'Guardian', 'Sibling', 'Relative', 'Other']).withMessage('Invalid relation'),
  body('guardianContacts.*.phone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Valid phone number is required'),
  body('guardianContacts.*.email').optional().isEmail().withMessage('Valid email is required'),
  body('guardianContacts.*.job').optional().trim().isLength({ max: 100 }).withMessage('Job cannot exceed 100 characters'),
  body('guardianContacts.*.educationLevel').optional().isIn(['None', 'Primary', 'Secondary', 'University', 'Other']).withMessage('Invalid education level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const studentData = {
      ...req.body,
      schoolId: req.user.schoolId,
      assignedTeacherId: req.user.role === 'TEACHER' ? req.user._id : req.body.assignedTeacherId
    };

    // Ensure at least one guardian is primary
    if (!studentData.guardianContacts.some(contact => contact.isPrimary)) {
      studentData.guardianContacts[0].isPrimary = true;
    }

    // Calculate risk level based on socio-economic factors
    let riskScore = 0;
    
    // Ubudehe level scoring (higher level = lower risk)
    riskScore += (5 - studentData.socioEconomic.ubudeheLevel) * 2;
    
    // Family factors
    if (!studentData.socioEconomic.hasParents) riskScore += 3;
    if (studentData.socioEconomic.familyConflict) riskScore += 2;
    if (studentData.socioEconomic.numberOfSiblings > 5) riskScore += 1;
    
    // Parent education level
    const educationScore = {
      'None': 3,
      'Primary': 2,
      'Secondary': 1,
      'University': 0,
      'Other': 1
    };
    riskScore += educationScore[studentData.socioEconomic.parentEducationLevel] || 1;
    
    // Determine risk level
    if (riskScore >= 8) {
      studentData.riskLevel = 'HIGH';
    } else if (riskScore >= 5) {
      studentData.riskLevel = 'MEDIUM';
    } else {
      studentData.riskLevel = 'LOW';
    }

    const student = new Student(studentData);
    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('assignedTeacherId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: populatedStudent
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin, Teacher)
router.put('/:id', [
  authenticateToken,
  authorize('ADMIN', 'TEACHER'),
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('gender').optional().isIn(['M', 'F', 'Other']).withMessage('Invalid gender'),
  body('classroomId').optional().notEmpty().withMessage('Classroom ID cannot be empty'),
  body('assignedTeacherId').optional().isMongoId().withMessage('Valid assigned teacher ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Teachers can only update students assigned to them
    if (req.user.role === 'TEACHER') {
      const existingStudent = await Student.findById(id);
      if (!existingStudent || existingStudent.assignedTeacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this student'
        });
      }
    }

    const student = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTeacherId', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student'
    });
  }
});

// @route   POST /api/students/:id/risk-flags
// @desc    Add risk flag to student
// @access  Private (Admin, Teacher)
router.post('/:id/risk-flags', [
  authenticateToken,
  authorize('ADMIN', 'TEACHER'),
  body('type').isIn(['ATTENDANCE', 'PERFORMANCE', 'BEHAVIOR', 'FAMILY', 'OTHER']).withMessage('Invalid risk flag type'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('severity').isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid severity level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { type, description, severity } = req.body;

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

    await student.addRiskFlag({ type, description, severity }, req.user._id);

    const updatedStudent = await Student.findById(id)
      .populate('assignedTeacherId', 'name email')
      .populate('riskFlags.resolvedBy', 'name');

    res.json({
      success: true,
      message: 'Risk flag added successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Add risk flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add risk flag'
    });
  }
});

// @route   PUT /api/students/:id/risk-flags/:flagId/resolve
// @desc    Resolve risk flag
// @access  Private (Admin, Teacher)
router.put('/:id/risk-flags/:flagId/resolve', [
  authenticateToken,
  authorize('ADMIN', 'TEACHER')
], async (req, res) => {
  try {
    const { id, flagId } = req.params;

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

    await student.resolveRiskFlag(flagId, req.user._id);

    const updatedStudent = await Student.findById(id)
      .populate('assignedTeacherId', 'name email')
      .populate('riskFlags.resolvedBy', 'name');

    res.json({
      success: true,
      message: 'Risk flag resolved successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Resolve risk flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve risk flag'
    });
  }
});

// @route   POST /api/students/:id/notes
// @desc    Add note to student
// @access  Private
router.post('/:id/notes', [
  authenticateToken,
  body('content').trim().notEmpty().withMessage('Note content is required'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { content, isPrivate = false } = req.body;

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

    student.notes.push({
      content,
      createdBy: req.user._id,
      isPrivate
    });

    await student.save();

    const updatedStudent = await Student.findById(id)
      .populate('assignedTeacherId', 'name email')
      .populate('notes.createdBy', 'name');

    res.json({
      success: true,
      message: 'Note added successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note'
    });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student (soft delete)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student deactivated successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student'
    });
  }
});

module.exports = router;
