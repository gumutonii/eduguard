const express = require('express');
const router = express.Router();
const Performance = require('../models/Performance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { authenticateToken: auth } = require('../middleware/auth');
const riskDetectionService = require('../services/riskDetectionService');
const messageService = require('../services/messageService');
const logger = require('../utils/logger');
const csv = require('fast-csv');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get performance records with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, classId, subject, term, academicYear } = req.query;
    const query = { schoolId: req.user.schoolId };

    if (studentId) query.studentId = studentId;
    if (classId) query.classId = classId;
    if (subject) query.subject = subject;
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

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

    const performances = await Performance.find(query)
      .populate('studentId', 'firstName lastName fullName classroomId')
      .populate('enteredBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: performances.length,
      data: performances
    });
  } catch (error) {
    logger.error('Error fetching performance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance records',
      error: error.message
    });
  }
});

// Add performance record
router.post('/', auth, async (req, res) => {
  try {
    const { studentId, classId, academicYear, term, subject, score, maxScore, assessmentType } = req.body;

    // Check if performance record already exists for this student, term, and subject
    const existingPerformance = await Performance.findOne({
      studentId,
      academicYear,
      term,
      subject: subject || 'Overall',
      schoolId: req.user.schoolId
    });

    let performance;
    if (existingPerformance) {
      // Update existing record
      existingPerformance.score = score;
      existingPerformance.maxScore = maxScore || 100;
      existingPerformance.assessmentType = assessmentType || 'FINAL';
      existingPerformance.modifiedBy = req.user._id;
      existingPerformance.modifiedAt = new Date();
      await existingPerformance.save();
      performance = existingPerformance;
    } else {
      // Create new record
      const performanceData = {
        studentId,
        classId,
        schoolId: req.user.schoolId,
        academicYear,
        term,
        subject: subject || 'Overall',
        score,
        maxScore: maxScore || 100,
        assessmentType: assessmentType || 'FINAL',
        enteredBy: req.user._id
      };

      performance = await Performance.create(performanceData);
    }

    // Return success immediately
    res.status(201).json({
      success: true,
      message: 'Performance record created successfully',
      data: performance
    });

    // Process risk detection and alerts asynchronously (non-blocking)
    if (performance.grade === 'F' || performance.grade === 'E') {
      setImmediate(async () => {
        try {
          // Run risk detection (non-blocking)
          riskDetectionService.detectRisksForStudent(
            performance.studentId,
            req.user.schoolId,
            req.user._id
          ).catch(err => {
            logger.error(`Risk detection failed for student ${performance.studentId}:`, err);
          });

          // Send performance alert (non-blocking)
          messageService.sendPerformanceAlert(
            performance.studentId,
            performance.subject,
            performance.score,
            req.user._id
          ).catch(msgError => {
            logger.error('Failed to send performance alert:', msgError);
          });
        } catch (error) {
          logger.error(`Error processing performance alert for student ${performance.studentId}:`, error);
        }
      });
    }
  } catch (error) {
    logger.error('Error creating performance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create performance record',
      error: error.message
    });
  }
});

// Bulk import performance records from CSV
router.post('/import', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const records = [];
    const errors = [];

    // Parse CSV
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv.parse({ headers: true }))
      .on('error', error => {
        logger.error('CSV parse error:', error);
      })
      .on('data', row => {
        records.push(row);
      })
      .on('end', async () => {
        const imported = [];
        
        for (const [index, record] of records.entries()) {
          try {
            // Find student by ID or name
            let student;
            if (record.studentId) {
              student = await Student.findById(record.studentId);
            } else if (record.studentName) {
              const names = record.studentName.split(' ');
              student = await Student.findOne({
                firstName: names[0],
                lastName: names[names.length - 1],
                schoolId: req.user.schoolId
              });
            }

            if (!student) {
              errors.push({
                row: index + 2,
                error: 'Student not found',
                data: record
              });
              continue;
            }

            // Create performance record
            const performance = await Performance.create({
              studentId: student._id,
              schoolId: req.user.schoolId,
              classId: student.classroomId,
              academicYear: record.academicYear,
              term: record.term,
              subject: record.subject,
              score: parseFloat(record.score),
              maxScore: record.maxScore ? parseFloat(record.maxScore) : 100,
              assessmentType: record.assessmentType || 'EXAM',
              remarks: record.remarks,
              enteredBy: req.user._id
            });

            imported.push(performance);

            // Trigger risk detection for failing grades
            if (performance.grade === 'F' || performance.grade === 'E') {
              await riskDetectionService.detectRisksForStudent(
                student._id,
                req.user.schoolId,
                req.user._id
              );
            }
          } catch (error) {
            errors.push({
              row: index + 2,
              error: error.message,
              data: record
            });
          }
        }

        res.json({
          success: true,
          message: `Imported ${imported.length} performance records`,
          imported: imported.length,
          errors: errors.length > 0 ? errors : undefined
        });
      });
  } catch (error) {
    logger.error('Error importing performance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import performance records',
      error: error.message
    });
  }
});

// Get performance summary for a student
router.get('/summary/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    if (!academicYear || !term) {
      return res.status(400).json({
        success: false,
        message: 'academicYear and term are required'
      });
    }

    const summary = await Performance.getStudentSummary(studentId, academicYear, term);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching performance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance summary',
      error: error.message
    });
  }
});

// Get class average
router.get('/class-average', auth, async (req, res) => {
  try {
    const { classId, subject, term, academicYear } = req.query;

    if (!classId || !subject || !term || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'classId, subject, term, and academicYear are required'
      });
    }

    const average = await Performance.getClassAverage(classId, subject, term, academicYear);

    res.json({
      success: true,
      data: average
    });
  } catch (error) {
    logger.error('Error fetching class average:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class average',
      error: error.message
    });
  }
});

// Detect performance drops
router.get('/drops/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'academicYear is required'
      });
    }

    const performances = await Performance.find({
      studentId,
      academicYear
    }).sort({ term: 1 });

    const subjects = [...new Set(performances.map(p => p.subject))];
    const drops = [];

    for (const subject of subjects) {
      const subjectPerfs = performances.filter(p => p.subject === subject);
      
      for (let i = 1; i < subjectPerfs.length; i++) {
        const drop = await Performance.detectPerformanceDrop(
          studentId,
          subject,
          subjectPerfs[i].term,
          subjectPerfs[i - 1].term,
          academicYear
        );
        
        if (drop && drop.drop > 0) {
          drops.push(drop);
        }
      }
    }

    res.json({
      success: true,
      data: drops
    });
  } catch (error) {
    logger.error('Error detecting performance drops:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect performance drops',
      error: error.message
    });
  }
});

// Update performance record
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      modifiedBy: req.user._id,
      modifiedAt: new Date()
    };

    const performance = await Performance.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Performance record updated successfully',
      data: performance
    });
  } catch (error) {
    logger.error('Error updating performance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update performance record',
      error: error.message
    });
  }
});

// Delete performance record (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete performance records'
      });
    }

    const { id } = req.params;
    const performance = await Performance.findByIdAndDelete(id);

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Performance record deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting performance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete performance record',
      error: error.message
    });
  }
});

module.exports = router;
