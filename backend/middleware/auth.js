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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
    
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
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

// Helper: Check if user can access a school resource
const canAccessSchool = (userSchoolId, resourceSchoolId, userRole) => {
  if (userRole === 'SUPER_ADMIN') return true;
  if (userRole === 'ADMIN') {
    if (!userSchoolId || !resourceSchoolId) return false;
    return userSchoolId.toString() === resourceSchoolId.toString();
  }
  return false;
};

// Helper: Check if teacher can access a class
const canTeacherAccessClass = (teacherId, teacherAssignedClasses, classId) => {
  if (!classId) return false;
  if (!teacherAssignedClasses || teacherAssignedClasses.length === 0) return false;
  
  const classIdStr = classId.toString();
  return teacherAssignedClasses.some((assignedClassId) => 
    assignedClassId.toString() === classIdStr
  );
};

// Helper: Check if teacher can access a student
const canTeacherAccessStudent = (teacherId, teacherAssignedClasses, student) => {
  if (!student) return false;
  
  // Check if student is directly assigned to teacher
  if (student.assignedTeacher && student.assignedTeacher.toString() === teacherId.toString()) {
    return true;
  }
  
  // Check if student's class is in teacher's assigned classes
  if (student.classId && teacherAssignedClasses && teacherAssignedClasses.length > 0) {
    const studentClassIdStr = student.classId.toString();
    return teacherAssignedClasses.some((classId) => 
      classId.toString() === studentClassIdStr
    );
  }
  
  return false;
};

// Middleware: Check if user can access a class
const canAccessClass = async (req, res, next) => {
  try {
    const classId = req.params.id || req.params.classId;
    const user = req.user;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    const Class = require('../models/Class');
    const classData = await Class.findOne({ _id: classId, isActive: true })
      .populate('schoolId', '_id name');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // SUPER_ADMIN: Full access
    if (user.role === 'SUPER_ADMIN') {
      req.classData = classData;
      return next();
    }

    // ADMIN: Can access only their school's classes
    if (user.role === 'ADMIN') {
      if (!canAccessSchool(user.schoolId, classData.schoolId?._id || classData.schoolId, user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access classes from your school.'
        });
      }
      req.classData = classData;
      return next();
    }

    // TEACHER: Can access only assigned classes
    if (user.role === 'TEACHER') {
      const isAssigned = 
        (classData.assignedTeacher && classData.assignedTeacher.toString() === user._id.toString()) ||
        canTeacherAccessClass(user._id, user.assignedClasses, classData._id);
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This class is not assigned to you.'
        });
      }
      req.classData = classData;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  } catch (error) {
    console.error('Class access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking class access'
    });
  }
};

// Middleware: Check if user can access another user
const canAccessUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.params.userId;
    const user = req.user;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Users can always access their own profile
    if (targetUserId === user._id.toString()) {
      return next();
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // SUPER_ADMIN: Full access
    if (user.role === 'SUPER_ADMIN') {
      return next();
    }

    // ADMIN: Can access only users from their school
    if (user.role === 'ADMIN') {
      if (!canAccessSchool(user.schoolId, targetUser.schoolId, user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access users from your school.'
        });
      }
      return next();
    }

    // TEACHER: Can only access their own profile
    if (user.role === 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  } catch (error) {
    console.error('User access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking user access'
    });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  canAccessStudent,
  canAccessClass,
  canAccessUser,
  canAccessSchool,
  canTeacherAccessClass,
  canTeacherAccessStudent,
  optionalAuth
};
