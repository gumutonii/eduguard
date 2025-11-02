const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [50, 'Class name cannot exceed 50 characters']
  },
  
  // Grade and section information
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true,
    maxlength: [10, 'Grade cannot exceed 10 characters']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    maxlength: [10, 'Section cannot exceed 10 characters']
  },
  
  // School reference
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  
  // Teacher assignment
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Academic information
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
    default: function() {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }
  },
  
  // Class statistics
  studentCount: {
    type: Number,
    default: 0,
    min: [0, 'Student count cannot be negative']
  },
  maxCapacity: {
    type: Number,
    default: 50,
    min: [1, 'Max capacity must be at least 1']
  },
  
  // Class status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional information
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Creation tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
classSchema.index({ schoolId: 1, isActive: 1 });
classSchema.index({ assignedTeacher: 1, isActive: 1 });
classSchema.index({ schoolId: 1, className: 1 }, { unique: true });
classSchema.index({ academicYear: 1, isActive: 1 });

// Virtual for full class name
classSchema.virtual('fullName').get(function() {
  return this.className;
});

// Virtual for capacity status
classSchema.virtual('capacityStatus').get(function() {
  const percentage = (this.studentCount / this.maxCapacity) * 100;
  if (percentage >= 100) return 'FULL';
  if (percentage >= 80) return 'NEAR_FULL';
  return 'AVAILABLE';
});

// Static method to get classes by school
classSchema.statics.getBySchool = function(schoolId) {
  return this.find({ schoolId, isActive: true })
    .populate('schoolId', 'name district sector')
    .populate('assignedTeacher', 'name email role')
    .populate('createdBy', 'name email role');
};

// Static method to get classes by teacher
classSchema.statics.getByTeacher = function(teacherId) {
  return this.find({ assignedTeacher: teacherId, isActive: true })
    .populate('schoolId', 'name district sector')
    .populate('assignedTeacher', 'name email role');
};

// Static method to get classes by grade
classSchema.statics.getByGrade = function(schoolId, grade) {
  return this.find({ schoolId, grade, isActive: true })
    .populate('schoolId', 'name district sector')
    .populate('assignedTeacher', 'name email role');
};

// Static method to get class statistics
classSchema.statics.getClassStats = function(schoolId) {
  return this.aggregate([
    { $match: { schoolId: mongoose.Types.ObjectId(schoolId), isActive: true } },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        totalStudents: { $sum: '$studentCount' },
        classesWithTeachers: {
          $sum: { $cond: [{ $ne: ['$assignedTeacher', null] }, 1, 0] }
        },
        averageClassSize: { $avg: '$studentCount' },
        byGrade: {
          $push: {
            grade: '$grade',
            name: '$name',
            section: '$section',
            studentCount: '$studentCount',
            teacher: '$assignedTeacher'
          }
        }
      }
    }
  ]);
};

// Method to assign teacher
classSchema.methods.assignTeacher = async function(teacherId) {
  this.assignedTeacher = teacherId;
  await this.save();
  
  // Update teacher's assigned classes
  const User = require('./User');
  const teacher = await User.findById(teacherId);
  if (teacher && !teacher.assignedClasses.includes(this._id)) {
    teacher.assignedClasses.push(this._id);
    await teacher.save();
  }
  
  return this;
};

// Method to remove teacher assignment
classSchema.methods.removeTeacher = async function() {
  const oldTeacherId = this.assignedTeacher;
  this.assignedTeacher = null;
  await this.save();
  
  // Remove from teacher's assigned classes
  if (oldTeacherId) {
    const User = require('./User');
    const teacher = await User.findById(oldTeacherId);
    if (teacher) {
      teacher.assignedClasses = teacher.assignedClasses.filter(id => !id.equals(this._id));
      await teacher.save();
    }
  }
  
  return this;
};

// Method to update student count
classSchema.methods.updateStudentCount = async function() {
  const Student = require('./Student');
  const count = await Student.countDocuments({ classId: this._id, isActive: true });
  this.studentCount = count;
  await this.save();
  return this;
};

// Pre-save middleware to update student count
classSchema.pre('save', async function(next) {
  if (this.isModified('isActive') && !this.isActive) {
    // If class is being deactivated, remove all student assignments
    const Student = require('./Student');
    await Student.updateMany(
      { classId: this._id },
      { $unset: { classId: 1 } }
    );
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);