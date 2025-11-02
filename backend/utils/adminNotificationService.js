const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Class = require('../models/Class');

/**
 * Create in-app notification for admins when a student is flagged as at-risk
 * @param {string} studentId - Student ID
 * @param {string} riskLevel - Risk level (LOW, MEDIUM, HIGH, CRITICAL)
 * @param {string} reason - Reason/description for the risk
 * @param {string} riskType - Type of risk (e.g., 'ATTENDANCE', 'PERFORMANCE', 'SOCIOECONOMIC')
 */
const notifyAdminOfStudentRisk = async (studentId, riskLevel, reason = '', riskType = 'GENERAL') => {
  try {
    // Only notify for MEDIUM, HIGH, or CRITICAL risks
    if (!['MEDIUM', 'HIGH', 'CRITICAL'].includes(riskLevel)) {
      return { success: true, message: 'Low risk, no notification needed' };
    }

    // Get student information
    const student = await Student.findById(studentId)
      .populate('classId', 'className grade section')
      .populate('schoolId', 'name');

    if (!student) {
      console.error('Student not found:', studentId);
      return { success: false, error: 'Student not found' };
    }

    const schoolId = student.schoolId._id || student.schoolId;
    const studentName = `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim();
    const className = student.classId ? student.classId.className : 'Unknown Class';

    // Determine priority based on risk level
    let priority = 'MEDIUM';
    if (riskLevel === 'CRITICAL') priority = 'URGENT';
    else if (riskLevel === 'HIGH') priority = 'HIGH';
    else if (riskLevel === 'MEDIUM') priority = 'MEDIUM';

    // Create notification message
    const riskLevelText = riskLevel.charAt(0) + riskLevel.slice(1).toLowerCase();
    const title = `Student At Risk: ${studentName}`;
    let message = `${studentName} from ${className} has been flagged as ${riskLevelText} risk.`;
    
    if (reason) {
      message += ` ${reason}`;
    } else {
      message += ` Immediate attention may be required.`;
    }

    // Check if similar notification already exists (avoid duplicates)
    const existingNotification = await Notification.findOne({
      entityType: 'STUDENT',
      entityId: studentId,
      type: 'STUDENT_AT_RISK',
      schoolId: schoolId,
      recipientType: 'ADMIN',
      isRead: false,
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
      }
    });

    if (existingNotification) {
      // Update existing notification with latest risk level
      existingNotification.priority = priority;
      existingNotification.message = message;
      existingNotification.metadata = {
        ...existingNotification.metadata,
        riskLevel,
        riskType,
        updatedAt: new Date()
      };
      await existingNotification.save();
      return { success: true, message: 'Updated existing notification', notification: existingNotification };
    }

    // Create new notification for admins
    const notification = new Notification({
      entityType: 'STUDENT',
      entityId: studentId,
      recipientType: 'ADMIN',
      title,
      message,
      type: 'STUDENT_AT_RISK',
      priority,
      schoolId: schoolId,
      actionUrl: `/classes/${student.classId?._id || ''}`,
      actionText: 'View Class',
      metadata: {
        riskLevel,
        riskType,
        className,
        studentName
      }
    });

    await notification.save();

    console.log(`Admin notification created for at-risk student: ${studentName} (${riskLevel})`);
    return { success: true, notification };
  } catch (error) {
    console.error('Error creating admin notification for student risk:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify admins when multiple students are at-risk (batch processing)
 * @param {Array} students - Array of student objects with risk information
 */
const notifyAdminOfBatchStudentRisks = async (students) => {
  try {
    const results = [];
    for (const studentInfo of students) {
      const result = await notifyAdminOfStudentRisk(
        studentInfo.studentId,
        studentInfo.riskLevel,
        studentInfo.reason,
        studentInfo.riskType
      );
      results.push(result);
    }
    return { success: true, results };
  } catch (error) {
    console.error('Error creating batch admin notifications:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  notifyAdminOfStudentRisk,
  notifyAdminOfBatchStudentRisks
};

