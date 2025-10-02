const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  gender: {
    type: String,
    enum: ['M', 'F', 'Other'],
    required: [true, 'Gender is required']
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  classroomId: {
    type: String,
    required: [true, 'Classroom ID is required'],
    trim: true
  },
  assignedTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned teacher ID is required']
  },
  guardianContacts: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    relation: {
      type: String,
      enum: ['Father', 'Mother', 'Guardian', 'Other'],
      required: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  lastAttendanceDate: Date,
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW'
  },
  riskFlags: [{
    type: {
      type: String,
      enum: ['ATTENDANCE', 'PERFORMANCE', 'BEHAVIOR', 'FAMILY', 'OTHER'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isResolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
studentSchema.index({ schoolId: 1, classroomId: 1 });
studentSchema.index({ assignedTeacherId: 1 });
studentSchema.index({ riskLevel: 1 });
studentSchema.index({ isActive: 1 });
studentSchema.index({ 'guardianContacts.email': 1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
studentSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Method to get primary guardian
studentSchema.methods.getPrimaryGuardian = function() {
  return this.guardianContacts.find(contact => contact.isPrimary) || this.guardianContacts[0];
};

// Method to add risk flag
studentSchema.methods.addRiskFlag = function(flagData, userId) {
  this.riskFlags.push({
    ...flagData,
    createdBy: userId
  });
  
  // Update risk level based on flags
  const highRiskFlags = this.riskFlags.filter(flag => flag.severity === 'HIGH' && !flag.isResolved);
  const mediumRiskFlags = this.riskFlags.filter(flag => flag.severity === 'MEDIUM' && !flag.isResolved);
  
  if (highRiskFlags.length > 0) {
    this.riskLevel = 'HIGH';
  } else if (mediumRiskFlags.length > 2) {
    this.riskLevel = 'MEDIUM';
  } else {
    this.riskLevel = 'LOW';
  }
  
  return this.save();
};

// Method to resolve risk flag
studentSchema.methods.resolveRiskFlag = function(flagId, userId) {
  const flag = this.riskFlags.id(flagId);
  if (flag) {
    flag.isResolved = true;
    flag.resolvedAt = new Date();
    flag.resolvedBy = userId;
    
    // Recalculate risk level
    const unresolvedFlags = this.riskFlags.filter(f => !f.isResolved);
    const highRiskFlags = unresolvedFlags.filter(f => f.severity === 'HIGH');
    const mediumRiskFlags = unresolvedFlags.filter(f => f.severity === 'MEDIUM');
    
    if (highRiskFlags.length > 0) {
      this.riskLevel = 'HIGH';
    } else if (mediumRiskFlags.length > 2) {
      this.riskLevel = 'MEDIUM';
    } else {
      this.riskLevel = 'LOW';
    }
  }
  
  return this.save();
};

module.exports = mongoose.model('Student', studentSchema);
