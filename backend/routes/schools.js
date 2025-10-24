const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const rwandaDistrictsSectors = require('../data/rwanda-districts-sectors');

const router = express.Router();

// @route   GET /api/schools/districts-sectors
// @desc    Get all Rwanda districts and sectors
// @access  Public
router.get('/districts-sectors', (req, res) => {
  try {
    res.json({
      success: true,
      data: rwandaDistrictsSectors
    });
  } catch (error) {
    console.error('Get districts sectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts and sectors'
    });
  }
});

// @route   GET /api/schools/for-registration
// @desc    Get schools for teacher registration (simplified list)
// @access  Public
router.get('/for-registration', async (req, res) => {
  try {
    // Get unique schools from users who are admins
    const schools = await User.aggregate([
      {
        $match: {
          role: 'ADMIN',
          isApproved: true,
          isActive: true,
          schoolName: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$schoolName',
          name: { $first: '$schoolName' },
          district: { $first: '$schoolDistrict' },
          sector: { $first: '$schoolSector' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          district: 1,
          sector: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    res.json({
      success: true,
      data: schools
    });
  } catch (error) {
    console.error('Get schools for registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools for registration'
    });
  }
});

// @route   GET /api/schools
// @desc    Get schools (Admin: school schools, Super Admin: all schools)
// @access  Private (Admin, Super Admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Super Admin can see all schools, Admin sees only their school
    if (req.user.role === 'ADMIN') {
      query.name = req.user.schoolName;
    }

    const schools = await School.find(query)
      .populate('createdBy', 'name email role')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: schools
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools'
    });
  }
});

// @route   GET /api/schools/:id
// @desc    Get specific school details
// @access  Private (Admin, Super Admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const schoolId = req.params.id;
    const school = await School.findById(schoolId)
      .populate('createdBy', 'name email role');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'ADMIN' && school.name !== req.user.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your school.'
      });
    }

    // Get school statistics
    const statistics = await school.updateStatistics();

    // Get classes for this school
    const classes = await Class.find({ schoolName: school.name, isActive: true })
      .populate('assignedTeacher', 'name email role teacherTitle')
      .sort({ grade: 1, name: 1, section: 1 });

    // Get users for this school
    const users = await User.find({ schoolName: school.name, isActive: true })
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .sort({ role: 1, name: 1 });

    res.json({
      success: true,
      data: {
        school,
        statistics,
        classes,
        users
      }
    });
  } catch (error) {
    console.error('Get school details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school details'
    });
  }
});

// @route   POST /api/schools
// @desc    Create new school (Admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, authorize('ADMIN'), [
  body('name').trim().isLength({ min: 2 }).withMessage('School name must be at least 2 characters long'),
  body('district').trim().isLength({ min: 2 }).withMessage('District is required'),
  body('sector').trim().isLength({ min: 2 }).withMessage('Sector is required'),
  body('schoolType').optional().isIn(['PRIMARY', 'SECONDARY', 'PRIMARY_AND_SECONDARY']).withMessage('Invalid school type'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
  body('principal.name').optional().trim().isLength({ min: 2 }).withMessage('Principal name must be at least 2 characters long'),
  body('principal.phone').optional().isMobilePhone().withMessage('Please provide a valid principal phone number'),
  body('principal.email').optional().isEmail().withMessage('Please provide a valid principal email')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      name, 
      district, 
      sector, 
      schoolType, 
      phone, 
      email, 
      address, 
      principal 
    } = req.body;
    
    // Check if school already exists
    const existingSchool = await School.findOne({
      name,
      district,
      sector,
      isActive: true
    });

    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'A school with this name, district, and sector already exists'
      });
    }

    const newSchool = new School({
      name,
      district,
      sector,
      schoolType: schoolType || 'PRIMARY_AND_SECONDARY',
      phone,
      email,
      address,
      principal: principal || {},
      createdBy: req.user._id
    });

    await newSchool.save();

    // Update user's school information
    await User.findByIdAndUpdate(req.user._id, {
      schoolName: name,
      schoolDistrict: district,
      schoolSector: sector,
      schoolPhone: phone,
      schoolEmail: email
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: newSchool
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create school'
    });
  }
});

// @route   PUT /api/schools/:id
// @desc    Update school (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticateToken, authorize('ADMIN'), [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('School name must be at least 2 characters long'),
  body('district').optional().trim().isLength({ min: 2 }).withMessage('District is required'),
  body('sector').optional().trim().isLength({ min: 2 }).withMessage('Sector is required'),
  body('schoolType').optional().isIn(['PRIMARY', 'SECONDARY', 'PRIMARY_AND_SECONDARY']).withMessage('Invalid school type'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
  body('principal.name').optional().trim().isLength({ min: 2 }).withMessage('Principal name must be at least 2 characters long'),
  body('principal.phone').optional().isMobilePhone().withMessage('Please provide a valid principal phone number'),
  body('principal.email').optional().isEmail().withMessage('Please provide a valid principal email')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const schoolId = req.params.id;
    const { 
      name, 
      district, 
      sector, 
      schoolType, 
      phone, 
      email, 
      address, 
      principal 
    } = req.body;

    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check if school belongs to admin
    if (school.name !== req.user.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your school.'
      });
    }

    // Check for duplicate if updating name/district/sector
    if (name || district || sector) {
      const existingSchool = await School.findOne({
        _id: { $ne: schoolId },
        name: name || school.name,
        district: district || school.district,
        sector: sector || school.sector,
        isActive: true
      });

      if (existingSchool) {
        return res.status(400).json({
          success: false,
          message: 'A school with this name, district, and sector already exists'
        });
      }
    }

    // Update school
    const updateData = {};
    if (name) updateData.name = name;
    if (district) updateData.district = district;
    if (sector) updateData.sector = sector;
    if (schoolType) updateData.schoolType = schoolType;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (principal) updateData.principal = { ...school.principal, ...principal };

    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    // Update user's school information if school details changed
    if (name || district || sector || phone || email) {
      await User.findByIdAndUpdate(req.user._id, {
        schoolName: name || school.name,
        schoolDistrict: district || school.district,
        schoolSector: sector || school.sector,
        schoolPhone: phone !== undefined ? phone : school.phone,
        schoolEmail: email !== undefined ? email : school.email
      });
    }

    res.json({
      success: true,
      message: 'School updated successfully',
      data: updatedSchool
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update school'
    });
  }
});

// @route   DELETE /api/schools/:id
// @desc    Delete school (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const schoolId = req.params.id;

    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check if school belongs to admin
    if (school.name !== req.user.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your school.'
      });
    }

    // Check if school has users or students
    const userCount = await User.countDocuments({ schoolName: school.name, isActive: true });
    const studentCount = await Student.countDocuments({ schoolName: school.name, isActive: true });
    const classCount = await Class.countDocuments({ schoolName: school.name, isActive: true });

    if (userCount > 0 || studentCount > 0 || classCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete school. It has ${userCount} users, ${studentCount} students, and ${classCount} classes. Please remove all associated data first.`
      });
    }

    // Soft delete the school
    await School.findByIdAndUpdate(schoolId, { isActive: false });

    res.json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete school'
    });
  }
});

// @route   GET /api/schools/:id/statistics
// @desc    Get school statistics
// @access  Private (Admin, Super Admin)
router.get('/:id/statistics', authenticateToken, async (req, res) => {
  try {
    const schoolId = req.params.id;
    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'ADMIN' && school.name !== req.user.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view statistics for your school.'
      });
    }

    // Get updated statistics
    const statistics = await school.updateStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get school statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school statistics'
    });
  }
});

module.exports = router;