const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get in-app notifications with filtering
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const { 
      page = 1, 
      limit = 20, 
      entityType, 
      type, 
      isRead,
      search 
    } = req.query;

    const user = req.user;
    const schoolId = user.schoolId;

    // Build base query based on user role
    let query = {
      schoolId
    };

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      // Admins see all admin notifications and ALL notifications
      query.$or = [
        { recipientType: 'ADMIN' },
        { recipientType: 'ALL' }
      ];
    } else if (user.role === 'TEACHER') {
      // Teachers see their own notifications (recipientId matches) and ALL notifications
      query.$or = [
        { recipientType: 'TEACHER', recipientId: user._id },
        { recipientType: 'ALL' }
      ];
    } else {
      // Other roles see only their specific notifications
      query.$or = [
        { recipientId: user._id },
        { recipientType: 'ALL' }
      ];
    }

    // Apply filters
    if (entityType) {
      query.entityType = entityType;
    }

    if (type) {
      query.type = type;
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Handle search - combine with existing filters
    if (search) {
      const searchQuery = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ]
      };
      
      // Use $and to combine recipient filter with search
      let recipientFilter;
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        recipientFilter = {
          $or: [
            { recipientType: 'ADMIN' },
            { recipientType: 'ALL' }
          ]
        };
      } else if (user.role === 'TEACHER') {
        recipientFilter = {
          $or: [
            { recipientType: 'TEACHER', recipientId: user._id },
            { recipientType: 'ALL' }
          ]
        };
      } else {
        recipientFilter = {
          $or: [
            { recipientId: user._id },
            { recipientType: 'ALL' }
          ]
        };
      }

      query.$and = [
        recipientFilter,
        searchQuery
      ];
      
      // Move other filters to $and
      if (entityType || type || isRead !== undefined) {
        query.$and.push({
          ...(entityType && { entityType }),
          ...(type && { type }),
          ...(isRead !== undefined && { isRead: isRead === 'true' })
        });
      }
      
      delete query.$or;
      delete query.entityType;
      delete query.type;
      delete query.isRead;
    }

    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    // Get notifications with proper population
    // Map entityType to correct model names
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Use lean() to get plain objects first
    
    // Manually populate entityId based on entityType
    const Student = require('../models/Student');
    const User = require('../models/User');
    const Class = require('../models/Class');
    const School = require('../models/School');
    
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
      
      // Populate recipientId
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

    res.json({
      success: true,
      data: populatedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Return 404 for now since we have no notifications
    res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification'
    });
  }
});

// @route   POST /api/notifications
// @desc    Create new notification
// @access  Private (Admin, Teacher)
router.post('/', [
  authenticateToken,
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('recipient').notEmpty().withMessage('Recipient is required'),
  body('channel').isIn(['EMAIL', 'SMS', 'PUSH']).withMessage('Invalid channel'),
  body('template').notEmpty().withMessage('Template is required'),
  body('content').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { studentId, recipient, channel, template, content } = req.body;

    // Check if user has access to the student
    // This would involve checking if the user is admin, teacher of the student, or parent of the student

    // Mock notification creation
    const notification = {
      _id: new Date().getTime().toString(),
      studentId,
      recipient,
      channel,
      template,
      status: 'PENDING',
      sentAt: new Date().toISOString(),
      content: content || `Notification sent via ${channel}`
    };

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// @route   PUT /api/notifications/:id/status
// @desc    Update notification status
// @access  Private (Admin, Teacher)
router.put('/:id/status', [
  authenticateToken,
  body('status').isIn(['PENDING', 'SENT', 'DELIVERED', 'FAILED']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Mock notification update
    const notification = {
      _id: id,
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'DELIVERED') {
      notification.deliveredAt = new Date().toISOString();
    }

    res.json({
      success: true,
      message: 'Notification status updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Update notification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification status'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const { id } = req.params;
    const user = req.user;

    const notification = await Notification.findOne({
      _id: id,
      schoolId: user.schoolId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read for user
// @access  Private
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const user = req.user;

    // Build query based on user role
    let markReadQuery = {
      schoolId: user.schoolId,
      isRead: false
    };

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      markReadQuery.$or = [
        { recipientType: 'ADMIN' },
        { recipientType: 'ALL' }
      ];
    } else if (user.role === 'TEACHER') {
      markReadQuery.$or = [
        { recipientType: 'TEACHER', recipientId: user._id },
        { recipientType: 'ALL' }
      ];
    } else {
      markReadQuery.$or = [
        { recipientId: user._id },
        { recipientType: 'ALL' }
      ];
    }

    const result = await Notification.updateMany(
      markReadQuery,
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: { count: result.modifiedCount }
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private (Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const { id } = req.params;
    const user = req.user;

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      schoolId: user.schoolId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});


module.exports = router;
