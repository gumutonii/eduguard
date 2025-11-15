const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  riskFlagId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RiskFlag'
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['HOME_VISIT', 'COUNSELING', 'FEE_SUPPORT', 'TUTORING', 'PARENT_MEETING', 'MENTORING', 'REFERRAL', 'OTHER'],
    required: [true, 'Intervention type is required']
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    required: [true, 'Priority is required'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'],
    required: [true, 'Status is required'],
    default: 'PLANNED'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned to user ID is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user ID is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completedDate: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  outcome: {
    type: String,
    enum: ['SUCCESSFUL', 'PARTIALLY_SUCCESSFUL', 'UNSUCCESSFUL', 'PENDING', 'NOT_APPLICABLE'],
    default: 'PENDING'
  },
  outcomeNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Outcome notes cannot exceed 2000 characters']
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Note content cannot exceed 1000 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
interventionSchema.index({ studentId: 1, status: 1 });
interventionSchema.index({ schoolName: 1, schoolDistrict: 1, status: 1, dueDate: 1 });
interventionSchema.index({ assignedTo: 1, status: 1 });
interventionSchema.index({ dueDate: 1, status: 1 });
interventionSchema.index({ createdBy: 1, createdAt: -1 });
interventionSchema.index({ schoolId: 1, isActive: 1, status: 1 }); // For dashboard queries

// Virtual for isOverdue
interventionSchema.virtual('isOverdue').get(function() {
  return this.status !== 'COMPLETED' && this.status !== 'CANCELLED' && new Date() > this.dueDate;
});

// Method to add note
interventionSchema.methods.addNote = function(content, userId) {
  this.notes.push({
    content,
    createdBy: userId
  });
  return this.save();
};

// Method to complete intervention
interventionSchema.methods.complete = function(userId, outcome, outcomeNotes, followUpRequired, followUpDate) {
  this.status = 'COMPLETED';
  this.completedDate = new Date();
  this.completedBy = userId;
  this.outcome = outcome;
  this.outcomeNotes = outcomeNotes;
  this.followUpRequired = followUpRequired || false;
  this.followUpDate = followUpDate;
  return this.save();
};

// Static method to get dashboard summary
interventionSchema.statics.getDashboardSummary = async function(schoolName, schoolDistrict, userId = null, role = null) {
  const query = { schoolName, schoolDistrict };
  if (role === 'TEACHER' && userId) {
    query.assignedTo = userId;
  }

  const all = await this.find(query);
  const now = new Date();

  const summary = {
    total: all.length,
    planned: all.filter(i => i.status === 'PLANNED').length,
    inProgress: all.filter(i => i.status === 'IN_PROGRESS').length,
    completed: all.filter(i => i.status === 'COMPLETED').length,
    cancelled: all.filter(i => i.status === 'CANCELLED').length,
    overdue: all.filter(i => ['PLANNED', 'IN_PROGRESS'].includes(i.status) && i.dueDate < now).length,
    dueToday: all.filter(i => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return ['PLANNED', 'IN_PROGRESS'].includes(i.status) && i.dueDate >= today && i.dueDate < tomorrow;
    }).length,
    dueThisWeek: all.filter(i => {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return ['PLANNED', 'IN_PROGRESS'].includes(i.status) && i.dueDate <= weekFromNow;
    }).length
  };

  return summary;
};

// Static method to get interventions needing follow-up
interventionSchema.statics.getNeedingFollowUp = async function(schoolId) {
  const now = new Date();
  return await this.find({
    schoolName, schoolDistrict,
    status: 'COMPLETED',
    followUpRequired: true,
    followUpDate: { $lte: now }
  }).populate('studentId assignedTo');
};

module.exports = mongoose.model('Intervention', interventionSchema);
