const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  schoolDistrict: {
    type: String,
    required: [true, 'School district is required'],
    trim: true,
    maxlength: [100, 'District name cannot exceed 100 characters']
  },
  recipientType: {
    type: String,
    enum: ['GUARDIAN', 'PARENT', 'EMERGENCY_CONTACT'],
    required: [true, 'Recipient type is required'],
    default: 'GUARDIAN'
  },
  recipientName: {
    type: String,
    required: [true, 'Recipient name is required'],
    trim: true
  },
  recipientPhone: {
    type: String,
    required: [true, 'Recipient phone is required'],
    trim: true
  },
  recipientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  channel: {
    type: String,
    enum: ['SMS', 'EMAIL', 'BOTH'],
    required: [true, 'Channel is required'],
    default: 'SMS'
  },
  type: {
    type: String,
    enum: ['ABSENCE_ALERT', 'PERFORMANCE_ALERT', 'MEETING_REQUEST', 'GENERAL', 'INTERVENTION', 'EMERGENCY'],
    required: [true, 'Message type is required']
  },
  template: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    enum: ['EN', 'RW'],
    required: [true, 'Language is required'],
    default: 'RW'
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [1600, 'Content cannot exceed 1600 characters'] // SMS limit consideration
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'QUEUED'],
    required: [true, 'Status is required'],
    default: 'PENDING'
  },
  smsStatus: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'UNDELIVERED', 'NOT_SENT'],
    default: 'NOT_SENT'
  },
  emailStatus: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'NOT_SENT'],
    default: 'NOT_SENT'
  },
  smsSid: {
    type: String,
    trim: true
  },
  smsError: {
    type: String,
    trim: true
  },
  emailMessageId: {
    type: String,
    trim: true
  },
  emailError: {
    type: String,
    trim: true
  },
  sentAt: Date,
  deliveredAt: Date,
  failedAt: Date,
  retryCount: {
    type: Number,
    default: 0,
    min: [0, 'Retry count cannot be negative']
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  scheduledFor: Date,
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sent by user ID is required']
  },
  relatedRiskFlagId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RiskFlag'
  },
  relatedInterventionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ studentId: 1, createdAt: -1 });
messageSchema.index({ schoolName: 1, schoolDistrict: 1, status: 1, createdAt: -1 });
messageSchema.index({ status: 1, scheduledFor: 1 });
messageSchema.index({ sentBy: 1, createdAt: -1 });
messageSchema.index({ type: 1, status: 1 });
messageSchema.index({ schoolId: 1, sentAt: -1 }); // For dashboard queries
messageSchema.index({ sentAt: -1, status: 1 }); // For date range queries

// Method to mark as sent
messageSchema.methods.markAsSent = function(channel, messageId) {
  this.status = 'SENT';
  this.sentAt = new Date();
  
  if (channel === 'SMS') {
    this.smsStatus = 'SENT';
    this.smsSid = messageId;
  } else if (channel === 'EMAIL') {
    this.emailStatus = 'SENT';
    this.emailMessageId = messageId;
  }
  
  return this.save();
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function(channel) {
  this.deliveredAt = new Date();
  
  if (channel === 'SMS') {
    this.smsStatus = 'DELIVERED';
  } else if (channel === 'EMAIL') {
    this.emailStatus = 'DELIVERED';
  }
  
  // Update overall status if both channels delivered (when BOTH selected)
  if (this.channel === 'BOTH') {
    if (this.smsStatus === 'DELIVERED' && this.emailStatus === 'DELIVERED') {
      this.status = 'DELIVERED';
    }
  } else {
    this.status = 'DELIVERED';
  }
  
  return this.save();
};

// Method to mark as failed
messageSchema.methods.markAsFailed = function(channel, error) {
  this.failedAt = new Date();
  this.retryCount += 1;
  
  if (channel === 'SMS') {
    this.smsStatus = 'FAILED';
    this.smsError = error;
  } else if (channel === 'EMAIL') {
    this.emailStatus = 'FAILED';
    this.emailError = error;
  }
  
  // If retries exhausted or both channels failed
  if (this.retryCount >= this.maxRetries) {
    this.status = 'FAILED';
  }
  
  return this.save();
};

// Static method to get pending messages
messageSchema.statics.getPendingMessages = async function(limit = 100) {
  const now = new Date();
  return await this.find({
    status: { $in: ['PENDING', 'QUEUED'] },
    $or: [
      { scheduledFor: { $lte: now } },
      { scheduledFor: { $exists: false } }
    ],
    retryCount: { $lt: 3 }
  })
  .limit(limit)
  .sort({ scheduledFor: 1, createdAt: 1 });
};

// Static method to get delivery statistics
// Only counts messages that were actually sent (have SMS SID or Email ID)
messageSchema.statics.getDeliveryStats = async function(schoolName, schoolDistrict, startDate, endDate) {
  const messages = await this.find({
    schoolName, 
    schoolDistrict,
    createdAt: { $gte: startDate, $lte: endDate },
    // Only count messages that were actually sent (have SMS SID or Email ID)
    $or: [
      { smsSid: { $exists: true, $ne: null, $ne: '' } },
      { emailMessageId: { $exists: true, $ne: null, $ne: '' } },
      { status: { $in: ['SENT', 'DELIVERED'] } }
    ]
  });

  return {
    total: messages.length,
    sent: messages.filter(m => m.status === 'SENT' || m.status === 'DELIVERED').length,
    delivered: messages.filter(m => m.status === 'DELIVERED').length,
    failed: messages.filter(m => m.status === 'FAILED').length,
    pending: messages.filter(m => m.status === 'PENDING' || m.status === 'QUEUED').length,
    byType: {
      absence: messages.filter(m => m.type === 'ABSENCE_ALERT').length,
      performance: messages.filter(m => m.type === 'PERFORMANCE_ALERT').length,
      meeting: messages.filter(m => m.type === 'MEETING_REQUEST').length,
      intervention: messages.filter(m => m.type === 'INTERVENTION').length,
      emergency: messages.filter(m => m.type === 'EMERGENCY').length,
      general: messages.filter(m => m.type === 'GENERAL').length
    },
    byChannel: {
      sms: messages.filter(m => m.channel === 'SMS').length,
      email: messages.filter(m => m.channel === 'EMAIL').length,
      both: messages.filter(m => m.channel === 'BOTH').length
    }
  };
};

module.exports = mongoose.model('Message', messageSchema);
