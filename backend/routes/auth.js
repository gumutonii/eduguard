const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { sendApprovalNotification, sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('role').isIn(['ADMIN', 'TEACHER']).withMessage('Invalid role'),
  body('phone').optional().matches(/^[\+]?250[0-9]{9}$|^0[0-9]{9}$/).withMessage('Please provide a valid phone number')
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
      email, 
      password, 
      name, 
      role, 
      phone,
      // School details for ADMIN
      schoolName,
      schoolDistrict,
      schoolSector,
      schoolPhone,
      schoolEmail,
      adminTitle,
      // Class selection for TEACHER
      selectedSchool,
      teacherTitle
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user (not approved by default)
    const userData = {
      email: email.toLowerCase(),
      password,
      name,
      role,
      phone,
      isApproved: false // New users need approval
    };

    // Add school details for ADMIN - create School record first
    if (role === 'ADMIN') {
      // Validate required school fields
      if (!schoolName || !schoolDistrict || !schoolSector) {
        return res.status(400).json({
          success: false,
          message: 'School name, district, and sector are required for Admin registration'
        });
      }

      // Ensure sector is a single name (not multiple words like "Nyagatare Barija")
      // Sector should be a single word/name from the valid sectors list
      const trimmedSector = schoolSector.trim();
      const normalizedSector = trimmedSector.split(' ')[0]; // Take first word only
      
      // Validate that sector is a single word (Rwanda sectors are single names)
      if (trimmedSector !== normalizedSector) {
        console.warn(`Warning: Sector "${trimmedSector}" contains multiple words. Using normalized: "${normalizedSector}"`);
      }

      const School = require('../models/School');
      
      // Check if school already exists
      let school = await School.findOne({
        name: schoolName.trim(),
        district: schoolDistrict.trim(),
        sector: normalizedSector,
        isActive: true
      });

      if (!school) {
        // Create new school record (createdBy will be set after user is created)
        school = new School({
          name: schoolName.trim(),
          district: schoolDistrict.trim(),
          sector: normalizedSector, // Use single sector name
          schoolType: 'PRIMARY_AND_SECONDARY',
          phone: schoolPhone || '',
          email: schoolEmail || '',
          isActive: true
        });
        
        // Temporarily save without createdBy (will be updated after user creation)
        await school.save();
      }

      // Set schoolId for the user
      userData.schoolId = school._id;
      userData.schoolName = school.name;
      userData.schoolDistrict = school.district;
      userData.schoolSector = school.sector; // Use the normalized single sector name
      userData.schoolPhone = school.phone || schoolPhone || '';
      userData.schoolEmail = school.email || schoolEmail || '';
      userData.adminTitle = adminTitle || '';
      
      // Update school's createdBy after user is created
      // (will be done after user.save())
    }

    // Add school details for TEACHER
    if (role === 'TEACHER') {
      // For teachers, we need to get the school details from the selected school
      // Note: Class assignment will be done by admin after teacher approval
      if (selectedSchool) {
        // Find the school in the School model to get the schoolId
        const School = require('../models/School');
        const school = await School.findOne({ 
          name: selectedSchool,
          isActive: true 
        });
        
        if (school) {
          userData.schoolId = school._id;
          userData.schoolName = school.name;
          userData.schoolDistrict = school.district;
          userData.schoolSector = school.sector;
          userData.schoolPhone = school.phone;
          userData.schoolEmail = school.email;
        } else {
          // Fallback: find the school admin to get school details
          const schoolAdmin = await User.findOne({ 
            schoolName: selectedSchool, 
            role: 'ADMIN',
            isApproved: true 
          });
          
          if (schoolAdmin) {
            userData.schoolName = schoolAdmin.schoolName;
            userData.schoolDistrict = schoolAdmin.schoolDistrict;
            userData.schoolSector = schoolAdmin.schoolSector;
            userData.schoolPhone = schoolAdmin.schoolPhone;
            userData.schoolEmail = schoolAdmin.schoolEmail;
          }
        }
      }
      
      userData.teacherTitle = teacherTitle;
      // Note: Class assignment will be done by admin after teacher approval via /api/classes/:id/assign-teacher
    }

    const user = new User(userData);
    await user.save();

    // For ADMIN: Update school's createdBy field
    if (role === 'ADMIN' && userData.schoolId) {
      const School = require('../models/School');
      await School.findByIdAndUpdate(userData.schoolId, {
        createdBy: user._id
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending approval. You will receive an email notification once an administrator approves your account.',
      data: {
        user: user.getPublicProfile(),
        token,
        refreshToken
      },
      requiresApproval: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if user is approved (except for superadmin)
    if (!user.isApproved && user.email !== 'admin@eduguard.com') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for an administrator to approve your account before you can access the platform.',
        requiresApproval: true
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success as token removal is handled client-side
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a real application, you would send an email here
    // For now, we'll just return the token in development
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        message: 'Password reset token generated',
        resetToken // Only in development
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded.userId,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }
});

// @route   GET /api/auth/pending-approvals
// @desc    Get all users pending approval (Admin only)
// @desc    For regular admins: only shows teachers from their school
// @desc    For super admins: shows all pending users
// @access  Private (Admin)
router.get('/pending-approvals', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Build query based on role
    const query = { 
      isApproved: false, 
      isActive: true,
      email: { $ne: 'admin@eduguard.com' } // Exclude superadmin
    };

    // For regular admins, only show teachers from their school
    if (req.user.role === 'ADMIN') {
      query.role = 'TEACHER'; // Only teachers need approval
      query.schoolId = req.user.schoolId; // Only teachers from this admin's school
    }

    const pendingUsers = await User.find(query)
      .select('-password')
      .populate('schoolId', 'name district sector')
      .sort({ createdAt: -1 }); // Most recent first

    res.json({
      success: true,
      data: pendingUsers
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
});

// @route   POST /api/auth/approve-user/:userId
// @desc    Approve a user (Admin or Super Admin)
// @access  Private (Admin or Super Admin)
router.post('/approve-user/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For regular admins, verify the user is a teacher from their school
    if (req.user.role === 'ADMIN') {
      if (user.role !== 'TEACHER') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only approve teachers from your school.'
        });
      }
      if (user.schoolId?.toString() !== req.user.schoolId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only approve teachers from your school.'
        });
      }
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      });
    }

    // Approve the user
    user.isApproved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    // Send approval notification email
    try {
      await sendApprovalNotification(user.email, user.name, true);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    res.json({
      success: true,
      message: 'User approved successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user'
    });
  }
});

// @route   POST /api/auth/reject-user/:userId
// @desc    Reject a user (Admin or Super Admin)
// @access  Private (Admin or Super Admin)
router.post('/reject-user/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For regular admins, verify the user is a teacher from their school
    if (req.user.role === 'ADMIN') {
      if (user.role !== 'TEACHER') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only reject teachers from your school.'
        });
      }
      if (user.schoolId?.toString() !== req.user.schoolId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only reject teachers from your school.'
        });
      }
    }

    // Deactivate the user (rejection)
    user.isActive = false;
    await user.save();

    // Send rejection notification email
    try {
      await sendApprovalNotification(user.email, user.name, false);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the rejection if email fails
    }

    res.json({
      success: true,
      message: 'User rejected successfully'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('phone').optional().matches(/^[\+]?250[0-9]{9}$|^0[0-9]{9}$/).withMessage('Please provide a valid phone number'),
  body('schoolId').optional().isMongoId().withMessage('Valid school ID is required')
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

    const { name, phone, schoolId } = req.body;
    const userId = req.user._id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (schoolId) user.schoolId = schoolId;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/auth/teachers
// @desc    Get all teachers (Admin only)
// @access  Private (Admin)
router.get('/teachers', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { page = 1, limit = 50, search } = req.query;

    // Build query
    let query = { 
      role: 'TEACHER',
      isActive: true 
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const totalTeachers = await User.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * limit;
    const teachers = await User.find(query)
      .select('-password')
      .populate('schoolId', 'name type district province')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teachers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTeachers,
        pages: Math.ceil(totalTeachers / limit)
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers'
    });
  }
});

module.exports = router;
