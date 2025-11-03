const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Entity type and reference (what the notification is about)
  entityType: {
    type: String,
    enum: ['SCHOOL', 'TEACHER', 'STUDENT', 'PARENT', 'CLASS'],
    required: [true, 'Entity type is required']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required'],
    refPath: 'entityType'
  },
  
  // Recipient information (who receives the notification)
  recipientType: {
    type: String,
    enum: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ALL'],
    required: [true, 'Recipient type is required']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for 'ALL' recipients
  },
  
  // Notification details
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: [
      'STUDENT_REGISTERED',
      'STUDENT_AT_RISK',
      'TEACHER_APPROVED',
      'TEACHER_REJECTED',
      'CLASS_CREATED',
      'CLASS_ASSIGNED',
      'ATTENDANCE_ALERT',
      'PERFORMANCE_ALERT',
      'INTERVENTION_ALERT',
      'PARENT_MESSAGE_SENT',
      'SYSTEM_UPDATE',
      'SCHOOL_APPROVED',
      'SCHOOL_REJECTED',
      'GENERAL'
    ],
    required: [true, 'Notification type is required']
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  
  // Status and metadata
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  
  // School reference for filtering
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  
  // Action link (optional - where to navigate when clicked)
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  
  // Additional data (flexible for different notification types)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ schoolId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ entityType: 1, entityId: 1 });
notificationSchema.index({ recipientType: 1, schoolId: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(recipientId, schoolId) {
  return this.countDocuments({
    $or: [
      { recipientId, isRead: false },
      { recipientType: 'ALL', schoolId, isRead: false }
    ]
  });
};

// Static method to get notifications for admin
notificationSchema.statics.getAdminNotifications = async function(schoolId, filters = {}) {
  const query = {
    schoolId,
    $or: [
      { recipientType: 'ADMIN' },
      { recipientType: 'ALL' }
    ]
  };
  
  if (filters.entityType) {
    query.entityType = filters.entityType;
  }
  
  if (filters.type) {
    query.type = filters.type;
  }
  
  if (filters.isRead !== undefined) {
    query.isRead = filters.isRead;
  }
  
  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50)
    .lean();
  
  // Manually populate entityId and recipientId
  const Student = mongoose.model('Student');
  const User = mongoose.model('User');
  const Class = mongoose.model('Class');
  const School = mongoose.model('School');
  
  const populatedNotifications = await Promise.all(notifications.map(async (notification) => {
    let entity = null;
    
    if (notification.entityId) {
      try {
        switch (notification.entityType) {
          case 'STUDENT':
            entity = await Student.findById(notification.entityId).select('firstName lastName studentId className').lean();
            break;
          case 'TEACHER':
          case 'PARENT':
            entity = await User.findById(notification.entityId).select('name email className').lean();
            break;
          case 'CLASS':
            entity = await Class.findById(notification.entityId).select('className grade section').lean();
            break;
          case 'SCHOOL':
            entity = await School.findById(notification.entityId).select('name district sector').lean();
            break;
        }
      } catch (err) {
        console.error(`Error populating ${notification.entityType}:`, err);
      }
    }
    
    let recipient = null;
    if (notification.recipientId) {
      try {
        recipient = await User.findById(notification.recipientId).select('name email').lean();
      } catch (err) {
        console.error('Error populating recipient:', err);
      }
    }
    
    return {
      ...notification,
      entityId: entity,
      recipientId: recipient
    };
  }));
  
  return populatedNotifications;
};

module.exports = mongoose.model('Notification', notificationSchema);

