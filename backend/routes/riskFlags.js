const express = require('express');
const router = express.Router();
const RiskFlag = require('../models/RiskFlag');
const Student = require('../models/Student');
const { authenticateToken: auth } = require('../middleware/auth');
const riskDetectionService = require('../services/riskDetectionService');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');

// Get risk flags with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, type, severity, isActive, isResolved } = req.query;
    // SUPER_ADMIN can see all data, others are filtered by school
    const query = {};
    
    // Filter by school for non-SUPER_ADMIN users
    if (req.user.role !== 'SUPER_ADMIN' && req.user.schoolId) {
      query.schoolId = req.user.schoolId;
    }

    if (studentId) query.studentId = studentId;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';

    // For teachers, filter by their assigned students
    if (req.user.role === 'TEACHER') {
      const students = await Student.find({
        assignedTeacher: req.user._id,
        schoolId: req.user.schoolId,
        isActive: true
      }).select('_id');
      if (students.length > 0) {
        query.studentId = { $in: students.map(s => s._id) };
      } else {
        // No students assigned, return empty result
        query.studentId = { $in: [] };
      }
    }

    const flags = await RiskFlag.find(query)
      .populate({
        path: 'studentId',
        select: 'firstName lastName fullName classroomId riskLevel guardianContacts',
        populate: {
          path: 'guardianContacts',
          select: 'name phone email relation'
        }
      })
      .populate('createdBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: flags.length,
      data: flags
    });
  } catch (error) {
    logger.error('Error fetching risk flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk flags',
      error: error.message
    });
  }
});

// Get risk summary for school
router.get('/summary', auth, async (req, res) => {
  try {
    const summary = await RiskFlag.getSchoolSummary(req.user.schoolId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching risk summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk summary',
      error: error.message
    });
  }
});

// Get risk summary for a student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const summary = await RiskFlag.getStudentSummary(studentId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching student risk summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student risk summary',
      error: error.message
    });
  }
});

// Export risk report as PDF
router.get('/export-pdf', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can export risk reports'
      });
    }

    const { severity, type, isActive } = req.query;
    const query = {};
    
    // Filter by school for non-SUPER_ADMIN users
    if (req.user.role !== 'SUPER_ADMIN' && req.user.schoolId) {
      query.schoolId = req.user.schoolId;
    }

    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Get school info
    const School = require('../models/School');
    const school = await School.findById(req.user.schoolId);
    const schoolName = school?.name || 'School';

    // Get all risk flags
    const riskFlags = await RiskFlag.find(query)
      .populate('studentId', 'firstName lastName studentId classId riskLevel')
      .populate('createdBy', 'name email')
      .sort({ severity: -1, createdAt: -1 });

    // Get students with risk levels
    const studentQuery = { isActive: true };
    if (req.user.role !== 'SUPER_ADMIN' && req.user.schoolId) {
      studentQuery.schoolId = req.user.schoolId;
    }

    const students = await Student.find(studentQuery)
      .populate('classId', 'className')
      .collation({ locale: 'en', strength: 2 })
      .sort({ lastName: 1, firstName: 1 })
      .select('firstName lastName studentId riskLevel classId guardianContacts');

    // Group students by risk level
    const studentsByRisk = {
      CRITICAL: students.filter(s => s.riskLevel === 'CRITICAL'),
      HIGH: students.filter(s => s.riskLevel === 'HIGH'),
      MEDIUM: students.filter(s => s.riskLevel === 'MEDIUM'),
      LOW: students.filter(s => s.riskLevel === 'LOW'),
      NONE: students.filter(s => !s.riskLevel || s.riskLevel === 'NONE')
    };

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=risk-report-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('EduGuard Risk Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(schoolName, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(16).text('Risk Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Total Students: ${students.length}`, { indent: 20 });
    doc.text(`Critical Risk: ${studentsByRisk.CRITICAL.length}`, { indent: 20 });
    doc.text(`High Risk: ${studentsByRisk.HIGH.length}`, { indent: 20 });
    doc.text(`Medium Risk: ${studentsByRisk.MEDIUM.length}`, { indent: 20 });
    doc.text(`Low Risk: ${studentsByRisk.LOW.length}`, { indent: 20 });
    doc.text(`No Risk: ${studentsByRisk.NONE.length}`, { indent: 20 });
    doc.text(`Total Risk Flags: ${riskFlags.length}`, { indent: 20 });
    doc.moveDown(2);

    // Risk Flags Section
    if (riskFlags.length > 0) {
      doc.fontSize(16).text('Risk Flags Details', { underline: true });
      doc.moveDown();

      riskFlags.forEach((flag, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(12).text(`${index + 1}. ${flag.title}`, { bold: true });
        doc.fontSize(10);
        doc.text(`Student: ${flag.studentId?.firstName || 'N/A'} ${flag.studentId?.lastName || ''}`, { indent: 20 });
        doc.text(`Type: ${flag.type}`, { indent: 20 });
        doc.text(`Severity: ${flag.severity}`, { indent: 20 });
        doc.text(`Status: ${flag.isActive ? 'Active' : 'Resolved'}`, { indent: 20 });
        doc.text(`Description: ${flag.description}`, { indent: 20 });
        doc.text(`Created: ${new Date(flag.createdAt).toLocaleDateString()}`, { indent: 20 });
        doc.moveDown();
      });
    }

    // Students by Risk Level Section
    doc.addPage();
    doc.fontSize(16).text('Students by Risk Level', { underline: true });
    doc.moveDown();

    // Critical Risk Students
    if (studentsByRisk.CRITICAL.length > 0) {
      doc.fontSize(14).text('CRITICAL RISK STUDENTS', { bold: true });
      doc.moveDown();
      doc.fontSize(10);
      studentsByRisk.CRITICAL.forEach((student, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        doc.text(`${index + 1}. ${student.firstName} ${student.lastName} (${student.studentId})`, { indent: 20 });
        doc.text(`   Class: ${student.classId?.className || 'N/A'}`, { indent: 20 });
        const guardian = student.guardianContacts?.[0];
        if (guardian) {
          doc.text(`   Guardian: ${guardian.name || 'N/A'} - ${guardian.phone || guardian.email || 'No contact'}`, { indent: 20 });
        }
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    // High Risk Students
    if (studentsByRisk.HIGH.length > 0) {
      doc.fontSize(14).text('HIGH RISK STUDENTS', { bold: true });
      doc.moveDown();
      doc.fontSize(10);
      studentsByRisk.HIGH.forEach((student, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        doc.text(`${index + 1}. ${student.firstName} ${student.lastName} (${student.studentId})`, { indent: 20 });
        doc.text(`   Class: ${student.classId?.className || 'N/A'}`, { indent: 20 });
        const guardian = student.guardianContacts?.[0];
        if (guardian) {
          doc.text(`   Guardian: ${guardian.name || 'N/A'} - ${guardian.phone || guardian.email || 'No contact'}`, { indent: 20 });
        }
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    // Medium Risk Students
    if (studentsByRisk.MEDIUM.length > 0) {
      doc.fontSize(14).text('MEDIUM RISK STUDENTS', { bold: true });
      doc.moveDown();
      doc.fontSize(10);
      studentsByRisk.MEDIUM.forEach((student, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        doc.text(`${index + 1}. ${student.firstName} ${student.lastName} (${student.studentId})`, { indent: 20 });
        doc.text(`   Class: ${student.classId?.className || 'N/A'}`, { indent: 20 });
        const guardian = student.guardianContacts?.[0];
        if (guardian) {
          doc.text(`   Guardian: ${guardian.name || 'N/A'} - ${guardian.phone || guardian.email || 'No contact'}`, { indent: 20 });
        }
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    // Footer
    doc.fontSize(8).text(
      `Report generated by ${req.user.name || req.user.email} on ${new Date().toLocaleString()}`,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    logger.error('Error generating PDF risk report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF risk report',
      error: error.message
    });
  }
});

// Create risk flag manually
router.post('/', auth, async (req, res) => {
  try {
    const flagData = {
      ...req.body,
      schoolId: req.user.schoolId,
      createdBy: req.user._id,
      autoGenerated: false
    };

    const flag = await RiskFlag.create(flagData);

    // Update student risk level
    await riskDetectionService.updateStudentRiskLevel(flag.studentId);

    res.status(201).json({
      success: true,
      message: 'Risk flag created successfully',
      data: flag
    });
  } catch (error) {
    logger.error('Error creating risk flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create risk flag',
      error: error.message
    });
  }
});

// Run risk detection for a student
router.post('/detect/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await riskDetectionService.detectRisksForStudent(
      studentId,
      req.user.schoolId,
      req.user._id
    );

    res.json({
      success: true,
      message: `Detected ${result.risksDetected} risks, created ${result.flagsCreated} flags`,
      data: result
    });
  } catch (error) {
    logger.error('Error detecting risks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect risks',
      error: error.message
    });
  }
});

// Run risk detection for entire school (admin only)
router.post('/detect-all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can run school-wide risk detection'
      });
    }

    // Run detection asynchronously
    riskDetectionService.detectRisksForSchool(req.user.schoolId, req.user._id)
      .then(result => {
        logger.info('School-wide risk detection completed', result);
      })
      .catch(error => {
        logger.error('School-wide risk detection failed:', error);
      });

    res.json({
      success: true,
      message: 'Risk detection started for all students. This may take a few minutes.'
    });
  } catch (error) {
    logger.error('Error starting risk detection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start risk detection',
      error: error.message
    });
  }
});

// Resolve risk flag
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const flag = await RiskFlag.findById(id);

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Risk flag not found'
      });
    }

    await flag.resolve(req.user._id, resolutionNotes);

    // Update student risk level
    await riskDetectionService.updateStudentRiskLevel(flag.studentId);

    res.json({
      success: true,
      message: 'Risk flag resolved successfully',
      data: flag
    });
  } catch (error) {
    logger.error('Error resolving risk flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve risk flag',
      error: error.message
    });
  }
});

// Update risk flag
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const flag = await RiskFlag.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Risk flag not found'
      });
    }

    // Update student risk level if severity changed
    if (updates.severity) {
      await riskDetectionService.updateStudentRiskLevel(flag.studentId);
    }

    res.json({
      success: true,
      message: 'Risk flag updated successfully',
      data: flag
    });
  } catch (error) {
    logger.error('Error updating risk flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update risk flag',
      error: error.message
    });
  }
});

// Delete risk flag (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete risk flags'
      });
    }

    const { id } = req.params;
    const flag = await RiskFlag.findByIdAndDelete(id);

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Risk flag not found'
      });
    }

    // Update student risk level
    await riskDetectionService.updateStudentRiskLevel(flag.studentId);

    res.json({
      success: true,
      message: 'Risk flag deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting risk flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete risk flag',
      error: error.message
    });
  }
});

module.exports = router;
