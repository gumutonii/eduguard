const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['PRIMARY', 'SECONDARY'],
    required: [true, 'School type is required']
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  province: {
    type: String,
    required: [true, 'Province is required'],
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
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isBoarding: {
    type: Boolean,
    default: false
  },
  established: {
    type: Number,
    min: [1900, 'Establishment year must be after 1900'],
    max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
  },
  enrollment: {
    type: Number,
    min: [0, 'Enrollment cannot be negative']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Rwanda' }
  },
  contact: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true }
  },
  settings: {
    academicYear: {
      start: { type: Date, default: () => new Date(new Date().getFullYear(), 8, 1) }, // September 1st
      end: { type: Date, default: () => new Date(new Date().getFullYear() + 1, 5, 30) } // June 30th
    },
    attendanceThreshold: { type: Number, default: 90 }, // 90% attendance threshold
    riskAssessmentRules: {
      attendanceWeight: { type: Number, default: 0.4 },
      performanceWeight: { type: Number, default: 0.4 },
      behaviorWeight: { type: Number, default: 0.2 }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
schoolSchema.index({ name: 1 });
schoolSchema.index({ isActive: 1 });
schoolSchema.index({ type: 1 });
schoolSchema.index({ district: 1 });
schoolSchema.index({ province: 1 });
schoolSchema.index({ isPublic: 1 });
schoolSchema.index({ isBoarding: 1 });

module.exports = mongoose.model('School', schoolSchema);
