const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { authenticateToken, authorize, canAccessStudent } = require('../middleware/auth');
const multer = require('multer');
const csv = require('fast-csv');
const { stringify } = require('csv-stringify/sync');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

    let query = { 
      schoolId: req.user.schoolId,
      isActive: true 
    };

    // Role-based filtering
    if (req.user.role === 'TEACHER') {
      query.assignedTeacher = req.user._id;
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
  body('socioEconomic.familyConflict').isBoolean().withMessage('Family conflict must be a boolean'),
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
    riskScore += (5 - studentData.socioEconomic.ubudeheLevel) * 2;
    
    // Family factors
    if (!studentData.socioEconomic.hasParents) riskScore += 3;
    if (studentData.socioEconomic.familyConflict) riskScore += 2;
    if (studentData.socioEconomic.numberOfSiblings > 5) riskScore += 1;
    
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

    // Notify admins if student is at-risk
    if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(studentData.riskLevel)) {
      const { notifyAdminOfStudentRisk } = require('../utils/adminNotificationService');
      const riskReason = `Student registered with ${studentData.riskLevel} risk level based on socio-economic factors.`;
      await notifyAdminOfStudentRisk(student._id, studentData.riskLevel, riskReason, 'SOCIOECONOMIC');

      // Automatically notify parents/guardians if student registered with HIGH or CRITICAL risk
      if (studentData.riskLevel === 'HIGH' || studentData.riskLevel === 'CRITICAL') {
        const { notifyParentsOfRisk } = require('../utils/notificationService');
        notifyParentsOfRisk(student._id, studentData.riskLevel, riskReason).catch(err => {
          console.error('Error notifying parents during registration:', err);
        });
      }
    }

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
// @access  Private (Admin)
router.delete('/:id', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student belongs to admin's school (for regular admins)
    if (req.user.role === 'ADMIN' && student.schoolId && !student.schoolId.equals(req.user.schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete students from your school.'
      });
    }

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
      'Family Conflict': s.socioEconomic.familyConflict ? 'Yes' : 'No',
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
                familyConflict: (record['Family Conflict'] || record['socioEconomic.familyConflict'] || 'No').toLowerCase() === 'yes',
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

module.exports = router;
