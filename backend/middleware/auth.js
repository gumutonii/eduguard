const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user can access student data
const canAccessStudent = async (req, res, next) => {
  try {
    // Support both 'id' and 'studentId' parameter names
    const studentId = req.params.id || req.params.studentId;
    const user = req.user;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const Student = require('../models/Student');
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Admins can access all students in their school
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      // Verify student belongs to admin's school (unless super admin)
      if (user.role === 'ADMIN' && student.schoolId.toString() !== user.schoolId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this student'
        });
      }
      return next();
    }

    // Teachers can access students assigned to them
    if (user.role === 'TEACHER') {
      // Check if student is assigned to this teacher
      if (student.assignedTeacher && student.assignedTeacher.toString() === user._id.toString()) {
        return next();
      }

      // Also check if teacher's assigned class matches student's class
      if (student.classId && user.assignedClasses && user.assignedClasses.length > 0) {
        const classIds = user.assignedClasses.map(id => id.toString());
        if (classIds.includes(student.classId.toString())) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. This student is not assigned to you.'
      });
    }

    res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  } catch (error) {
    console.error('Student access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking student access'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  authorize,
  canAccessStudent,
  optionalAuth
};
