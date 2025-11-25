const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const RiskFlag = require('../models/RiskFlag');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

class RiskDetectionService {
  /**
   * Detect socio-economic and family-based risks (triggered after student registration)
   */
  async detectSocioeconomicRisks(studentId, schoolId, userId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const settings = await Settings.getOrCreateForSchool(schoolId);
      const risks = [];

      // Check socioeconomic risks
      if (settings.riskRules.socioeconomic.enabled) {
        const socioeconomicRisk = await this.checkSocioeconomicRisk(student, settings.riskRules.socioeconomic);
        if (socioeconomicRisk) {
          risks.push(socioeconomicRisk);
        }
      }

      // Check distance to school risks
      const distanceRisk = await this.checkDistanceRisk(student);
      if (distanceRisk) {
        risks.push(distanceRisk);
      }

      // Create risk flags for new risks
      return await this.createRiskFlags(studentId, schoolId, userId, risks);
    } catch (error) {
      logger.error(`Socioeconomic risk detection failed for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Detect weekly attendance risks (triggered after weekly attendance is saved)
   */
  async detectWeeklyAttendanceRisks(studentId, schoolId, userId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const settings = await Settings.getOrCreateForSchool(schoolId);
      const risks = [];

      // Check weekly attendance risks (current week, 5 days)
      if (settings.riskRules.attendance.enabled) {
        const attendanceRisk = await this.checkWeeklyAttendanceRisk(studentId, settings.riskRules.attendance);
        if (attendanceRisk) {
          risks.push(attendanceRisk);
        }
      }

      // Create risk flags for new risks
      return await this.createRiskFlags(studentId, schoolId, userId, risks);
    } catch (error) {
      logger.error(`Weekly attendance risk detection failed for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Detect term-based performance risks (triggered after term performance is saved)
   */
  async detectTermPerformanceRisks(studentId, schoolId, userId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const settings = await Settings.getOrCreateForSchool(schoolId);
      const risks = [];

      // Check term-based performance risks (current term)
      if (settings.riskRules.performance.enabled) {
        const performanceRisk = await this.checkTermPerformanceRisk(studentId, settings.riskRules.performance);
        if (performanceRisk) {
          risks.push(performanceRisk);
        }
      }

      // Create risk flags for new risks
      return await this.createRiskFlags(studentId, schoolId, userId, risks);
    } catch (error) {
      logger.error(`Term performance risk detection failed for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to create risk flags from detected risks
   * Smart logic: Only one active flag per type per student
   * - If flag exists, update it with latest/most severe information
   * - If flag doesn't exist, create new one
   */
  async createRiskFlags(studentId, schoolId, userId, risks) {
    const createdFlags = [];
    const updatedFlags = [];
    
    // Group risks by type to handle multiple risks of the same type
    const risksByType = {};
    for (const risk of risks) {
      if (!risksByType[risk.type]) {
        risksByType[risk.type] = [];
      }
      risksByType[risk.type].push(risk);
    }

    // Process each risk type (ensuring only one flag per type per student)
    for (const [riskType, typeRisks] of Object.entries(risksByType)) {
      // Find existing active flag of this type for this student
      const existingFlag = await RiskFlag.findOne({
        studentId,
        type: riskType,
        isActive: true,
        isResolved: false
      });

      // Determine the most severe risk for this type
      const severityOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
      const mostSevereRisk = typeRisks.reduce((prev, current) => {
        return severityOrder[current.severity] > severityOrder[prev.severity] ? current : prev;
      });

      if (existingFlag) {
        // Update existing flag with latest/most severe information
        const severityChanged = existingFlag.severity !== mostSevereRisk.severity;
        const wasLowerSeverity = severityOrder[existingFlag.severity] < severityOrder[mostSevereRisk.severity];

        // Update the flag with new information
        existingFlag.title = mostSevereRisk.title;
        existingFlag.description = mostSevereRisk.description;
        existingFlag.severity = mostSevereRisk.severity;
        existingFlag.data = mostSevereRisk.data;
        existingFlag.updatedAt = new Date();
        
        await existingFlag.save();
        updatedFlags.push(existingFlag);

        // Deactivate any other active flags of the same type (shouldn't happen, but safety check)
        await RiskFlag.updateMany(
          {
            studentId,
            type: riskType,
            isActive: true,
            isResolved: false,
            _id: { $ne: existingFlag._id }
          },
          {
            isActive: false,
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy: userId,
            resolutionNotes: 'Auto-resolved: Replaced by updated risk flag of the same type'
          }
        );

        // Notify if severity increased to HIGH or CRITICAL
        if (wasLowerSeverity && ['HIGH', 'CRITICAL'].includes(mostSevereRisk.severity)) {
          const { notifyAdminOfStudentRisk } = require('../utils/adminNotificationService');
          await notifyAdminOfStudentRisk(
            studentId,
            mostSevereRisk.severity,
            `Risk flag severity increased: ${mostSevereRisk.title}. ${mostSevereRisk.description}`,
            riskType
          );

          // Notify parents if severity increased to HIGH or CRITICAL
          const { notifyParentsOfRisk } = require('../utils/notificationService');
          const riskDescription = `${mostSevereRisk.title}. ${mostSevereRisk.description}`;
          notifyParentsOfRisk(studentId, mostSevereRisk.severity, riskDescription).catch(err => {
            logger.error('Error notifying parents of risk flag update:', err);
          });
        }
      } else {
        // Safety check: Deactivate any other active flags of the same type (shouldn't happen, but handles race conditions)
        await RiskFlag.updateMany(
          {
            studentId,
            type: riskType,
            isActive: true,
            isResolved: false
          },
          {
            isActive: false,
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy: userId,
            resolutionNotes: 'Auto-resolved: Replaced by new risk flag of the same type'
          }
        );

        // Create new flag for this type
        const flag = await RiskFlag.create({
          studentId,
          schoolId,
          ...mostSevereRisk,
          createdBy: userId,
          autoGenerated: true
        });
        createdFlags.push(flag);

        // Notify admins immediately for HIGH and CRITICAL risk flags
        if (['HIGH', 'CRITICAL'].includes(mostSevereRisk.severity)) {
          const { notifyAdminOfStudentRisk } = require('../utils/adminNotificationService');
          await notifyAdminOfStudentRisk(
            studentId,
            mostSevereRisk.severity,
            `New ${mostSevereRisk.severity} risk flag detected: ${mostSevereRisk.title}. ${mostSevereRisk.description}`,
            riskType
          );

          // Automatically notify parents/guardians for HIGH and CRITICAL risk flags
          const { notifyParentsOfRisk } = require('../utils/notificationService');
          const riskDescription = `${mostSevereRisk.title}. ${mostSevereRisk.description}`;
          notifyParentsOfRisk(studentId, mostSevereRisk.severity, riskDescription).catch(err => {
            logger.error('Error notifying parents of new risk flag:', err);
          });
        }
      }
    }

    // Update student risk level if flags were created or updated
    if (createdFlags.length > 0 || updatedFlags.length > 0) {
      await this.updateStudentRiskLevel(studentId);
    }

    return {
      risksDetected: risks.length,
      flagsCreated: createdFlags.length,
      flagsUpdated: updatedFlags.length,
      flags: [...createdFlags, ...updatedFlags]
    };
  }

  /**
   * Run risk detection for a specific student (legacy method - kept for backward compatibility)
   */
  async detectRisksForStudent(studentId, schoolId, userId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const settings = await Settings.getOrCreateForSchool(schoolId);
      const risks = [];

      // Check attendance risks
      if (settings.riskRules.attendance.enabled) {
        const attendanceRisk = await this.checkAttendanceRisk(studentId, settings.riskRules.attendance);
        if (attendanceRisk) {
          risks.push(attendanceRisk);
        }
      }

      // Check performance risks
      if (settings.riskRules.performance.enabled) {
        const performanceRisk = await this.checkPerformanceRisk(studentId, settings.riskRules.performance);
        if (performanceRisk) {
          risks.push(performanceRisk);
        }
      }

      // Check socioeconomic risks
      if (settings.riskRules.socioeconomic.enabled) {
        const socioeconomicRisk = await this.checkSocioeconomicRisk(student, settings.riskRules.socioeconomic);
        if (socioeconomicRisk) {
          risks.push(socioeconomicRisk);
        }
      }

      // Check distance to school risks
      const distanceRisk = await this.checkDistanceRisk(student);
      if (distanceRisk) {
        risks.push(distanceRisk);
      }

      // Check combined risks
      if (settings.riskRules.combined.enabled && risks.length >= 2) {
        const combinedRisk = await this.checkCombinedRisk(risks, settings.riskRules.combined);
        if (combinedRisk) {
          risks.push(combinedRisk);
        }
      }

      // Create risk flags for new risks
      return await this.createRiskFlags(studentId, schoolId, userId, risks);
    } catch (error) {
      logger.error(`Risk detection failed for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Check attendance-based risks for current week (5 days)
   * Weekly attendance risk detection: flags students with poor attendance in the current week
   */
  async checkWeeklyAttendanceRisk(studentId, rules) {
    // Get current week (Monday to Friday - 5 days)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4); // Friday (5 days total)
    friday.setHours(23, 59, 59, 999);

    // Get attendance records for current week (5 days)
    const weekAttendance = await Attendance.find({
      studentId,
      date: { $gte: monday, $lte: friday }
    }).sort({ date: -1 });

    // Count absences in current week
    const absences = weekAttendance.filter(a => a.status === 'ABSENT').length;
    const totalDays = weekAttendance.length;
    
    // Expected: 5 days in a week
    const expectedDays = 5;
    
    // Risk thresholds for weekly attendance (5 days):
    // CRITICAL: 4-5 absences (80-100% absence rate)
    // HIGH: 3 absences (60% absence rate)
    // MEDIUM: 2 absences (40% absence rate)
    
    if (absences >= 4) {
      const absenceRate = totalDays > 0 ? ((absences / totalDays) * 100).toFixed(1) : ((absences / expectedDays) * 100).toFixed(1);
      return {
        type: 'ATTENDANCE',
        severity: 'CRITICAL',
        title: `Critical Weekly Absenteeism: ${absences} absences out of ${totalDays || expectedDays} days this week`,
        description: `Student has been absent ${absences} out of ${totalDays || expectedDays} school days this week (${absenceRate}% absence rate). This is a critical attendance issue requiring immediate attention.`,
        data: {
          attendanceData: {
            absences: absences,
            totalSchoolDays: totalDays || expectedDays,
            absenceRate: absenceRate,
            period: 'Current week (5 days)',
            weekStart: monday,
            weekEnd: friday,
            dates: weekAttendance.filter(a => a.status === 'ABSENT').map(a => a.date)
          }
        }
      };
    } else if (absences >= 3) {
      const absenceRate = totalDays > 0 ? ((absences / totalDays) * 100).toFixed(1) : ((absences / expectedDays) * 100).toFixed(1);
      return {
        type: 'ATTENDANCE',
        severity: 'HIGH',
        title: `High Weekly Absenteeism: ${absences} absences out of ${totalDays || expectedDays} days this week`,
        description: `Student has been absent ${absences} out of ${totalDays || expectedDays} school days this week (${absenceRate}% absence rate). This indicates high dropout risk.`,
        data: {
          attendanceData: {
            absences: absences,
            totalSchoolDays: totalDays || expectedDays,
            absenceRate: absenceRate,
            period: 'Current week (5 days)',
            weekStart: monday,
            weekEnd: friday,
            dates: weekAttendance.filter(a => a.status === 'ABSENT').map(a => a.date)
          }
        }
      };
    } else if (absences >= 2) {
      const absenceRate = totalDays > 0 ? ((absences / totalDays) * 100).toFixed(1) : ((absences / expectedDays) * 100).toFixed(1);
      return {
        type: 'ATTENDANCE',
        severity: 'MEDIUM',
        title: `Moderate Weekly Absenteeism: ${absences} absences out of ${totalDays || expectedDays} days this week`,
        description: `Student has been absent ${absences} out of ${totalDays || expectedDays} school days this week (${absenceRate}% absence rate). Monitor attendance patterns closely.`,
        data: {
          attendanceData: {
            absences: absences,
            totalSchoolDays: totalDays || expectedDays,
            absenceRate: absenceRate,
            period: 'Current week (5 days)',
            weekStart: monday,
            weekEnd: friday,
            dates: weekAttendance.filter(a => a.status === 'ABSENT').map(a => a.date)
          }
        }
      };
    }

    return null;
  }

  /**
   * Check attendance-based risks (legacy method - kept for backward compatibility)
   * Refined: Only flag as CRITICAL/HIGH if absent 10+ days out of 20 school days (2 weeks out of 4 weeks)
   * This is 50% absence rate over a month (assuming 5 days per week)
   */
  async checkAttendanceRisk(studentId, rules) {
    // Calculate monthly attendance: 4 weeks * 5 days = 20 school days
    // Check last 28-30 days to capture a full month of school days
    const daysToCheck = 30; // Check last 30 calendar days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToCheck);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Get all attendance records in the period
    const allAttendance = await Attendance.find({
      studentId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    // Filter to only count school days (exclude weekends if needed, but for now count all records)
    // Count only ABSENT status (not EXCUSED, as EXCUSED might be legitimate)
    const absences = allAttendance.filter(a => a.status === 'ABSENT').length;
    const totalSchoolDays = allAttendance.length;
    
    // Calculate expected school days: approximately 20 days in a month (4 weeks * 5 days)
    // Use actual records if available, otherwise estimate
    const expectedSchoolDays = totalSchoolDays > 0 ? totalSchoolDays : 20;
    
    // Critical/High threshold: 10 absences out of 20 school days (50% absence rate)
    const criticalThreshold = 10;
    const highThreshold = 10; // Same threshold for both HIGH and CRITICAL
    
    // Medium threshold: 6-9 absences (30-45% absence rate)
    const mediumThreshold = 6;

    if (absences >= criticalThreshold) {
      const absenceRate = totalSchoolDays > 0 ? ((absences / totalSchoolDays) * 100).toFixed(1) : 'N/A';
      return {
        type: 'ATTENDANCE',
        severity: absences >= 12 ? 'CRITICAL' : 'HIGH', // 12+ absences = CRITICAL, 10-11 = HIGH
        title: `${absences >= 12 ? 'Critical' : 'High'} Absenteeism: ${absences} absences in ${totalSchoolDays} school days`,
        description: `Student has been absent ${absences} times out of ${totalSchoolDays} school days (${absenceRate}% absence rate) in the last month. This indicates ${absences >= 12 ? 'critical' : 'high'} dropout risk requiring immediate attention.`,
        data: {
          attendanceData: {
            absences: absences,
            totalSchoolDays: totalSchoolDays,
            absenceRate: absenceRate,
            period: 'Last 30 days (monthly)',
            dates: allAttendance.filter(a => a.status === 'ABSENT').map(a => a.date)
          }
        }
      };
    } else if (absences >= mediumThreshold) {
      const absenceRate = totalSchoolDays > 0 ? ((absences / totalSchoolDays) * 100).toFixed(1) : 'N/A';
      return {
        type: 'ATTENDANCE',
        severity: 'MEDIUM',
        title: `Moderate Absenteeism: ${absences} absences in ${totalSchoolDays} school days`,
        description: `Student has been absent ${absences} times out of ${totalSchoolDays} school days (${absenceRate}% absence rate) in the last month. Monitor attendance patterns closely.`,
        data: {
          attendanceData: {
            absences: absences,
            totalSchoolDays: totalSchoolDays,
            absenceRate: absenceRate,
            period: 'Last 30 days (monthly)',
            dates: allAttendance.filter(a => a.status === 'ABSENT').map(a => a.date)
          }
        }
      };
    }

    return null;
  }

  /**
   * Check performance-based risks for current term
   * Term-based performance risk detection: flags students with poor performance in the current term
   */
  async checkTermPerformanceRisk(studentId, rules) {
    // Get current academic year and term
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    // Determine current term based on date (Rwanda: 3 terms per year)
    // Term 1: Jan-Apr, Term 2: May-Aug, Term 3: Sep-Dec
    const currentMonth = new Date().getMonth() + 1; // 1-12
    let currentTerm = 'TERM_1';
    if (currentMonth >= 5 && currentMonth <= 8) {
      currentTerm = 'TERM_2';
    } else if (currentMonth >= 9 || currentMonth <= 4) {
      currentTerm = currentMonth >= 9 ? 'TERM_3' : 'TERM_1';
    }

    // Get performance records for current term (Overall subject only)
    const termPerformances = await Performance.find({
      studentId,
      academicYear,
      term: currentTerm,
      subject: 'Overall'
    }).sort({ createdAt: -1 });

    if (termPerformances.length === 0) {
      return null;
    }

    // Get the most recent overall performance for current term
    const latestPerformance = termPerformances[0];
    const score = latestPerformance.score || 0;
    const maxScore = latestPerformance.maxScore || 100;
    const percentage = (score / maxScore) * 100;
    const percentageRounded = parseFloat(percentage.toFixed(1));

    // Risk thresholds based on grade scale:
    // F: 0-39.9% (CRITICAL: 0-29.9%, HIGH: 30-39.9%)
    // E: 40-49.9% (MEDIUM)
    // D: 50-59.9% (LOW/MEDIUM)
    
    if (percentageRounded <= 29.9) {
      return {
        type: 'PERFORMANCE',
        severity: 'CRITICAL',
        title: `Critical Term Performance: ${percentageRounded}% (F grade) in ${currentTerm.replace('_', ' ')}`,
        description: `Student's overall performance in ${currentTerm.replace('_', ' ')} is ${percentageRounded}% (F grade), which is critically below the passing threshold. This indicates critical academic risk requiring immediate intervention.`,
        data: {
          performanceData: {
            term: currentTerm,
            academicYear: academicYear,
            overallScore: percentageRounded,
            score: score,
            maxScore: maxScore,
            grade: 'F',
            threshold: 40
          }
        }
      };
    } else if (percentageRounded <= 39.9) {
      return {
        type: 'PERFORMANCE',
        severity: 'HIGH',
        title: `High Term Performance Risk: ${percentageRounded}% (F grade) in ${currentTerm.replace('_', ' ')}`,
        description: `Student's overall performance in ${currentTerm.replace('_', ' ')} is ${percentageRounded}% (F grade), which is significantly below the passing threshold. This indicates high academic risk requiring immediate attention.`,
        data: {
          performanceData: {
            term: currentTerm,
            academicYear: academicYear,
            overallScore: percentageRounded,
            score: score,
            maxScore: maxScore,
            grade: 'F',
            threshold: 40
          }
        }
      };
    } else if (percentageRounded <= 49.9) {
      return {
        type: 'PERFORMANCE',
        severity: 'MEDIUM',
        title: `Moderate Term Performance Risk: ${percentageRounded}% (E grade) in ${currentTerm.replace('_', ' ')}`,
        description: `Student's overall performance in ${currentTerm.replace('_', ' ')} is ${percentageRounded}% (E grade), which is below average. Monitor progress closely.`,
        data: {
          performanceData: {
            term: currentTerm,
            academicYear: academicYear,
            overallScore: percentageRounded,
            score: score,
            maxScore: maxScore,
            grade: 'E',
            threshold: 50
          }
        }
      };
    }

    return null;
  }

  /**
   * Check performance-based risks (legacy method - kept for backward compatibility)
   * Refined: Only flag as CRITICAL/HIGH if overall average performance is 39% (F grade) or below
   * This prevents flagging students with minor performance issues as high risk
   */
  async checkPerformanceRisk(studentId, rules) {
    // Get recent performance records (last academic year)
    // Note: academicYear is stored as string (e.g., "2024-2025"), so we get all recent records
    // and filter by date instead to ensure we get current/recent academic year records
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const recentPerformances = await Performance.find({
      studentId,
      createdAt: { $gte: oneYearAgo }
    }).sort({ createdAt: -1 });

    if (recentPerformances.length === 0) {
      return null;
    }

    // Calculate overall average performance percentage
    let totalScore = 0;
    let totalMaxScore = 0;
    let validRecords = 0;

    recentPerformances.forEach(record => {
      if (record.score !== undefined && record.maxScore && record.maxScore > 0) {
        totalScore += record.score;
        totalMaxScore += record.maxScore;
        validRecords++;
      }
    });

    if (validRecords === 0) {
      return null;
    }

    const overallAverage = (totalScore / totalMaxScore) * 100;
    const overallAverageRounded = parseFloat(overallAverage.toFixed(1));

    // Critical/High threshold: 39% or below (F grade)
    const criticalThreshold = 39;

    // Check overall average performance first
    if (overallAverageRounded <= criticalThreshold) {
      const severity = overallAverageRounded <= 30 ? 'CRITICAL' : 'HIGH';
      return {
        type: 'PERFORMANCE',
        severity: severity,
        title: `${severity === 'CRITICAL' ? 'Critical' : 'High'} Performance: ${overallAverageRounded}% average`,
        description: `Student's overall average performance is ${overallAverageRounded}% (F grade), which is ${severity === 'CRITICAL' ? 'critically' : 'significantly'} below the passing threshold. This indicates ${severity === 'CRITICAL' ? 'critical' : 'high'} academic risk requiring immediate intervention.`,
        data: {
          performanceData: {
            overallAverage: overallAverageRounded,
            totalRecords: validRecords,
            totalScore: totalScore,
            totalMaxScore: totalMaxScore,
            threshold: criticalThreshold
          }
        }
      };
    }

    // Check for significant score drops (only if overall average is above 39%)
    // This is less severe than overall poor performance
    const subjects = [...new Set(recentPerformances.map(p => p.subject))];
    for (const subject of subjects) {
      const subjectPerformances = recentPerformances
        .filter(p => p.subject === subject)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (subjectPerformances.length >= 2) {
        const current = subjectPerformances[0];
        const previous = subjectPerformances[1];
        
        // Calculate percentage drop
        const currentPercentage = current.maxScore > 0 ? (current.score / current.maxScore) * 100 : 0;
        const previousPercentage = previous.maxScore > 0 ? (previous.score / previous.maxScore) * 100 : 0;
        const percentageDrop = previousPercentage - currentPercentage;
        
        // Only flag if current score is also below 50% AND dropped significantly
        if (currentPercentage <= 50 && percentageDrop >= 20) {
          return {
            type: 'PERFORMANCE',
            severity: 'MEDIUM',
            title: `Performance Decline in ${subject}`,
            description: `Score in ${subject} dropped from ${previousPercentage.toFixed(1)}% to ${currentPercentage.toFixed(1)}% (${percentageDrop.toFixed(1)}% drop). Current performance is below 50%. Monitor progress.`,
            data: {
              performanceData: {
                subject,
                currentScore: current.score,
                currentMaxScore: current.maxScore,
                currentPercentage: currentPercentage.toFixed(1),
                previousScore: previous.score,
                previousMaxScore: previous.maxScore,
                previousPercentage: previousPercentage.toFixed(1),
                percentageDrop: percentageDrop.toFixed(1)
              }
            }
          };
        }
      }
    }

    return null;
  }

  /**
   * Check socioeconomic risks
   */
  async checkSocioeconomicRisk(student, rules) {
    const riskFactors = [];

    if (student.socioEconomic.ubudeheLevel <= rules.highRiskFactors.ubudeheLevel) {
      riskFactors.push(`Ubudehe Level ${student.socioEconomic.ubudeheLevel} (extreme poverty)`);
    }

    if (!student.socioEconomic.hasParents && rules.highRiskFactors.noParents) {
      riskFactors.push('No parents (orphan)');
    }

    // Family stability: false (unstable) = risk, true (stable) = no risk
    if (!student.socioEconomic.familyStability && rules.highRiskFactors.familyStability) {
      riskFactors.push('Family stability concerns reported');
    }

    if (riskFactors.length >= 2) {
      return {
        type: 'SOCIOECONOMIC',
        severity: 'HIGH',
        title: 'Multiple Socioeconomic Risk Factors',
        description: `Student has multiple socioeconomic risk factors: ${riskFactors.join(', ')}`,
        data: {
          socioeconomicData: {
            ubudeheLevel: student.socioEconomic.ubudeheLevel,
            hasParents: student.socioEconomic.hasParents,
            familyStability: student.socioEconomic.familyStability,
            riskFactors
          }
        }
      };
    } else if (riskFactors.length === 1) {
      return {
        type: 'SOCIOECONOMIC',
        severity: 'MEDIUM',
        title: 'Socioeconomic Risk Factor',
        description: `Student has a socioeconomic risk factor: ${riskFactors[0]}`,
        data: {
          socioeconomicData: {
            ubudeheLevel: student.socioEconomic.ubudeheLevel,
            hasParents: student.socioEconomic.hasParents,
            familyStability: student.socioEconomic.familyStability,
            riskFactors
          }
        }
      };
    }

    return null;
  }

  /**
   * Check distance to school risks
   */
  async checkDistanceRisk(student) {
    if (!student.socioEconomic.distanceToSchoolKm) {
      return null;
    }

    const distance = student.socioEconomic.distanceToSchoolKm;

    if (distance >= 7) {
      return {
        type: 'DISTANCE',
        severity: 'CRITICAL',
        title: `Critical Distance: ${distance} km from school`,
        description: `Student lives ${distance} kilometers from school, exceeding the critical threshold of 7 km. This distance creates significant barriers to regular attendance.`,
        data: {
          distanceData: {
            distanceKm: distance,
            threshold: 7,
            riskLevel: 'CRITICAL'
          }
        }
      };
    } else if (distance >= 5) {
      return {
        type: 'DISTANCE',
        severity: 'HIGH',
        title: `High Distance: ${distance} km from school`,
        description: `Student lives ${distance} kilometers from school, indicating high dropout risk due to distance barriers.`,
        data: {
          distanceData: {
            distanceKm: distance,
            threshold: 5,
            riskLevel: 'HIGH'
          }
        }
      };
    } else if (distance >= 3) {
      return {
        type: 'DISTANCE',
        severity: 'MEDIUM',
        title: `Moderate Distance: ${distance} km from school`,
        description: `Student lives ${distance} kilometers from school. Monitor attendance patterns closely.`,
        data: {
          distanceData: {
            distanceKm: distance,
            threshold: 3,
            riskLevel: 'MEDIUM'
          }
        }
      };
    }

    return null;
  }

  /**
   * Check combined risks (escalate severity)
   */
  async checkCombinedRisk(risks, rules) {
    const mediumRisks = risks.filter(r => r.severity === 'MEDIUM');
    const hasAttendance = risks.some(r => r.type === 'ATTENDANCE');
    const hasPerformance = risks.some(r => r.type === 'PERFORMANCE');

    if (mediumRisks.length >= rules.escalateWhen.multipleMediumFlags) {
      return {
        type: 'COMBINED',
        severity: 'HIGH',
        title: 'Multiple Risk Factors Detected',
        description: `Student has ${mediumRisks.length} medium-risk factors that together indicate high dropout risk.`,
        data: {
          additionalInfo: {
            riskTypes: risks.map(r => r.type),
            escalationReason: 'Multiple medium-risk factors'
          }
        }
      };
    }

    if (hasAttendance && hasPerformance && rules.escalateWhen.attendanceAndPerformance) {
      return {
        type: 'COMBINED',
        severity: 'HIGH',
        title: 'Attendance and Performance Issues',
        description: 'Student has both attendance and performance issues, indicating high dropout risk.',
        data: {
          additionalInfo: {
            riskTypes: risks.map(r => r.type),
            escalationReason: 'Combined attendance and performance issues'
          }
        }
      };
    }

    return null;
  }

  /**
   * Update student risk level based on active flags
   * Automatically sets to LOW when all risk flags are resolved
   */
  async updateStudentRiskLevel(studentId) {
    const summary = await RiskFlag.getStudentSummary(studentId);
    const student = await Student.findById(studentId);
    
    if (student) {
      const previousRiskLevel = student.riskLevel;
      
      // Check if all risk flags are resolved
      const activeFlags = await RiskFlag.find({ 
        studentId, 
        isActive: true, 
        isResolved: false 
      });
      
      // If no active flags, automatically set to LOW
      if (activeFlags.length === 0) {
        student.riskLevel = 'LOW';
        // Track when all flags were resolved (for re-evaluation scheduling)
        student.lastAllFlagsResolvedAt = new Date();
        await student.save();
        
        logger.info(`Student ${studentId} risk level set to LOW - all risk flags resolved`);
        
        // If risk level changed from higher to LOW, notify
        if (previousRiskLevel && previousRiskLevel !== 'LOW') {
          const { notifyAdminOfStudentRisk } = require('../utils/adminNotificationService');
          await notifyAdminOfStudentRisk(
            studentId, 
            'LOW', 
            `Risk level automatically reduced to LOW - all risk flags have been resolved.`,
            'GENERAL'
          );
        }
        
        return 'LOW';
      }
      
      // If there are active flags, use the summary's overall risk
      student.riskLevel = summary.overallRisk;
      await student.save();

      // Notify admins if risk level changed to or is at-risk
      if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(summary.overallRisk)) {
        const { notifyAdminOfStudentRisk } = require('../utils/adminNotificationService');
        let reason = '';
        if (previousRiskLevel !== summary.overallRisk) {
          reason = `Risk level changed from ${previousRiskLevel || 'LOW'} to ${summary.overallRisk}.`;
        } else {
          reason = `Student has active risk flags with ${summary.overallRisk} risk level.`;
        }
        
        // Determine risk type from flags
        const riskTypes = [...new Set(activeFlags.map(f => f.type))];
        const riskType = riskTypes.length > 0 ? riskTypes[0] : 'GENERAL';
        
        await notifyAdminOfStudentRisk(studentId, summary.overallRisk, reason, riskType);

        // Automatically notify parents/guardians if risk level changed to HIGH or CRITICAL
        if (previousRiskLevel !== summary.overallRisk && (summary.overallRisk === 'HIGH' || summary.overallRisk === 'CRITICAL')) {
          const { notifyParentsOfRisk } = require('../utils/notificationService');
          notifyParentsOfRisk(studentId, summary.overallRisk, reason).catch(err => {
            logger.error('Error notifying parents of risk level change:', err);
          });
        }
      }
    }

    return summary.overallRisk;
  }

  /**
   * Run risk detection for all students in a school
   */
  async detectRisksForSchool(schoolId, userId) {
    try {
      const students = await Student.find({ schoolId, isActive: true });
      
      logger.info(`Starting risk detection for ${students.length} students in school ${schoolId}`);

      let processed = 0;
      let flagsCreated = 0;

      for (const student of students) {
        try {
          const result = await this.detectRisksForStudent(student._id, schoolId, userId);
          flagsCreated += result.flagsCreated;
          processed++;
        } catch (error) {
          logger.error(`Failed to detect risks for student ${student._id}:`, error);
        }
      }

      logger.info(`Risk detection completed for school ${schoolId}`, {
        studentsProcessed: processed,
        totalFlagsCreated: flagsCreated
      });

      return {
        studentsProcessed: processed,
        totalFlagsCreated: flagsCreated
      };
    } catch (error) {
      logger.error(`Risk detection failed for school ${schoolId}:`, error);
      throw error;
    }
  }
}

module.exports = new RiskDetectionService();
