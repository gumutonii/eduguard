const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateToken: auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get settings for school
router.get('/', auth, async (req, res) => {
  try {
    const settings = await Settings.getOrCreateForSchool(req.user.schoolId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

// Update risk rules (admin only)
router.put('/risk-rules', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update risk rules'
      });
    }

    const { riskRules } = req.body;

    const settings = await Settings.findOne({ schoolId: req.user.schoolId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    settings.riskRules = { ...settings.riskRules.toObject(), ...riskRules };
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: 'Risk rules updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Error updating risk rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update risk rules',
      error: error.message
    });
  }
});

// Update notification templates (admin only)
router.put('/notification-templates', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update notification templates'
      });
    }

    const { notificationTemplates } = req.body;

    const settings = await Settings.findOne({ schoolId: req.user.schoolId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    settings.notificationTemplates = { 
      ...settings.notificationTemplates.toObject(), 
      ...notificationTemplates 
    };
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: 'Notification templates updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Error updating notification templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification templates',
      error: error.message
    });
  }
});

// Update academic calendar (admin only)
router.put('/academic-calendar', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update academic calendar'
      });
    }

    const { academicCalendar } = req.body;

    const settings = await Settings.findOne({ schoolId: req.user.schoolId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    settings.academicCalendar = { 
      ...settings.academicCalendar.toObject(), 
      ...academicCalendar 
    };
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: 'Academic calendar updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Error updating academic calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update academic calendar',
      error: error.message
    });
  }
});

// Update system configuration (admin only)
router.put('/system-config', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update system configuration'
      });
    }

    const { systemConfig } = req.body;

    const settings = await Settings.findOne({ schoolId: req.user.schoolId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    settings.systemConfig = { 
      ...settings.systemConfig.toObject(), 
      ...systemConfig 
    };
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: 'System configuration updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Error updating system config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system configuration',
      error: error.message
    });
  }
});

// Update integration settings (admin only)
router.put('/integrations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update integration settings'
      });
    }

    const { integrations } = req.body;

    const settings = await Settings.findOne({ schoolId: req.user.schoolId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    settings.integrations = { 
      ...settings.integrations.toObject(), 
      ...integrations 
    };
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: 'Integration settings updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Error updating integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update integration settings',
      error: error.message
    });
  }
});

// Update all settings (admin only)
router.put('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update settings'
      });
    }

    const updates = req.body;
    updates.lastModifiedBy = req.user._id;

    const settings = await Settings.findOneAndUpdate(
      { schoolId: req.user.schoolId },
      updates,
      { new: true, runValidators: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

module.exports = router;
