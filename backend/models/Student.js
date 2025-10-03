const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: [50, 'Middle name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  gender: {
    type: String,
    enum: ['M', 'F'],
    required: [true, 'Gender is required']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [3, 'Age must be at least 3'],
    max: [25, 'Age cannot exceed 25']
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
  // Rwanda-specific address information
  address: {
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    sector: {
      type: String,
      required: [true, 'Sector is required'],
      trim: true
    },
    cell: {
      type: String,
      required: [true, 'Cell is required'],
      trim: true
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      trim: true
    }
  },
  
  // Socio-economic information for dropout risk assessment
  socioEconomic: {
    ubudeheLevel: {
      type: Number,
      required: [true, 'Ubudehe level is required'],
      enum: [1, 2, 3, 4],
      default: 4
    },
    hasParents: {
      type: Boolean,
      required: [true, 'Parent status is required'],
      default: true
    },
    guardianType: {
      type: String,
      enum: ['Parent', 'Sibling', 'Relative', 'Other'],
      required: function() {
        return !this.socioEconomic?.hasParents;
      }
    },
    parentJob: {
      type: String,
      trim: true
    },
    familyConflict: {
      type: Boolean,
      required: [true, 'Family conflict status is required'],
      default: false
    },
    numberOfSiblings: {
      type: Number,
      required: [true, 'Number of siblings is required'],
      min: [0, 'Number of siblings cannot be negative'],
      max: [20, 'Number of siblings cannot exceed 20']
    },
    parentEducationLevel: {
      type: String,
      enum: ['None', 'Primary', 'Secondary', 'University', 'Other'],
      required: [true, 'Parent education level is required']
    }
  },

  guardianContacts: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    relation: {
      type: String,
      enum: ['Father', 'Mother', 'Guardian', 'Sibling', 'Relative', 'Other'],
      required: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    job: {
      type: String,
      trim: true
    },
    educationLevel: {
      type: String,
      enum: ['None', 'Primary', 'Secondary', 'University', 'Other']
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
studentSchema.index({ 'address.district': 1, schoolId: 1 });
studentSchema.index({ 'socioEconomic.ubudeheLevel': 1, schoolId: 1 });
studentSchema.index({ 'socioEconomic.familyConflict': 1, schoolId: 1 });
studentSchema.index({ 'socioEconomic.hasParents': 1, schoolId: 1 });
studentSchema.index({ age: 1, schoolId: 1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  const middleName = this.middleName ? ` ${this.middleName}` : '';
  return `${this.firstName}${middleName} ${this.lastName}`;
});

// Note: Age is now a real field in the schema, no virtual needed

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
