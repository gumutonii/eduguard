const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get notifications with filtering
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      channel, 
      search 
    } = req.query;

    // Mock notification data (in real app, this would come from notification records)
    const mockNotifications = [
      {
        _id: '1',
        studentId: 'student1',
        recipient: 'parent@example.com',
        channel: 'EMAIL',
        template: 'attendance_alert',
        status: 'SENT',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString()
      },
      {
        _id: '2',
        studentId: 'student2',
        recipient: '+1234567890',
        channel: 'SMS',
        template: 'performance_alert',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString()
      },
      {
        _id: '3',
        studentId: 'student3',
        recipient: 'teacher@school.com',
        channel: 'PUSH',
        template: 'risk_alert',
        status: 'PENDING',
        sentAt: new Date().toISOString()
      }
    ];

    let filteredNotifications = mockNotifications;

    // Apply filters
    if (status) {
      filteredNotifications = filteredNotifications.filter(n => n.status === status);
    }
    if (channel) {
      filteredNotifications = filteredNotifications.filter(n => n.channel === channel);
    }
    if (search) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.recipient.toLowerCase().includes(search.toLowerCase()) ||
        n.template.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredNotifications.length,
        pages: Math.ceil(filteredNotifications.length / limit)
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

    // Mock notification data
    const notification = {
      _id: id,
      studentId: 'student1',
      recipient: 'parent@example.com',
      channel: 'EMAIL',
      template: 'attendance_alert',
      status: 'SENT',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      content: 'Your child has missed 3 consecutive days. Please contact the school.',
      metadata: {
        studentName: 'John Doe',
        className: 'Grade 10A',
        attendanceRate: 85
      }
    };

    res.json({
      success: true,
      data: notification
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

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private (Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mock notification deletion
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
