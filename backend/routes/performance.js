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

// Helper function to calculate grade from score (matches pre-save hook logic)
function calculateGrade(score, maxScore = 100) {
  // Validate inputs
  if (typeof score !== 'number' || isNaN(score)) {
    throw new Error('Invalid score: must be a number');
  }
  if (typeof maxScore !== 'number' || isNaN(maxScore) || maxScore <= 0) {
    throw new Error('Invalid maxScore: must be a positive number');
  }
  
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  if (percentage >= 50) return 'E';
  return 'F';
}

// Get performance records with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, classId, subject, term, academicYear } = req.query;
    // SUPER_ADMIN can see all data, others are filtered by school
    const query = {};
    
    // Filter by school for non-SUPER_ADMIN users
    if (req.user.role !== 'SUPER_ADMIN' && req.user.schoolId) {
      query.schoolId = req.user.schoolId;
    }

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
// IMPORTANT: This is the ONLY legitimate route for creating performance records.
// All performance must be created through authenticated teachers/admins entering
// performance data from real student assessments. No sample/test data should be
// created through this or any other route.
router.post('/', auth, async (req, res) => {
  try {
    const { studentId, classId, academicYear, term, subject, score, maxScore, assessmentType } = req.body;

    // Validate required fields
    if (!studentId || score === undefined || score === null) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and score are required'
      });
    }

    // Validate score range
    const scoreNum = Number(score);
    const maxScoreNum = Number(maxScore || 100);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScoreNum) {
      return res.status(400).json({
        success: false,
        message: `Score must be between 0 and ${maxScoreNum}`
      });
    }
    if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Max score must be a positive number'
      });
    }

    // Validate student exists and belongs to school
    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId,
      isActive: true
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or not active'
      });
    }

    // Validate term
    if (term && !['TERM_1', 'TERM_2', 'TERM_3'].includes(term)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid term. Must be TERM_1, TERM_2, or TERM_3'
      });
    }

    // Check if performance record already exists for this student, term, and subject
    const academicYearValue = academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const termValue = term || 'TERM_1';
    const subjectValue = subject || 'Overall';
    
    const existingPerformance = await Performance.findOne({
      studentId,
      academicYear: academicYearValue,
      term: termValue,
      subject: subjectValue,
      schoolId: req.user.schoolId
    });

    let performance;
    if (existingPerformance) {
      // Update existing record
      existingPerformance.score = scoreNum;
      existingPerformance.maxScore = maxScoreNum;
      existingPerformance.assessmentType = assessmentType || 'FINAL';
      existingPerformance.modifiedBy = req.user._id;
      existingPerformance.modifiedAt = new Date();
      await existingPerformance.save();
      performance = existingPerformance;
    } else {
      // Create new record - ensure classId is always set
      if (!classId && !student.classId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID is required. Student must be assigned to a class.'
        });
      }
      
      const performanceData = {
        studentId,
        classId: classId || student.classId,
        schoolId: req.user.schoolId,
        academicYear: academicYearValue,
        term: termValue,
        subject: subjectValue,
        score: scoreNum,
        maxScore: maxScoreNum,
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

// Bulk create/update performance records
router.post('/bulk', auth, async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Records array is required and must not be empty'
      });
    }

    const createdRecords = [];
    const updatedRecords = [];
    const errors = [];

    // Prepare all records for bulk operations
    const recordsToCreate = [];
    const recordsToUpdate = [];
    const existingMap = new Map(); // Map to track existing records

    // First, batch fetch all existing performance records
    const studentIds = [...new Set(records.map(r => r.studentId))];
    const academicYears = [...new Set(records.map(r => r.academicYear || new Date().getFullYear().toString()))];
    const terms = [...new Set(records.map(r => r.term || 'TERM_1'))];
    const subjects = [...new Set(records.map(r => r.subject || 'Overall'))];

    const existingRecords = await Performance.find({
      studentId: { $in: studentIds },
      schoolId: req.user.schoolId,
      academicYear: { $in: academicYears },
      term: { $in: terms },
      subject: { $in: subjects }
    }).lean();

    // Create a map for quick lookup
    existingRecords.forEach(record => {
      const key = `${record.studentId}_${record.academicYear}_${record.term}_${record.subject}`;
      existingMap.set(key, record);
    });

    // Validate and process all records
    for (const record of records) {
      try {
        // Validate required fields
        if (!record.studentId || record.score === undefined || record.score === null) {
          errors.push({
            studentId: record.studentId || 'unknown',
            error: 'Missing required fields: studentId or score'
          });
          continue;
        }

        // Validate student exists and belongs to school
        const student = await Student.findOne({
          _id: record.studentId,
          schoolId: req.user.schoolId,
          isActive: true
        });
        if (!student) {
          errors.push({
            studentId: record.studentId,
            error: 'Student not found or not active'
          });
          continue;
        }

        // Validate score range
        const scoreNum = Number(record.score);
        const maxScoreNum = Number(record.maxScore || 100);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScoreNum) {
          errors.push({
            studentId: record.studentId,
            error: `Score must be between 0 and ${maxScoreNum}`
          });
          continue;
        }
        if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
          errors.push({
            studentId: record.studentId,
            error: 'Max score must be a positive number'
          });
          continue;
        }

        // Validate term
        const term = record.term || 'TERM_1';
        if (!['TERM_1', 'TERM_2', 'TERM_3'].includes(term)) {
          errors.push({
            studentId: record.studentId,
            error: 'Invalid term. Must be TERM_1, TERM_2, or TERM_3'
          });
          continue;
        }

        // Ensure classId is set
        if (!record.classId && !student.classId) {
          errors.push({
            studentId: record.studentId,
            error: 'Class ID is required. Student must be assigned to a class.'
          });
          continue;
        }
        
        const academicYear = record.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const subject = record.subject || 'Overall';
        const key = `${record.studentId}_${academicYear}_${term}_${subject}`;
        const existing = existingMap.get(key);

        // Calculate grade (needed for both updates and creates since bulk operations don't trigger hooks)
        let grade;
        try {
          grade = calculateGrade(scoreNum, maxScoreNum);
        } catch (gradeError) {
          errors.push({
            studentId: record.studentId,
            error: `Grade calculation failed: ${gradeError.message}`
          });
          continue;
        }
        
        if (existing) {
          // Update existing record
          recordsToUpdate.push({
            updateOne: {
              filter: { _id: existing._id },
              update: {
                $set: {
                  score: scoreNum,
                  maxScore: maxScoreNum,
                  grade: grade,
                  assessmentType: record.assessmentType || 'FINAL',
                  remarks: record.remarks,
                  modifiedBy: req.user._id,
                  modifiedAt: new Date()
                }
              }
            }
          });
          updatedRecords.push({ ...existing, score: scoreNum, grade });
        } else {
          // Create new record - ensure classId is always set
          recordsToCreate.push({
            studentId: record.studentId,
            classId: record.classId || student.classId,
            schoolId: req.user.schoolId,
            academicYear,
            term,
            subject,
            score: scoreNum,
            maxScore: maxScoreNum,
            grade: grade, // Include calculated grade (required field)
            assessmentType: record.assessmentType || 'FINAL',
            remarks: record.remarks,
            enteredBy: req.user._id
          });
        }
      } catch (error) {
        logger.error(`Error preparing performance for student ${record.studentId}:`, error);
        errors.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    // Bulk operations for faster saving with error handling
    try {
      if (recordsToUpdate.length > 0) {
        const updateResult = await Performance.bulkWrite(recordsToUpdate, { ordered: false });
        logger.info(`Updated ${updateResult.modifiedCount} performance records`);
      }
      if (recordsToCreate.length > 0) {
        try {
          const newRecords = await Performance.insertMany(recordsToCreate, { ordered: false });
          createdRecords.push(...newRecords);
          logger.info(`Created ${newRecords.length} new performance records`);
        } catch (insertError) {
          // Handle validation errors from insertMany
          if (insertError.name === 'ValidationError' || insertError.code === 11000 || insertError.writeErrors) {
            logger.warn('Some performance records failed validation, attempting individual saves');
            
            // Get indices of successfully inserted records
            const successfulInserts = insertError.insertedIds || {};
            const successfulIndices = new Set(Object.keys(successfulInserts).map(Number));
            
            // Get indices of failed records from writeErrors
            const failedIndices = new Set();
            if (insertError.writeErrors && insertError.writeErrors.length > 0) {
              insertError.writeErrors.forEach(writeError => {
                if (writeError.index !== undefined) {
                  failedIndices.add(writeError.index);
                }
              });
            }
            
            // If no writeErrors, assume all records that weren't successfully inserted failed
            if (failedIndices.size === 0) {
              recordsToCreate.forEach((record, idx) => {
                if (!successfulIndices.has(idx)) {
                  failedIndices.add(idx);
                }
              });
            }
            
            // Try to save failed records individually to get specific error messages
            for (const failedIndex of failedIndices) {
              const record = recordsToCreate[failedIndex];
              if (!record) continue;
              
              try {
                // Ensure grade is calculated (should already be there, but double-check)
                if (!record.grade) {
                  record.grade = calculateGrade(record.score, record.maxScore);
                }
                const newRecord = await Performance.create(record);
                createdRecords.push(newRecord);
                logger.info(`Successfully saved individual record for student ${record.studentId}`);
              } catch (individualError) {
                // Extract studentId if possible for error reporting
                const studentId = record.studentId || 'unknown';
                const errorMessage = individualError.message || 'Failed to save performance record';
                errors.push({
                  studentId: studentId,
                  error: errorMessage
                });
                logger.error(`Failed to save individual record for student ${studentId}:`, errorMessage);
              }
            }
            
            // Also extract errors from writeErrors for better error messages
            if (insertError.writeErrors && insertError.writeErrors.length > 0) {
              insertError.writeErrors.forEach(writeError => {
                const failedRecord = recordsToCreate[writeError.index];
                if (failedRecord) {
                  // Only add if not already in errors array
                  const studentId = failedRecord.studentId || 'unknown';
                  const errorMsg = writeError.errmsg || writeError.err?.message || 'Validation failed';
                  if (!errors.some(e => e.studentId === studentId && e.error === errorMsg)) {
                    errors.push({
                      studentId: studentId,
                      error: errorMsg
                    });
                  }
                }
              });
            }
          } else {
            throw insertError;
          }
        }
      }
    } catch (error) {
      logger.error('Error in bulk performance operations:', error);
      // If it's a bulk write error, extract individual errors
      if (error.writeErrors && error.writeErrors.length > 0) {
        error.writeErrors.forEach(writeError => {
          errors.push({
            studentId: 'unknown',
            error: writeError.errmsg || writeError.err.message
          });
        });
      }
      // Don't throw - return partial success if some records were saved
      if (createdRecords.length === 0 && updatedRecords.length === 0) {
        throw error;
      }
    }

    // Return success immediately after saving records
    res.status(errors.length > 0 ? 207 : 201).json({
      success: true,
      message: `Saved ${createdRecords.length + updatedRecords.length} performance records`,
      data: {
        created: createdRecords,
        updated: updatedRecords
      },
      errors: errors.length > 0 ? errors : undefined
    });

    // Process risk detection and alerts asynchronously (non-blocking)
    const failingRecords = [...createdRecords, ...updatedRecords].filter(p => 
      p.grade === 'F' || p.grade === 'E'
    );

    if (failingRecords.length > 0) {
      setTimeout(async () => {
        for (const perf of failingRecords) {
          try {
            // Run risk detection (non-blocking)
            riskDetectionService.detectRisksForStudent(
              perf.studentId,
              req.user.schoolId,
              req.user._id
            ).catch(err => {
              logger.error(`Risk detection failed for student ${perf.studentId}:`, err);
            });

            // Send performance alert (non-blocking)
            messageService.sendPerformanceAlert(
              perf.studentId,
              perf.subject,
              perf.score,
              req.user._id
            ).catch(msgError => {
              logger.error('Failed to send performance alert:', msgError);
            });
          } catch (error) {
            logger.error(`Error processing performance alert for student ${perf.studentId}:`, error);
          }
        }
      }, 100);
    }
  } catch (error) {
    logger.error('Error bulk saving performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save performance records',
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

            // Create performance record - ensure classId is set
            if (!student.classId && !student.classroomId) {
              errors.push({
                row: index + 2,
                error: 'Student must be assigned to a class',
                data: record
              });
              continue;
            }
            
            // Validate score
            const scoreNum = parseFloat(record.score);
            const maxScoreNum = record.maxScore ? parseFloat(record.maxScore) : 100;
            
            if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScoreNum) {
              errors.push({
                row: index + 2,
                error: `Score must be between 0 and ${maxScoreNum}`,
                data: record
              });
              continue;
            }
            
            if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
              errors.push({
                row: index + 2,
                error: 'Max score must be a positive number',
                data: record
              });
              continue;
            }
            
            // Validate term
            const term = record.term || 'TERM_1';
            if (!['TERM_1', 'TERM_2', 'TERM_3'].includes(term)) {
              errors.push({
                row: index + 2,
                error: 'Invalid term. Must be TERM_1, TERM_2, or TERM_3',
                data: record
              });
              continue;
            }
            
            const performance = await Performance.create({
              studentId: student._id,
              schoolId: req.user.schoolId,
              classId: student.classId || student.classroomId,
              academicYear: record.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
              term: term,
              subject: record.subject || 'Overall',
              score: scoreNum,
              maxScore: maxScoreNum,
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
