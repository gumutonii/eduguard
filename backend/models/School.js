const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    maxlength: [100, 'District name cannot exceed 100 characters']
  },
  sector: {
    type: String,
    required: [true, 'Sector is required'],
    trim: true,
    maxlength: [100, 'Sector name cannot exceed 100 characters']
  },
  schoolType: {
    type: String,
    enum: ['PRIMARY', 'SECONDARY', 'PRIMARY_AND_SECONDARY'],
    required: [true, 'School type is required'],
    default: 'PRIMARY_AND_SECONDARY'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  principal: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Principal name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
    },
    totalTeachers: {
      type: Number,
      default: 0
    },
    totalClasses: {
      type: Number,
      default: 0
    },
    atRiskStudents: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  }
}, {
  timestamps: true
});

// Indexes for better performance
schoolSchema.index({ name: 1, district: 1, sector: 1 }, { unique: true });
schoolSchema.index({ district: 1, isActive: 1 });
schoolSchema.index({ createdBy: 1, isActive: 1 });
schoolSchema.index({ schoolType: 1, isActive: 1 });

// Virtual for full school location
schoolSchema.virtual('fullLocation').get(function() {
  return `${this.sector}, ${this.district}`;
});

// Static method to get schools by district
schoolSchema.statics.getByDistrict = function(district) {
  return this.find({ district, isActive: true }).populate('createdBy', 'name email role');
};

// Static method to get schools by sector
schoolSchema.statics.getBySector = function(district, sector) {
  return this.find({ district, sector, isActive: true }).populate('createdBy', 'name email role');
};

// Static method to get school statistics
schoolSchema.statics.getSchoolStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalSchools: { $sum: 1 },
        totalStudents: { $sum: '$statistics.totalStudents' },
        totalTeachers: { $sum: '$statistics.totalTeachers' },
        totalClasses: { $sum: '$statistics.totalClasses' },
        atRiskStudents: { $sum: '$statistics.atRiskStudents' },
        byDistrict: {
          $push: {
            district: '$district',
            sector: '$sector',
            name: '$name',
            students: '$statistics.totalStudents',
            teachers: '$statistics.totalTeachers',
            classes: '$statistics.totalClasses'
          }
        }
      }
    }
  ]);
};

// Method to update statistics
schoolSchema.methods.updateStatistics = async function() {
  const User = require('./User');
  const Student = require('./Student');
  const Class = require('./Class');
  
  try {
    // Count users (teachers and admins) for this school
    const totalTeachers = await User.countDocuments({ 
      schoolName: this.name, 
      role: { $in: ['ADMIN', 'TEACHER'] },
      isActive: true 
    });
    
    // Count students for this school
    const totalStudents = await Student.countDocuments({ 
      schoolName: this.name, 
      isActive: true 
    });
    
    // Count at-risk students
    const atRiskStudents = await Student.countDocuments({ 
      schoolName: this.name, 
      riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] },
      isActive: true 
    });
    
    // Count classes for this school
    const totalClasses = await Class.countDocuments({ 
      schoolName: this.name, 
      isActive: true 
    });
    
    // Update statistics
    this.statistics = {
      totalStudents,
      totalTeachers,
      totalClasses,
      atRiskStudents
    };
    
    await this.save();
    return this.statistics;
  } catch (error) {
    console.error('Error updating school statistics:', error);
    throw error;
  }
};

module.exports = mongoose.model('School', schoolSchema);
