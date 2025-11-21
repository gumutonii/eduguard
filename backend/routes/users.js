const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const User = require('../models/User');
const { authenticateToken, authorize, canAccessUser, canAccessSchool } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

const router = express.Router();
const upload = multer({ 
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

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', authenticateToken, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};
    
    // SUPER_ADMIN can see all users, others see only their school users
    if (req.user.role !== 'SUPER_ADMIN') {
      query.schoolId = req.user.schoolId;
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .populate('schoolId', 'name district sector phone email')
      .populate('assignedClasses', 'className grade section academicYear studentCount maxCapacity description');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add school information to user object for easier frontend access
    const userProfile = user.toObject();
    if (user.schoolId) {
      userProfile.schoolName = user.schoolId.name;
      userProfile.schoolDistrict = user.schoolId.district;
      userProfile.schoolSector = user.schoolId.sector;
      userProfile.schoolPhone = user.schoolId.phone;
      userProfile.schoolEmail = user.schoolId.email;
    }

    // For teachers, fetch detailed class information if assigned
    if (user.role === 'TEACHER' && user.assignedClasses && user.assignedClasses.length > 0) {
      const Class = require('../models/Class');
      const assignedClassId = user.assignedClasses[0]; // Get first assigned class
      
      if (assignedClassId) {
        const assignedClass = await Class.findById(assignedClassId)
          .populate('schoolId', 'name district sector')
          .populate('assignedTeacher', 'name email teacherTitle');
        
        if (assignedClass) {
          // Update class details to match the actual class
          userProfile.className = assignedClass.className;
          userProfile.classGrade = assignedClass.grade;
          userProfile.classSection = assignedClass.section;
          userProfile.assignedClassDetails = {
            _id: assignedClass._id,
            className: assignedClass.className,
            grade: assignedClass.grade,
            section: assignedClass.section,
            academicYear: assignedClass.academicYear,
            studentCount: assignedClass.studentCount || 0,
            maxCapacity: assignedClass.maxCapacity || 0,
            description: assignedClass.description || '',
            isActive: assignedClass.isActive
          };
        }
      }
    }

    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin, Super Admin, Teacher - own profile)
router.get('/:id', authenticateToken, canAccessUser, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .populate('schoolId', 'name district sector phone email')
      .populate('assignedClasses', 'className grade section');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('phone').optional().matches(/^[\+]?250[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}$|^0[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}$/).withMessage('Please provide a valid phone number'),
  body('schoolName').optional().trim().isLength({ min: 2 }).withMessage('School name must be at least 2 characters long'),
  body('schoolDistrict').optional().trim().isLength({ min: 2 }).withMessage('School district must be at least 2 characters long'),
  body('schoolSector').optional().trim().isLength({ min: 2 }).withMessage('School sector must be at least 2 characters long'),
  body('schoolPhone').optional().matches(/^[\+]?250[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}$|^0[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}$/).withMessage('Please provide a valid school phone number'),
  body('schoolEmail').optional().isEmail().withMessage('Please provide a valid school email'),
  body('className').optional().trim().isLength({ min: 1 }).withMessage('Class name must be at least 1 character long'),
  body('classGrade').optional().trim().isLength({ min: 1 }).withMessage('Class grade must be at least 1 character long'),
  body('classSection').optional().trim().isLength({ max: 10 }).withMessage('Class section cannot exceed 10 characters')
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

    const School = require('../models/School');
    const updateData = {};
    const schoolUpdateData = {};
    const allowedUserFields = ['name', 'phone', 'className', 'classGrade', 'classSection'];
    const allowedSchoolFields = ['schoolName', 'schoolDistrict', 'schoolSector', 'schoolPhone', 'schoolEmail'];

    // Separate user fields from school fields
    allowedUserFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    allowedSchoolFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const schoolField = field.replace('school', '').toLowerCase();
        schoolField === 'name' ? schoolUpdateData['name'] = req.body[field] :
        schoolField === 'district' ? schoolUpdateData['district'] = req.body[field] :
        schoolField === 'sector' ? schoolUpdateData['sector'] = req.body[field] :
        schoolField === 'phone' ? schoolUpdateData['phone'] = req.body[field] :
        schoolField === 'email' ? schoolUpdateData['email'] = req.body[field] : null;
      }
    });

    // Update user profile
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
     .populate('schoolId', 'name district sector phone email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update school information if school fields are provided
    if (Object.keys(schoolUpdateData).length > 0 && user.schoolId) {
      await School.findByIdAndUpdate(
        user.schoolId._id,
        schoolUpdateData,
        { new: true, runValidators: true }
      );
    }

    // Add school information to response
    const userProfile = user.toObject();
    if (user.schoolId) {
      userProfile.schoolName = user.schoolId.name;
      userProfile.schoolDistrict = user.schoolId.district;
      userProfile.schoolSector = user.schoolId.sector;
      userProfile.schoolPhone = user.schoolId.phone;
      userProfile.schoolEmail = user.schoolId.email;
    }

    // Generate new token with updated user data
    const { generateToken } = require('../utils/jwt');
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userProfile,
        token: token
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/users/profile/upload-picture
// @desc    Upload profile picture for current user
// @access  Private
router.post('/profile/upload-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'eduguard/profiles',
      public_id: `user_${req.user._id}_${Date.now()}`,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: uploadResult.secure_url },
      { new: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
     .populate('schoolId', 'name district sector phone email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add school information to response
    const userProfile = user.toObject();
    if (user.schoolId) {
      userProfile.schoolName = user.schoolId.name;
      userProfile.schoolDistrict = user.schoolId.district;
      userProfile.schoolSector = user.schoolId.sector;
      userProfile.schoolPhone = user.schoolId.phone;
      userProfile.schoolEmail = user.schoolId.email;
    }

    // Generate new token with updated user data
    const { generateToken } = require('../utils/jwt');
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        user: userProfile,
        token: token
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin, Super Admin can update any user in their school, users can update own profile)
// @access  Private (Admin, Super Admin, Teacher - own profile)
router.put('/:id', authenticateToken, canAccessUser, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('phone').optional().matches(/^[\+]?250[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}$|^0[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}$/).withMessage('Please provide a valid phone number'),
  body('role').optional().isIn(['ADMIN', 'TEACHER']).withMessage('Invalid role')
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
    const { name, phone, role } = req.body;

    // Only ADMIN and SUPER_ADMIN can change roles
    if (role && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can change user roles'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (role && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) updateData.role = role;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
    .populate('schoolId', 'name district sector phone email')
    .populate('assignedClasses', 'className grade section');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// @route   PUT /api/users/:id/password
// @desc    Change user password
// @access  Private
router.put('/:id/password', [
  authenticateToken,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
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
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password
    if (req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Activate/Deactivate user (Admin only)
// @access  Private (Admin)
router.put('/:id/status', [
  authenticateToken,
  authorize('ADMIN'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
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
    const { isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin, Super Admin only)
// @access  Private (Admin, Super Admin)
router.delete('/:id', authenticateToken, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent user from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user belongs to admin's school (for regular admins, SUPER_ADMIN can delete any)
    if (req.user.role === 'ADMIN' && !canAccessSchool(req.user.schoolId, user.schoolId, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete users from your school.'
      });
    }

    // Hard delete the user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;
