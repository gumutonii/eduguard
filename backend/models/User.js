const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?250[0-9]{9}$|^0[0-9]{9}$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
    required: [true, 'Role is required'],
    default: 'TEACHER'
  },
  
  // School reference (replaces embedded school data)
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: function() {
      return this.role === 'ADMIN' || this.role === 'TEACHER';
    }
  },
  
  // Teacher-specific fields
  assignedClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  teacherTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Teacher title cannot exceed 100 characters']
  },
  
  // Admin-specific fields
  adminTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Admin title cannot exceed 100 characters']
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ schoolId: 1, role: 1 });
userSchema.index({ isApproved: 1, isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to get users by school
userSchema.statics.getBySchool = function(schoolId) {
  return this.find({ schoolId, isActive: true }).populate('schoolId', 'name district sector');
};

// Static method to get teachers by school
userSchema.statics.getTeachersBySchool = function(schoolId) {
  return this.find({ schoolId, role: 'TEACHER', isActive: true }).populate('assignedClasses', 'name grade section');
};

// Static method to get admins by school
userSchema.statics.getAdminsBySchool = function(schoolId) {
  return this.find({ schoolId, role: 'ADMIN', isActive: true });
};

// Method to assign class to teacher
userSchema.methods.assignClass = async function(classId) {
  if (this.role !== 'TEACHER') {
    throw new Error('Only teachers can be assigned to classes');
  }
  
  if (!this.assignedClasses.includes(classId)) {
    this.assignedClasses.push(classId);
    await this.save();
  }
  
  return this;
};

// Method to remove class assignment from teacher
userSchema.methods.removeClass = async function(classId) {
  this.assignedClasses = this.assignedClasses.filter(id => !id.equals(classId));
  await this.save();
  return this;
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    schoolId: this.schoolId,
    assignedClasses: this.assignedClasses,
    teacherTitle: this.teacherTitle,
    adminTitle: this.adminTitle,
    isActive: this.isActive,
    isApproved: this.isApproved,
    approvedAt: this.approvedAt,
    emailVerified: this.emailVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema);