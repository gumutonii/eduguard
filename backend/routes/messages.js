const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Student = require('../models/Student');
const { authenticateToken: auth } = require('../middleware/auth');
const messageService = require('../services/messageService');
const logger = require('../utils/logger');

// Get messages with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      studentId, 
      type, 
      status, 
      channel, 
      startDate, 
      endDate,
      page = 1,
      limit = 20,
      search
    } = req.query;
    const query = { schoolId: req.user.schoolId };

    if (studentId) query.studentId = studentId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (channel) query.channel = channel;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Search functionality - combine with other filters using $and
    if (search) {
      const searchConditions = {
        $or: [
          { recipientName: { $regex: search, $options: 'i' } },
          { recipientPhone: { $regex: search, $options: 'i' } },
          { recipientEmail: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { template: { $regex: search, $options: 'i' } }
        ]
      };
      
      // Build base query without search
      const baseQuery = { schoolId: query.schoolId };
      if (query.studentId) baseQuery.studentId = query.studentId;
      if (query.type) baseQuery.type = query.type;
      if (query.status) baseQuery.status = query.status;
      if (query.channel) baseQuery.channel = query.channel;
      if (query.createdAt) baseQuery.createdAt = query.createdAt;
      
      // Combine base query with search using $and
      query.$and = [
        baseQuery,
        searchConditions
      ];
      
      // Remove individual filter fields from query since they're now in $and
      delete query.studentId;
      delete query.type;
      delete query.status;
      delete query.channel;
      delete query.createdAt;
    }

    // For teachers, filter by their assigned students
    if (req.user.role === 'TEACHER') {
      const students = await Student.find({
        assignedTeacherId: req.user._id,
        schoolId: req.user.schoolId
      }).select('_id');
      const studentIds = students.map(s => s._id);
      
      if (query.studentId) {
        // If studentId filter exists, intersect with assigned students
        if (typeof query.studentId === 'object' && query.studentId.$in) {
          query.studentId.$in = query.studentId.$in.filter(id => studentIds.includes(id.toString()));
        } else {
          query.studentId = studentIds.includes(query.studentId.toString()) ? query.studentId : { $in: [] };
    }
      } else {
        query.studentId = { $in: studentIds };
      }
    }

    // Get total count for pagination
    const total = await Message.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    const messages = await Message.find(query)
      .populate('studentId', 'firstName lastName fullName studentId')
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Get delivery statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Fetch school info to get name and district
    const School = require('../models/School');
    const school = await School.findById(req.user.schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const stats = await Message.getDeliveryStats(school.name, school.district, start, end);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching message statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message statistics',
      error: error.message
    });
  }
});

// Send custom message
router.post('/send', auth, async (req, res) => {
  try {
    // Fetch school info to populate schoolName and schoolDistrict
    const School = require('../models/School');
    const school = await School.findById(req.user.schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const messageData = {
      ...req.body,
      schoolId: req.user.schoolId,
      schoolName: school.name,
      schoolDistrict: school.district,
      sentBy: req.user._id
    };

    const message = await messageService.sendMessage(messageData);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Send message from template
router.post('/send-template', auth, async (req, res) => {
  try {
    const { studentId, templateType, variables, channel } = req.body;

    if (!studentId || !templateType) {
      return res.status(400).json({
        success: false,
        message: 'studentId and templateType are required'
      });
    }

    const message = await messageService.createFromTemplate(
      studentId,
      templateType,
      variables || {},
      channel || 'SMS',
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Error sending template message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Send bulk messages
router.post('/send-bulk', auth, async (req, res) => {
  try {
    const { studentIds, content, subject, channel, type } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentIds array is required'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'content is required'
      });
    }

    const results = [];
    const errors = [];

    // Fetch school info once for all messages
    const School = require('../models/School');
    const school = await School.findById(req.user.schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    for (const studentId of studentIds) {
      try {
        const student = await Student.findById(studentId).populate('schoolId');
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        const primaryGuardian = student.getPrimaryGuardian();
        if (!primaryGuardian) {
          errors.push({ studentId, error: 'No guardian contact found' });
          continue;
        }

        // Get guardian name (support both new structure and legacy)
        const guardianName = primaryGuardian.name || 
          (primaryGuardian.firstName && primaryGuardian.lastName 
            ? `${primaryGuardian.firstName} ${primaryGuardian.lastName}` 
            : primaryGuardian.firstName || 'Guardian');

        const messageData = {
          studentId: student._id,
          schoolId: req.user.schoolId,
          schoolName: school.name,
          schoolDistrict: school.district,
          recipientType: 'GUARDIAN',
          recipientName: guardianName,
          recipientPhone: primaryGuardian.phone,
          recipientEmail: primaryGuardian.email,
          channel: channel || 'SMS',
          type: type || 'GENERAL',
          content,
          subject: subject || 'Message from EduGuard',
          sentBy: req.user._id
        };

        const message = await messageService.sendMessage(messageData);
        results.push({ studentId, messageId: message._id, status: 'sent' });
      } catch (error) {
        errors.push({ studentId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Sent ${results.length} messages`,
      sent: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Error sending bulk messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk messages',
      error: error.message
    });
  }
});

// Retry failed message
router.post('/:id/retry', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.status !== 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Only failed messages can be retried'
      });
    }

    // Reset status and retry
    message.status = 'PENDING';
    message.retryCount = 0;
    await message.save();

    // Send message
    if (message.channel === 'SMS' || message.channel === 'BOTH') {
      await messageService.sendViaSMS(message);
    }

    if (message.channel === 'EMAIL' || message.channel === 'BOTH') {
      await messageService.sendViaEmail(message);
    }

    res.json({
      success: true,
      message: 'Message retry initiated',
      data: message
    });
  } catch (error) {
    logger.error('Error retrying message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry message',
      error: error.message
    });
  }
});

// Get pending messages (admin only)
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view pending messages'
      });
    }

    const pending = await Message.getPendingMessages(100);

    res.json({
      success: true,
      count: pending.length,
      data: pending
    });
  } catch (error) {
    logger.error('Error fetching pending messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending messages',
      error: error.message
    });
  }
});

// Process pending messages manually (admin only)
router.post('/process-pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can process pending messages'
      });
    }

    // Process asynchronously
    messageService.processPendingMessages()
      .then(() => {
        logger.info('Pending messages processed successfully');
      })
      .catch(error => {
        logger.error('Failed to process pending messages:', error);
      });

    res.json({
      success: true,
      message: 'Processing pending messages...'
    });
  } catch (error) {
    logger.error('Error starting message processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start message processing',
      error: error.message
    });
  }
});

module.exports = router;
