const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { authenticateToken, authorize, canAccessStudent } = require('../middleware/auth');
const multer = require('multer');
const csv = require('fast-csv');
const { stringify } = require('csv-stringify/sync');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Separate upload for profile pictures with size and type restrictions
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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
      assignedTeacher 
    } = req.query;

    let query = { isActive: true };

    // SUPER_ADMIN: Can see all students
    // ADMIN: Can see only their school's students
    // TEACHER: Can see only assigned students
    if (req.user.role === 'SUPER_ADMIN') {
      // No school filter for super admin
    } else if (req.user.role === 'ADMIN') {
      query.schoolId = req.user.schoolId;
    } else if (req.user.role === 'TEACHER') {
      // Teachers can see students assigned to them or in their assigned classes
      query.$or = [
        { assignedTeacher: req.user._id },
        { classId: { $in: req.user.assignedClasses || [] } }
      ];
    } else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Additional filters
    if (classroomId) query.classId = classroomId;
    if (riskLevel) query.riskLevel = riskLevel;
    if (gender) query.gender = gender;
    if (assignedTeacher && req.user.role === 'ADMIN') {
      query.assignedTeacher = assignedTeacher;
    }

    // Search by name
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('assignedTeacher', 'name email')
      .populate('schoolId', 'name district sector')
      .populate('classId', 'className name grade section')
      .collation({ locale: 'en', strength: 2 }) // Case-insensitive sorting
      .sort({ lastName: 1, firstName: 1 })
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
      .populate('assignedTeacher', 'name email')
      .populate('schoolId', 'name district sector')
      .populate('classId', 'className name grade section')
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
  body('classId').notEmpty().withMessage('Class ID is required'),
  
  // Address validation - only district and sector required
  body('address.district').notEmpty().withMessage('District is required'),
  body('address.sector').notEmpty().withMessage('Sector is required'),
  body('address.cell').optional().trim().isLength({ max: 100 }),
  body('address.village').optional().trim().isLength({ max: 100 }),
  
  // Socio-economic validation - only essential fields
  body('socioEconomic.ubudeheLevel').isInt({ min: 1, max: 4 }).withMessage('Ubudehe level must be between 1 and 4'),
  body('socioEconomic.hasParents').isBoolean().withMessage('Has parents must be a boolean'),
  body('socioEconomic.familyStability').isBoolean().withMessage('Family stability must be a boolean'),
  body('socioEconomic.distanceToSchoolKm').isFloat({ min: 0, max: 50 }).withMessage('Distance to school must be between 0 and 50 km'),
  body('socioEconomic.numberOfSiblings').isInt({ min: 0, max: 20 }).withMessage('Number of siblings must be between 0 and 20'),
  
  // Guardian contacts validation - updated
  body('guardianContacts').isArray({ min: 1, max: 2 }).withMessage('Between 1 and 2 parents/guardians required'),
  body('guardianContacts.*.firstName').trim().notEmpty().withMessage('First name is required'),
  body('guardianContacts.*.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('guardianContacts.*.relation').isIn(['Father', 'Mother', 'Uncle', 'Aunt', 'Sibling', 'Other Relative']).withMessage('Invalid relation'),
  body('guardianContacts.*.email').optional().isEmail().withMessage('Valid email format is required if provided'),
  body('guardianContacts.*.phone').matches(/^[\+]?250[0-9]{9}$|^0[0-9]{9}$/).withMessage('Valid phone number is required (Rwandan format)'),
  body('guardianContacts.*.education').isIn(['None', 'Primary', 'Secondary', 'University']).withMessage('Education level is required'),
  body('guardianContacts.*.occupation').trim().notEmpty().withMessage('Occupation is required')
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

    // Generate unique student ID
    const studentId = `STU${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Handle dateOfBirth - convert dob string to Date if needed
    let dateOfBirth = req.body.dateOfBirth;
    if (!dateOfBirth && req.body.dob) {
      dateOfBirth = new Date(req.body.dob);
    } else if (req.body.dob && typeof req.body.dob === 'string') {
      dateOfBirth = new Date(req.body.dob);
    }
    
    const studentData = {
      ...req.body,
      studentId,
      dateOfBirth: dateOfBirth, // Ensure dateOfBirth is set
      schoolId: req.user.schoolId,
      assignedTeacher: req.user.role === 'TEACHER' ? req.user._id : req.body.assignedTeacher
    };

    // Ensure guardian contacts have proper name field and at least one is primary
    studentData.guardianContacts = studentData.guardianContacts.map(contact => {
      // If name not provided but firstName and lastName are, create full name
      if (!contact.name && contact.firstName && contact.lastName) {
        contact.name = `${contact.firstName} ${contact.lastName}`.trim();
      }
      // If name provided but firstName/lastName not, parse if possible
      if (contact.name && (!contact.firstName || !contact.lastName)) {
        const nameParts = contact.name.trim().split(' ');
        if (nameParts.length >= 2) {
          contact.firstName = nameParts[0];
          contact.lastName = nameParts.slice(1).join(' ');
        }
      }
      // Handle empty email - set to undefined if empty string
      if (contact.email && contact.email.trim() === '') {
        contact.email = undefined;
      }
      // Set educationLevel for backward compatibility
      if (contact.education && !contact.educationLevel) {
        contact.educationLevel = contact.education;
      }
      // Set job for backward compatibility
      if (contact.occupation && !contact.job) {
        contact.job = contact.occupation;
      }
      return contact;
    });
    
    // Ensure at least one guardian is primary
    if (!studentData.guardianContacts.some(contact => contact.isPrimary)) {
      studentData.guardianContacts[0].isPrimary = true;
    }

    // Calculate risk level based on socio-economic factors (simplified)
    let riskScore = 0;
    
    // Ubudehe level scoring (higher level = lower risk)
    riskScore += (4 - studentData.socioEconomic.ubudeheLevel) * 2;
    
    // Family factors
    if (!studentData.socioEconomic.hasParents) riskScore += 3;
    // Family stability: false (unstable) = risk, true (stable) = no risk
    if (!studentData.socioEconomic.familyStability) riskScore += 2;
    if (studentData.socioEconomic.numberOfSiblings > 5) riskScore += 1;
    
    // Distance to school risk (7 km = critical threshold)
    if (studentData.socioEconomic.distanceToSchoolKm >= 7) {
      // Critical distance risk - will be handled separately in risk detection service
    } else if (studentData.socioEconomic.distanceToSchoolKm >= 5) {
      riskScore += 2; // High distance risk
    } else if (studentData.socioEconomic.distanceToSchoolKm >= 3) {
      riskScore += 1; // Medium distance risk
    }
    
    // Optional parent education level (if provided)
    if (studentData.socioEconomic.parentEducationLevel) {
      const educationScore = {
        'None': 3,
        'Primary': 2,
        'Secondary': 1,
        'University': 0,
        'Other': 1
      };
      riskScore += educationScore[studentData.socioEconomic.parentEducationLevel] || 1;
    } else {
      // Default risk if education level not provided
      riskScore += 1;
    }
    
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

    // Detect socio-economic and family-based risks immediately after registration
    const riskDetectionService = require('../services/riskDetectionService');
    setTimeout(async () => {
      try {
        await riskDetectionService.detectSocioeconomicRisks(
          student._id,
          req.user.schoolId,
          req.user._id
        );
      } catch (error) {
        logger.error(`Socioeconomic risk detection failed for student ${student._id}:`, error);
      }
    }, 100); // Small delay to ensure response is sent first

    const populatedStudent = await Student.findById(student._id)
      .populate('assignedTeacher', 'name email')
      .populate('schoolId', 'name district sector')
      .populate('classId', 'className name grade section');

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
  body('classId').optional().notEmpty().withMessage('Class ID cannot be empty'),
  body('assignedTeacher').optional().isMongoId().withMessage('Valid assigned teacher ID is required')
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
      if (!existingStudent || existingStudent.assignedTeacher.toString() !== req.user._id.toString()) {
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
    ).populate('assignedTeacher', 'name email')
      .populate('schoolId', 'name district sector')
      .populate('classId', 'className name grade section');

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

// @route   POST /api/students/:id/upload-picture
// @desc    Upload profile picture for student (Teachers can upload for their students)
// @access  Private (Admin, Teacher)
router.post('/:id/upload-picture', authenticateToken, authorize('ADMIN', 'TEACHER'), profilePictureUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { id } = req.params;

    // Check access permissions
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Teachers can only upload for their assigned students
    if (req.user.role === 'TEACHER' && student.assignedTeacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'eduguard/profiles',
      public_id: `student_${id}_${Date.now()}`,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    // Update student profile picture
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { profilePicture: uploadResult.secure_url },
      { new: true }
    ).populate('assignedTeacher', 'name email')
     .populate('schoolId', 'name district sector')
     .populate('classId', 'className name grade section');

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Upload student profile picture error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture'
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
    if (req.user.role === 'TEACHER' && student.assignedTeacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    await student.addRiskFlag({ type, description, severity }, req.user._id);

    // Update risk level based on all flags
    await student.updateRiskLevel();

    // Notify admins immediately for HIGH and CRITICAL risk flags
    if (['HIGH', 'CRITICAL'].includes(severity)) {
      const { notifyAdminOfStudentRisk } = require('../utils/adminNotificationService');
      await notifyAdminOfStudentRisk(
        student._id,
        severity,
        `Manual risk flag added: ${description || type}.`,
        type
      );
    }

    const updatedStudent = await Student.findById(id)
      .populate('assignedTeacher', 'name email')
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
    if (req.user.role === 'TEACHER' && student.assignedTeacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    await student.resolveRiskFlag(flagId, req.user._id);

    const updatedStudent = await Student.findById(id)
      .populate('assignedTeacher', 'name email')
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
    if (req.user.role === 'TEACHER' && student.assignedTeacher.toString() !== req.user._id.toString()) {
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
      .populate('assignedTeacher', 'name email')
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
// @desc    Delete student (hard delete)
// @access  Private (Admin, Teacher - only for their assigned students)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only ADMIN, SUPER_ADMIN, and TEACHER roles can delete students
    if (!['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and teachers can delete students.'
      });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check permissions based on role
    if (req.user.role === 'ADMIN') {
      // Admin can only delete students from their school
      if (student.schoolId && !student.schoolId.equals(req.user.schoolId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete students from your school.'
        });
      }
    } else if (req.user.role === 'TEACHER') {
      // Teacher can only delete students assigned to them or in their classes
      const isAssignedTeacher = student.assignedTeacher && 
        student.assignedTeacher.toString() === req.user._id.toString();
      
      const isInTeacherClass = student.classId && 
        req.user.assignedClasses && 
        req.user.assignedClasses.some((classId) => 
          classId.toString() === student.classId.toString()
        );
      
      if (!isAssignedTeacher && !isInTeacherClass) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete students assigned to your classes.'
        });
      }
    }
    // SUPER_ADMIN can delete any student (no additional checks)

    // Hard delete the student
    await Student.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student'
    });
  }
});

// @route   GET /api/students/export
// @desc    Export students to CSV
// @access  Private (Admin)
router.get('/export', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const students = await Student.find({
      schoolId: req.user.schoolId,
      isActive: true
    })
      .populate('assignedTeacher', 'name')
      .populate('schoolId', 'name district sector')
      .populate('classId', 'className name grade section')
      .collation({ locale: 'en', strength: 2 }) // Case-insensitive sorting
      .sort({ lastName: 1, firstName: 1 });

    const csvData = students.map(s => ({
      'Student ID': s._id.toString(),
      'First Name': s.firstName,
      'Middle Name': s.middleName || '',
      'Last Name': s.lastName,
      Gender: s.gender,
      Age: s.age,
      'Date of Birth': s.dob.toLocaleDateString(),
      'Class ID': s.classId?._id || '',
      'Class Name': s.classId?.name || '',
      'Assigned Teacher': s.assignedTeacher?.name || '',
      District: s.address.district,
      Sector: s.address.sector,
      Cell: s.address.cell || 'Not specified',
      Village: s.address.village || 'Not specified',
      'Ubudehe Level': s.socioEconomic.ubudeheLevel,
      'Has Parents': s.socioEconomic.hasParents ? 'Yes' : 'No',
      'Family Stability': s.socioEconomic.familyStability ? 'Yes (Stable)' : 'No (Less Stable)',
      'Distance to School (km)': s.socioEconomic.distanceToSchoolKm || 'N/A',
      'Number of Siblings': s.socioEconomic.numberOfSiblings,
      'Parent Education Level': s.socioEconomic.parentEducationLevel,
      'Risk Level': s.riskLevel,
      'Primary Guardian Name': s.guardianContacts[0]?.name || '',
      'Primary Guardian Phone': s.guardianContacts[0]?.phone || '',
      'Primary Guardian Email': s.guardianContacts[0]?.email || '',
      'Primary Guardian Relation': s.guardianContacts[0]?.relation || ''
    }));

    const csvString = stringify(csvData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=students-${Date.now()}.csv`);
    res.send(csvString);
  } catch (error) {
    console.error('Export students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export students'
    });
  }
});

// @route   POST /api/students/import
// @desc    Import students from CSV
// @access  Private (Admin)
router.post('/import', authenticateToken, authorize('ADMIN'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const records = [];
    const errors = [];

    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv.parse({ headers: true, trim: true }))
      .on('error', error => {
        console.error('CSV parse error:', error);
      })
      .on('data', row => {
        records.push(row);
      })
      .on('end', async () => {
        const imported = [];

        for (const [index, record] of records.entries()) {
          try {
            const studentData = {
              firstName: record['First Name'] || record.firstName,
              middleName: record['Middle Name'] || record.middleName || '',
              lastName: record['Last Name'] || record.lastName,
              gender: record.Gender || record.gender,
              age: parseInt(record.Age || record.age),
              dob: new Date(record['Date of Birth'] || record.dob),
              schoolId: req.user.schoolId,
              classId: record['Class ID'] || record.classId,
              assignedTeacher: record.assignedTeacher || req.user._id,
              address: {
                district: record.District || record['address.district'] || '',
                sector: record.Sector || record['address.sector'] || '',
                cell: record.Cell || record['address.cell'] || '',
                village: record.Village || record['address.village'] || ''
              },
              socioEconomic: {
                ubudeheLevel: parseInt(record['Ubudehe Level'] || record['socioEconomic.ubudeheLevel'] || '4'),
                hasParents: (record['Has Parents'] || record['socioEconomic.hasParents'] || 'Yes').toLowerCase() === 'yes',
                familyStability: (record['Family Stability'] || record['socioEconomic.familyStability'] || 'Yes').toLowerCase() === 'yes',
                distanceToSchoolKm: parseFloat(record['Distance to School (km)'] || record['socioEconomic.distanceToSchoolKm'] || '0'),
                numberOfSiblings: parseInt(record['Number of Siblings'] || record['socioEconomic.numberOfSiblings'] || '0'),
                parentEducationLevel: record['Parent Education Level'] || record['socioEconomic.parentEducationLevel'] || 'Primary'
              },
              guardianContacts: [{
                name: record['Primary Guardian Name'] || record['guardianContacts[0].name'] || 'Unknown',
                relation: record['Primary Guardian Relation'] || record['guardianContacts[0].relation'] || 'Guardian',
                phone: record['Primary Guardian Phone'] || record['guardianContacts[0].phone'] || '',
                email: record['Primary Guardian Email'] || record['guardianContacts[0].email'] || '',
                isPrimary: true
              }]
            };

            const student = await Student.create(studentData);
            imported.push(student);
          } catch (error) {
            errors.push({
              row: index + 2,
              error: error.message,
              data: record
            });
          }
        }

        res.json({
          success: true,
          message: `Imported ${imported.length} students`,
          imported: imported.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors.slice(0, 10) : undefined
        });
      });
  } catch (error) {
    console.error('Import students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import students',
      error: error.message
    });
  }
});

// @route   GET /api/students/:id/report-pdf
// @desc    Export individual student report as PDF
// @access  Private (Admin, Teacher)
router.get('/:id/report-pdf', authenticateToken, authorize('ADMIN', 'TEACHER'), canAccessStudent, async (req, res) => {
  try {
    const { id } = req.params;
    const PDFDocument = require('pdfkit');

    // Get student with all related data
    const student = await Student.findById(id)
      .populate('assignedTeacher', 'name email')
      .populate('schoolId', 'name district sector')
      .populate('classId', 'className name grade section')
      .populate('notes.createdBy', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get active attendance records (last 90 days or all if less)
    const Attendance = require('../models/Attendance');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const attendanceRecords = await Attendance.find({
      studentId: id,
      date: { $gte: ninetyDaysAgo }
    })
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .limit(100); // Limit to most recent 100 records

    // Get active performance records (last academic year or all if less)
    const Performance = require('../models/Performance');
    const currentYear = new Date().getFullYear();
    const performanceRecords = await Performance.find({
      studentId: id,
      academicYear: { $gte: currentYear - 1 } // Last 2 years
    })
      .populate('enteredBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to most recent 50 records

    // Get active risk flags
    const RiskFlag = require('../models/RiskFlag');
    const riskFlags = await RiskFlag.find({
      studentId: id,
      isActive: true
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    // Get admin comments (notes created by admins)
    const adminComments = (student.notes || []).filter((note) => {
      // Filter for admin comments - you can adjust this logic
      return note.createdBy && !note.isPrivate;
    });

    // Create PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Student Report - ${student.firstName} ${student.lastName}`,
        Author: 'EduGuard',
        Subject: 'Student Academic Report'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-report-${student.studentId}-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to draw colored header box
    const drawHeaderBox = (y, height, color) => {
      doc.rect(50, y, 495, height)
        .fillColor(color)
        .fill()
        .fillColor('black');
    };

    // Helper function to draw section header
    const drawSectionHeader = (text, y) => {
      const headerHeight = 25;
      drawHeaderBox(y, headerHeight, '#667eea');
      doc.fillColor('white')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(text, 60, y + 7, { width: 475 });
      doc.fillColor('black');
      return y + headerHeight + 10;
    };

    // Helper function to draw info box
    const drawInfoBox = (label, value, x, y, width) => {
      doc.rect(x, y, width, 20)
        .fillColor('#f8f9fa')
        .fill()
        .fillColor('black')
        .fontSize(9)
        .fillColor('#6b7280')
        .text(label, x + 5, y + 3, { width: width - 10 })
        .fillColor('black')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(value || 'N/A', x + 5, y + 12, { width: width - 10 });
    };

    // Cover Page with Modern Design
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    
    // Gradient-like background effect
    doc.rect(0, 0, pageWidth, 150)
      .fillColor('#667eea')
      .fill();
    
    doc.rect(0, 150, pageWidth, pageHeight - 150)
      .fillColor('#f8f9fa')
      .fill();
    
    doc.fillColor('white')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('EduGuard', 50, 60, { align: 'center', width: pageWidth - 100 });
    
    doc.fontSize(18)
      .text('Student Academic Report', 50, 95, { align: 'center', width: pageWidth - 100 });
    
    doc.fillColor('black')
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(student.schoolId?.name || 'School', 50, 130, { align: 'center', width: pageWidth - 100 });
    
    // Student Info Card
    let currentY = 200;
    doc.rect(50, currentY, pageWidth - 100, 120)
      .fillColor('white')
      .fill()
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .stroke();
    
    // Student Name (Large)
    doc.fillColor('#1f2937')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(`${student.firstName} ${student.lastName}`, 60, currentY + 15, { width: pageWidth - 120 });
    
    // Student ID Badge
    doc.rect(60, currentY + 50, 200, 25)
      .fillColor('#667eea')
      .fill();
    doc.fillColor('white')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`ID: ${student.studentId}`, 70, currentY + 58);
    
    // Risk Level Badge
    const riskColors = {
      'CRITICAL': '#dc2626',
      'HIGH': '#ea580c',
      'MEDIUM': '#f59e0b',
      'LOW': '#10b981',
      'NONE': '#6b7280'
    };
    const riskColor = riskColors[student.riskLevel] || '#6b7280';
    doc.rect(270, currentY + 50, 150, 25)
      .fillColor(riskColor)
      .fill();
    doc.fillColor('white')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Risk: ${student.riskLevel || 'LOW'}`, 280, currentY + 58);
    
    // Class Info
    doc.fillColor('black')
      .fontSize(11)
      .font('Helvetica')
      .text(`Class: ${student.classId?.className || student.className || 'Not assigned'}`, 60, currentY + 85);
    doc.text(`Teacher: ${student.assignedTeacher?.name || 'Not assigned'}`, 60, currentY + 100);
    
    // Generation Date
    doc.fillColor('#6b7280')
      .fontSize(9)
      .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 250, currentY + 100);
    
    currentY = 350;

    // Student Basic Information Section
    currentY = drawSectionHeader('Student Information', currentY);
    
    const infoBoxWidth = 150;
    const infoBoxHeight = 35;
    const infoBoxSpacing = 20;
    let infoX = 60;
    let infoY = currentY;
    
    // Row 1
    drawInfoBox('Full Name', `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim(), infoX, infoY, infoBoxWidth);
    infoX += infoBoxWidth + infoBoxSpacing;
    drawInfoBox('Student ID', student.studentId, infoX, infoY, infoBoxWidth);
    infoX += infoBoxWidth + infoBoxSpacing;
    drawInfoBox('Gender', student.gender === 'M' ? 'Male' : 'Female', infoX, infoY, infoBoxWidth);
    
    // Row 2
    infoX = 60;
    infoY += infoBoxHeight + 10;
    drawInfoBox('Date of Birth', new Date(student.dateOfBirth).toLocaleDateString(), infoX, infoY, infoBoxWidth);
    infoX += infoBoxWidth + infoBoxSpacing;
    drawInfoBox('Age', `${student.age} years`, infoX, infoY, infoBoxWidth);
    infoX += infoBoxWidth + infoBoxSpacing;
    drawInfoBox('Class', student.classId?.className || student.className || 'Not assigned', infoX, infoY, infoBoxWidth);
    
    currentY = infoY + infoBoxHeight + 20;

    // Address Information
    currentY = drawSectionHeader('Address Information', currentY);
    
    infoX = 60;
    infoY = currentY;
    drawInfoBox('District', student.address?.district || 'N/A', infoX, infoY, infoBoxWidth);
    infoX += infoBoxWidth + infoBoxSpacing;
    drawInfoBox('Sector', student.address?.sector || 'N/A', infoX, infoY, infoBoxWidth);
    if (student.address?.cell) {
      infoX += infoBoxWidth + infoBoxSpacing;
      drawInfoBox('Cell', student.address.cell, infoX, infoY, infoBoxWidth);
    }
    if (student.address?.village) {
      infoX = 60;
      infoY += infoBoxHeight + 10;
      drawInfoBox('Village', student.address.village, infoX, infoY, infoBoxWidth);
      currentY = infoY + infoBoxHeight + 20;
    } else {
      currentY = infoY + infoBoxHeight + 20;
    }

    // Guardian Contacts
    if (student.guardianContacts && student.guardianContacts.length > 0) {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      currentY = drawSectionHeader('Guardian Contacts', currentY);
      
      student.guardianContacts.forEach((guardian, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        const guardianName = guardian.name || 
          (guardian.firstName && guardian.lastName ? `${guardian.firstName} ${guardian.lastName}` : guardian.firstName || 'N/A');
        
        // Guardian card
        doc.rect(60, currentY, pageWidth - 120, 50)
          .fillColor('#f0f4ff')
          .fill()
          .strokeColor('#c7d2fe')
          .lineWidth(1)
          .stroke();
        
        doc.fillColor('#1f2937')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${guardianName}`, 70, currentY + 5);
        
        doc.fillColor('#4b5563')
          .fontSize(9)
          .font('Helvetica')
          .text(`Relation: ${guardian.relation || 'N/A'}`, 70, currentY + 20);
        
        if (guardian.phone) {
          doc.text(`Phone: ${guardian.phone}`, 70, currentY + 32);
        }
        if (guardian.email) {
          doc.text(`Email: ${guardian.email}`, 250, currentY + 32);
        }
        
        currentY += 60;
      });
      currentY += 10;
    }

    // Socio-Economic Information
    if (student.socioEconomic) {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      currentY = drawSectionHeader('Socio-Economic Information', currentY);
      
      infoX = 60;
      infoY = currentY;
      drawInfoBox('Ubudehe Level', student.socioEconomic.ubudeheLevel?.toString() || 'N/A', infoX, infoY, infoBoxWidth);
      infoX += infoBoxWidth + infoBoxSpacing;
      drawInfoBox('Has Parents', student.socioEconomic.hasParents ? 'Yes' : 'No', infoX, infoY, infoBoxWidth);
      infoX += infoBoxWidth + infoBoxSpacing;
      drawInfoBox('Family Stability', student.socioEconomic.familyStability ? 'Stable' : 'Less Stable', infoX, infoY, infoBoxWidth);
      
      infoX = 60;
      infoY += infoBoxHeight + 10;
      drawInfoBox('Siblings', (student.socioEconomic.numberOfSiblings || 0).toString(), infoX, infoY, infoBoxWidth);
      if (student.socioEconomic.distanceToSchoolKm) {
        infoX += infoBoxWidth + infoBoxSpacing;
        drawInfoBox('Distance to School', `${student.socioEconomic.distanceToSchoolKm} km`, infoX, infoY, infoBoxWidth);
      }
      if (student.socioEconomic.parentEducationLevel) {
        infoX += infoBoxWidth + infoBoxSpacing;
        drawInfoBox('Parent Education', student.socioEconomic.parentEducationLevel, infoX, infoY, infoBoxWidth);
      }
      currentY = infoY + infoBoxHeight + 20;
    }

    // Risk Assessment
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }
    currentY = drawSectionHeader('Risk Assessment', currentY);
    
    // Risk Level Badge (Large)
    const riskLevel = student.riskLevel || 'LOW';
    const riskColor2 = riskColors[riskLevel] || '#6b7280';
    doc.rect(60, currentY, 200, 30)
      .fillColor(riskColor2)
      .fill();
    doc.fillColor('white')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`Current Risk Level: ${riskLevel}`, 70, currentY + 8);
    
    doc.fillColor('black')
      .fontSize(10)
      .font('Helvetica')
      .text(`Active Risk Flags: ${riskFlags.length}`, 280, currentY + 10);
    
    currentY += 45;
    
    if (riskFlags.length > 0) {
      riskFlags.slice(0, 5).forEach((flag, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        const severityColors = {
          'CRITICAL': '#fee2e2',
          'HIGH': '#fed7aa',
          'MEDIUM': '#fef3c7',
          'LOW': '#d1fae5'
        };
        const flagBgColor = severityColors[flag.severity] || '#f3f4f6';
        
        // Risk flag card
        doc.rect(60, currentY, pageWidth - 120, 45)
          .fillColor(flagBgColor)
          .fill()
          .strokeColor('#e5e7eb')
          .lineWidth(1)
          .stroke();
        
        doc.fillColor('#1f2937')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${flag.title || flag.type}`, 70, currentY + 5);
        
        doc.fillColor('#4b5563')
          .fontSize(9)
          .font('Helvetica')
          .text(`Severity: ${flag.severity}`, 70, currentY + 18);
        doc.text(`Created: ${new Date(flag.createdAt).toLocaleDateString()}`, 200, currentY + 18);
        
        if (flag.description) {
          doc.text(flag.description.substring(0, 80) + (flag.description.length > 80 ? '...' : ''), 70, currentY + 28, { width: 400 });
        }
        
        currentY += 55;
      });
    }
    currentY += 10;

    // Attendance Records
    doc.addPage();
    currentY = 50;
    currentY = drawSectionHeader('Attendance Records (Last 90 Days)', currentY);
    
    if (attendanceRecords.length > 0) {
      // Table header with background
      const headerY = currentY;
      doc.rect(50, headerY, 480, 25)
        .fillColor('#667eea')
        .fill();
      
      doc.fillColor('white')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Date', 55, headerY + 8, { width: 100 });
      doc.text('Status', 155, headerY + 8, { width: 80 });
      doc.text('Reason', 235, headerY + 8, { width: 100 });
      doc.text('Marked By', 335, headerY + 8, { width: 145 });
      
      doc.fillColor('black');
      currentY = headerY + 30;

      attendanceRecords.forEach((record, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
          // Redraw header
          const headerY = currentY;
          doc.rect(50, headerY, 480, 25)
            .fillColor('#667eea')
            .fill();
          doc.fillColor('white')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Date', 55, headerY + 8, { width: 100 });
          doc.text('Status', 155, headerY + 8, { width: 80 });
          doc.text('Reason', 235, headerY + 8, { width: 100 });
          doc.text('Marked By', 335, headerY + 8, { width: 145 });
          doc.fillColor('black');
          currentY = headerY + 30;
        }

        const date = new Date(record.date).toLocaleDateString();
        const status = record.status || 'N/A';
        const reason = record.reason || 'N/A';
        const markedBy = record.markedBy?.name || 'System';

        // Alternate row colors
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        doc.rect(50, currentY, 480, 20)
          .fillColor(rowColor)
          .fill();

        doc.fontSize(9)
          .font('Helvetica')
          .text(date, 55, currentY + 5, { width: 100 });
        
        // Status with color
        const statusColors = {
          'PRESENT': '#10b981',
          'ABSENT': '#ef4444',
          'LATE': '#f59e0b',
          'EXCUSED': '#6b7280'
        };
        doc.fillColor(statusColors[status] || '#6b7280')
          .text(status, 155, currentY + 5, { width: 80 });
        doc.fillColor('black');
        
        doc.text(reason, 235, currentY + 5, { width: 100 });
        doc.text(markedBy, 335, currentY + 5, { width: 145 });
        
        // Row separator
        doc.moveTo(50, currentY + 20).lineTo(530, currentY + 20)
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .stroke();
        
        currentY += 20;
      });

      // Attendance Summary Box
      currentY += 10;
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      
      const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
      const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
      const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
      const attendanceRate = attendanceRecords.length > 0 
        ? ((presentCount / attendanceRecords.length) * 100).toFixed(1) 
        : '0.0';

      doc.rect(50, currentY, 480, 80)
        .fillColor('#f0f9ff')
        .fill()
        .strokeColor('#bae6fd')
        .lineWidth(1)
        .stroke();

      doc.fillColor('#1f2937')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Summary', 60, currentY + 10);
      
      const summaryBoxWidth = 110;
      let summaryX = 60;
      const summaryY = currentY + 30;
      
      drawInfoBox('Total', attendanceRecords.length.toString(), summaryX, summaryY, summaryBoxWidth);
      summaryX += summaryBoxWidth + 10;
      drawInfoBox('Present', presentCount.toString(), summaryX, summaryY, summaryBoxWidth);
      summaryX += summaryBoxWidth + 10;
      drawInfoBox('Absent', absentCount.toString(), summaryX, summaryY, summaryBoxWidth);
      summaryX += summaryBoxWidth + 10;
      drawInfoBox('Late', lateCount.toString(), summaryX, summaryY, summaryBoxWidth);
      summaryX += summaryBoxWidth + 10;
      drawInfoBox('Rate', `${attendanceRate}%`, summaryX, summaryY, summaryBoxWidth);
      
      currentY += 100;
    } else {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .text('No attendance records found', 60, currentY);
      currentY += 30;
    }

    // Performance Records
    doc.addPage();
    currentY = 50;
    currentY = drawSectionHeader('Performance Records', currentY);

    if (performanceRecords.length > 0) {
      // Table header with background
      const headerY = currentY;
      doc.rect(50, headerY, 480, 25)
        .fillColor('#667eea')
        .fill();
      
      doc.fillColor('white')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Date', 55, headerY + 8, { width: 100 });
      doc.text('Subject', 155, headerY + 8, { width: 120 });
      doc.text('Score', 275, headerY + 8, { width: 60 });
      doc.text('Grade', 335, headerY + 8, { width: 60 });
      doc.text('Entered By', 395, headerY + 8, { width: 135 });
      
      doc.fillColor('black');
      currentY = headerY + 30;

      performanceRecords.forEach((record, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
          // Redraw header
          const headerY = currentY;
          doc.rect(50, headerY, 480, 25)
            .fillColor('#667eea')
            .fill();
          doc.fillColor('white')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Date', 55, headerY + 8, { width: 100 });
          doc.text('Subject', 155, headerY + 8, { width: 120 });
          doc.text('Score', 275, headerY + 8, { width: 60 });
          doc.text('Grade', 335, headerY + 8, { width: 60 });
          doc.text('Entered By', 395, headerY + 8, { width: 135 });
          doc.fillColor('black');
          currentY = headerY + 30;
        }

        const date = new Date(record.createdAt).toLocaleDateString();
        const subject = record.subject || 'N/A';
        const score = `${record.score || 0}/${record.maxScore || 100}`;
        const grade = record.grade || 'N/A';
        const enteredBy = record.enteredBy?.name || 'System';

        // Alternate row colors
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        doc.rect(50, currentY, 480, 20)
          .fillColor(rowColor)
          .fill();

        doc.fontSize(9)
          .font('Helvetica')
          .text(date, 55, currentY + 5, { width: 100 });
        doc.text(subject, 155, currentY + 5, { width: 120 });
        
        // Score with color based on percentage
        const percentage = record.maxScore > 0 ? (record.score / record.maxScore) * 100 : 0;
        const scoreColor = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
        doc.fillColor(scoreColor)
          .text(score, 275, currentY + 5, { width: 60 });
        doc.fillColor('black');
        
        doc.text(grade, 335, currentY + 5, { width: 60 });
        doc.text(enteredBy, 395, currentY + 5, { width: 135 });
        
        // Row separator
        doc.moveTo(50, currentY + 20).lineTo(530, currentY + 20)
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .stroke();
        
        currentY += 20;
      });

      // Performance Summary Box
      currentY += 10;
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      
      const avgScore = performanceRecords.length > 0
        ? (performanceRecords.reduce((sum, r) => {
            const percentage = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0;
            return sum + percentage;
          }, 0) / performanceRecords.length).toFixed(1)
        : '0.0';

      doc.rect(50, currentY, 480, 60)
        .fillColor('#f0f9ff')
        .fill()
        .strokeColor('#bae6fd')
        .lineWidth(1)
        .stroke();

      doc.fillColor('#1f2937')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Summary', 60, currentY + 10);
      
      const perfSummaryWidth = 200;
      drawInfoBox('Total Records', performanceRecords.length.toString(), 60, currentY + 30, perfSummaryWidth);
      drawInfoBox('Average Score', `${avgScore}%`, 280, currentY + 30, perfSummaryWidth);
      
      currentY += 80;
    } else {
      doc.fillColor('#6b7280')
        .fontSize(10)
        .text('No performance records found', 60, currentY);
      currentY += 30;
    }

    // Admin Comments
    doc.addPage();
    currentY = 50;
    currentY = drawSectionHeader('School Admin Comments', currentY);

    if (adminComments.length > 0) {
      adminComments.forEach((comment, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        // Comment card
        doc.rect(60, currentY, pageWidth - 120, 70)
          .fillColor('#fef3c7')
          .fill()
          .strokeColor('#fde68a')
          .lineWidth(1)
          .stroke();
        
        doc.fillColor('#1f2937')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`Comment ${index + 1}`, 70, currentY + 5);
        
        doc.fillColor('#4b5563')
          .fontSize(9)
          .font('Helvetica')
          .text(comment.content, 70, currentY + 20, { width: pageWidth - 140 });
        
        doc.fillColor('#6b7280')
          .fontSize(8)
          .text(`By: ${comment.createdBy?.name || 'Admin'} • ${new Date(comment.createdAt).toLocaleDateString()}`, 70, currentY + 55);
        
        currentY += 80;
      });
    } else {
      // Default comment card
      doc.rect(60, currentY, pageWidth - 120, 80)
        .fillColor('#f0f9ff')
        .fill()
        .strokeColor('#bae6fd')
        .lineWidth(1)
        .stroke();
      
      doc.fillColor('#1f2937')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Default Comment', 70, currentY + 10);
      
      doc.fillColor('#4b5563')
        .fontSize(9)
        .font('Helvetica')
        .text('This student report has been generated for administrative and academic review purposes. All information contained herein is accurate as of the report generation date.', 70, currentY + 30, { width: pageWidth - 140 });
      
      currentY += 100;
    }

    // Footer
    const footerY = pageHeight - 40;
    doc.rect(0, footerY, pageWidth, 40)
      .fillColor('#1f2937')
      .fill();
    
    doc.fillColor('white')
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Report generated by ${req.user.name || req.user.email} on ${new Date().toLocaleString()} • EduGuard Platform`,
        { align: 'center', y: footerY + 15, width: pageWidth }
      );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating student PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate student PDF report',
      error: error.message
    });
  }
});

module.exports = router;
