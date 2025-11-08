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
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // School and class references
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned teacher is required']
  },
  
  // Personal information
  gender: {
    type: String,
    enum: ['M', 'F'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [3, 'Age must be at least 3'],
    max: [25, 'Age cannot exceed 25']
  },
  
  // Address information - simplified to district and sector only
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
      trim: true,
      default: ''
    },
    village: {
      type: String,
      trim: true,
      default: ''
    }
  },
  
  // Socio-economic information - simplified to essential fields only
  socioEconomic: {
    ubudeheLevel: {
      type: Number,
      required: [true, 'Ubudehe level is required'],
      min: [1, 'Ubudehe level must be at least 1'],
      max: [4, 'Ubudehe level cannot exceed 4']
    },
    hasParents: {
      type: Boolean,
      required: [true, 'Has parents information is required']
    },
    familyStability: {
      type: Boolean,
      required: [true, 'Family stability information is required'],
      default: true
    },
    numberOfSiblings: {
      type: Number,
      required: [true, 'Number of siblings is required'],
      min: [0, 'Number of siblings cannot be negative'],
      max: [20, 'Number of siblings cannot exceed 20'],
      default: 0
    },
    distanceToSchoolKm: {
      type: Number,
      required: false, // Made optional for existing students
      min: [0, 'Distance cannot be negative'],
      max: [50, 'Distance cannot exceed 50 km'],
      default: 0
    },
    // Optional fields that can be added later
    parentJob: {
      type: String,
      trim: true
    },
    parentEducationLevel: {
      type: String,
      enum: ['None', 'Primary', 'Secondary', 'University', 'Other']
    }
  },
  
  // Guardian contacts - updated with new structure
  guardianContacts: [{
    // Support both new structure (firstName/lastName) and legacy (name)
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    relation: {
      type: String,
      enum: ['Father', 'Mother', 'Uncle', 'Aunt', 'Sibling', 'Other Relative', 'Guardian', 'Relative', 'Other'], // Include legacy values for backward compatibility
      required: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[\+]?250[0-9]{9}$|^0[0-9]{9}$/, 'Please enter a valid phone number']
    },
    education: {
      type: String,
      enum: ['None', 'Primary', 'Secondary', 'University'],
      required: true
    },
    educationLevel: {
      type: String,
      enum: ['None', 'Primary', 'Secondary', 'University', 'Other']
    },
    occupation: {
      type: String,
      required: true,
      trim: true
    },
    job: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Student status
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  lastAttendanceDate: Date,
  
  // Risk assessment
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  
  // Risk flags (embedded for quick access)
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
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
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
  
  // Notes
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
  }],
  
  // Profile picture
  profilePicture: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
studentSchema.index({ schoolId: 1, isActive: 1 });
studentSchema.index({ classId: 1, isActive: 1 });
studentSchema.index({ assignedTeacher: 1, isActive: 1 });
studentSchema.index({ riskLevel: 1, isActive: 1 });
studentSchema.index({ schoolId: 1, classId: 1, isActive: 1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
studentSchema.virtual('calculatedAge').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Static method to get students by school
studentSchema.statics.getBySchool = function(schoolId) {
  return this.find({ schoolId, isActive: true })
    .populate('schoolId', 'name district sector')
    .populate('classId', 'name grade section')
    .populate('assignedTeacher', 'name email');
};

// Static method to get students by class
studentSchema.statics.getByClass = function(classId) {
  return this.find({ classId, isActive: true })
    .populate('schoolId', 'name district sector')
    .populate('classId', 'name grade section')
    .populate('assignedTeacher', 'name email');
};

// Static method to get students by teacher
studentSchema.statics.getByTeacher = function(teacherId) {
  return this.find({ assignedTeacher: teacherId, isActive: true })
    .populate('schoolId', 'name district sector')
    .populate('classId', 'name grade section');
};

// Static method to get at-risk students
studentSchema.statics.getAtRisk = function(schoolId = null) {
  const query = { 
    riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] }, 
    isActive: true 
  };
  
  if (schoolId) {
    query.schoolId = schoolId;
  }
  
  return this.find(query)
    .populate('schoolId', 'name district sector')
    .populate('classId', 'name grade section')
    .populate('assignedTeacher', 'name email');
};

// Method to add risk flag
studentSchema.methods.addRiskFlag = function(flagData) {
  this.riskFlags.push(flagData);
  return this.save();
};

// Method to resolve risk flag
studentSchema.methods.resolveRiskFlag = function(flagId, resolvedBy) {
  const flag = this.riskFlags.id(flagId);
  if (flag) {
    flag.isResolved = true;
    flag.resolvedAt = new Date();
    flag.resolvedBy = resolvedBy;
  }
  return this.save();
};

// Method to get primary guardian
studentSchema.methods.getPrimaryGuardian = function() {
  if (!this.guardianContacts || this.guardianContacts.length === 0) {
    return null;
  }
  
  // Priority: Father > Mother > First guardian with phone > First guardian
  const father = this.guardianContacts.find(g => 
    g.relation === 'Father' && (g.phone || g.email)
  );
  if (father) return father;
  
  const mother = this.guardianContacts.find(g => 
    g.relation === 'Mother' && (g.phone || g.email)
  );
  if (mother) return mother;
  
  // Find first guardian with contact info
  const guardianWithContact = this.guardianContacts.find(g => 
    g.phone || g.email
  );
  if (guardianWithContact) return guardianWithContact;
  
  // Return first guardian if no contact info available
  return this.guardianContacts[0] || null;
};

// Method to update risk level based on flags
studentSchema.methods.updateRiskLevel = async function() {
  const activeFlags = this.riskFlags.filter(flag => !flag.isResolved);
  const previousRiskLevel = this.riskLevel;
  
  if (activeFlags.length === 0) {
    this.riskLevel = 'LOW';
  } else {
    const severities = activeFlags.map(flag => flag.severity);
    if (severities.includes('CRITICAL')) {
      this.riskLevel = 'CRITICAL';
    } else if (severities.includes('HIGH')) {
      this.riskLevel = 'HIGH';
    } else if (severities.includes('MEDIUM')) {
      this.riskLevel = 'MEDIUM';
    } else {
      this.riskLevel = 'LOW';
    }
  }
  
  await this.save();

  // Notify admins if risk level changed to or is at-risk
  if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(this.riskLevel)) {
    // Only notify if risk level changed or if it's a new risk level
    if (previousRiskLevel !== this.riskLevel || previousRiskLevel === 'LOW') {
      const { notifyAdminOfStudentRisk } = require('../utils/adminNotificationService');
      let reason = '';
      if (previousRiskLevel !== this.riskLevel) {
        reason = `Risk level changed from ${previousRiskLevel || 'LOW'} to ${this.riskLevel}.`;
      } else {
        reason = `Student has ${activeFlags.length} active risk flag(s) with ${this.riskLevel} risk level.`;
      }
      
      // Get risk type from flags
      const riskTypes = [...new Set(activeFlags.map(f => f.type || 'GENERAL'))];
      const riskType = riskTypes.length > 0 ? riskTypes[0] : 'GENERAL';
      
      // Don't await to avoid blocking save operation
      notifyAdminOfStudentRisk(this._id, this.riskLevel, reason, riskType).catch(err => {
        console.error('Error notifying admin of student risk:', err);
      });

      // Automatically notify parents/guardians if risk level changed to HIGH or CRITICAL
      // Only notify parents when risk level escalates (not on every update)
      if ((previousRiskLevel !== this.riskLevel) && (this.riskLevel === 'HIGH' || this.riskLevel === 'CRITICAL')) {
        const { notifyParentsOfRisk } = require('../utils/notificationService');
        const riskDescription = reason || `Student has been flagged as ${this.riskLevel} risk. Immediate attention may be required.`;
        
        // Don't await to avoid blocking save operation
        notifyParentsOfRisk(this._id, this.riskLevel, riskDescription).catch(err => {
          console.error('Error notifying parents of student risk:', err);
        });
      }
    }
  }
  
  return this;
};

module.exports = mongoose.model('Student', studentSchema);