const express = require('express');
const router = express.Router();
const Intervention = require('../models/Intervention');
const Student = require('../models/Student');
const { authenticateToken: auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get interventions with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, status, assignedTo, priority, type } = req.query;
    const query = { schoolId: req.user.schoolId };

    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (type) query.type = type;

    // For teachers, show interventions assigned to them or created by them
    if (req.user.role === 'TEACHER') {
      query.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    const interventions = await Intervention.find(query)
      .populate('studentId', 'firstName lastName fullName classroomId riskLevel')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('riskFlagId')
      .sort({ dueDate: 1, priority: -1 });

    res.json({
      success: true,
      count: interventions.length,
      data: interventions
    });
  } catch (error) {
    logger.error('Error fetching interventions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interventions',
      error: error.message
    });
  }
});

// Get intervention dashboard summary
router.get('/dashboard-summary', auth, async (req, res) => {
  try {
    const summary = await Intervention.getDashboardSummary(
      req.user.schoolId,
      req.user._id,
      req.user.role
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message
    });
  }
});

// Get interventions needing follow-up
router.get('/follow-up', auth, async (req, res) => {
  try {
    const interventions = await Intervention.getNeedingFollowUp(req.user.schoolId);

    res.json({
      success: true,
      count: interventions.length,
      data: interventions
    });
  } catch (error) {
    logger.error('Error fetching follow-up interventions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-up interventions',
      error: error.message
    });
  }
});

// Get single intervention
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const intervention = await Intervention.findById(id)
      .populate('studentId')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('completedBy', 'name email role')
      .populate('riskFlagId')
      .populate('notes.createdBy', 'name email');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    res.json({
      success: true,
      data: intervention
    });
  } catch (error) {
    logger.error('Error fetching intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch intervention',
      error: error.message
    });
  }
});

// Create intervention
router.post('/', auth, async (req, res) => {
  try {
    const interventionData = {
      ...req.body,
      schoolId: req.user.schoolId,
      createdBy: req.user._id
    };

    const intervention = await Intervention.create(interventionData);

    res.status(201).json({
      success: true,
      message: 'Intervention created successfully',
      data: intervention
    });
  } catch (error) {
    logger.error('Error creating intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create intervention',
      error: error.message
    });
  }
});

// Update intervention
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const intervention = await Intervention.findById(id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && 
        intervention.assignedTo.toString() !== req.user._id.toString() &&
        intervention.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this intervention'
      });
    }

    Object.assign(intervention, updates);
    await intervention.save();

    res.json({
      success: true,
      message: 'Intervention updated successfully',
      data: intervention
    });
  } catch (error) {
    logger.error('Error updating intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update intervention',
      error: error.message
    });
  }
});

// Add note to intervention
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const intervention = await Intervention.findById(id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    await intervention.addNote(content, req.user._id);

    res.json({
      success: true,
      message: 'Note added successfully',
      data: intervention
    });
  } catch (error) {
    logger.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
});

// Complete intervention
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome, outcomeNotes, followUpRequired, followUpDate } = req.body;

    if (!outcome) {
      return res.status(400).json({
        success: false,
        message: 'Outcome is required'
      });
    }

    const intervention = await Intervention.findById(id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && 
        intervention.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this intervention'
      });
    }

    await intervention.complete(
      req.user._id,
      outcome,
      outcomeNotes,
      followUpRequired,
      followUpDate
    );

    res.json({
      success: true,
      message: 'Intervention completed successfully',
      data: intervention
    });
  } catch (error) {
    logger.error('Error completing intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete intervention',
      error: error.message
    });
  }
});

// Delete intervention (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete interventions'
      });
    }

    const { id } = req.params;
    const intervention = await Intervention.findByIdAndDelete(id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    res.json({
      success: true,
      message: 'Intervention deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete intervention',
      error: error.message
    });
  }
});

module.exports = router;
