const { sendParentRiskAlert, sendParentRiskAlertSMS } = require('./emailService');
const Student = require('../models/Student');
const School = require('../models/School');

// Send notifications to parents when a student is flagged as at-risk
const notifyParentsOfRisk = async (studentId, riskLevel, riskDescription) => {
  try {
    // Get student information
    const student = await Student.findById(studentId).populate('schoolId', 'name');
    
    if (!student) {
      console.error('Student not found:', studentId);
      return { success: false, error: 'Student not found' };
    }

    const schoolName = student.schoolId?.name || 'Unknown School';
    const studentName = `${student.firstName} ${student.lastName}`;
    
    // Get all guardian contacts for this student
    const guardianContacts = student.guardianContacts || [];
    
    if (guardianContacts.length === 0) {
      console.log(`No guardian contacts found for student ${studentName}`);
      return { success: true, message: 'No guardian contacts to notify' };
    }

    const notificationResults = [];
    
    // Send notifications to each guardian contact
    for (const guardian of guardianContacts) {
      const results = {};
      
      // Send email notification if email is provided
      if (guardian.email) {
        try {
          const emailResult = await sendParentRiskAlert(
            guardian.email,
            guardian.name,
            studentName,
            riskLevel,
            riskDescription,
            schoolName
          );
          results.email = emailResult;
        } catch (error) {
          console.error(`Failed to send email to ${guardian.email}:`, error);
          results.email = { success: false, error: error.message };
        }
      }
      
      // Send SMS notification if phone is provided
      if (guardian.phone) {
        try {
          const smsResult = await sendParentRiskAlertSMS(
            guardian.phone,
            studentName,
            riskLevel,
            schoolName
          );
          results.sms = smsResult;
        } catch (error) {
          console.error(`Failed to send SMS to ${guardian.phone}:`, error);
          results.sms = { success: false, error: error.message };
        }
      }
      
      notificationResults.push({
        guardian: guardian.name,
        contact: {
          email: guardian.email,
          phone: guardian.phone
        },
        results
      });
    }
    
    console.log(`Parent notifications sent for student ${studentName} (${riskLevel} risk)`);
    
    return {
      success: true,
      studentName,
      riskLevel,
      notificationsSent: notificationResults.length,
      results: notificationResults
    };
    
  } catch (error) {
    console.error('Error notifying parents of risk:', error);
    return { success: false, error: error.message };
  }
};

// Send notifications for multiple students (batch processing)
const notifyParentsOfBatchRisk = async (studentIds, riskLevel, riskDescription) => {
  try {
    const results = [];
    
    for (const studentId of studentIds) {
      const result = await notifyParentsOfRisk(studentId, riskLevel, riskDescription);
      results.push({ studentId, ...result });
    }
    
    return {
      success: true,
      totalStudents: studentIds.length,
      results
    };
  } catch (error) {
    console.error('Error in batch parent notification:', error);
    return { success: false, error: error.message };
  }
};

// Send attendance alerts to parents
const notifyParentsOfAttendance = async (studentId, attendanceData) => {
  try {
    const student = await Student.findById(studentId).populate('schoolId', 'name');
    
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    const schoolName = student.schoolId?.name || 'Unknown School';
    const studentName = `${student.firstName} ${student.lastName}`;
    
    // Create attendance-specific risk description
    const riskDescription = `Attendance concerns: ${attendanceData.absentDays} days absent in the last ${attendanceData.period} days. Current attendance rate: ${attendanceData.attendanceRate}%`;
    
    return await notifyParentsOfRisk(studentId, 'MEDIUM', riskDescription);
  } catch (error) {
    console.error('Error notifying parents of attendance:', error);
    return { success: false, error: error.message };
  }
};

// Send performance alerts to parents
const notifyParentsOfPerformance = async (studentId, performanceData) => {
  try {
    const student = await Student.findById(studentId).populate('schoolId', 'name');
    
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    const schoolName = student.schoolId?.name || 'Unknown School';
    const studentName = `${student.firstName} ${student.lastName}`;
    
    // Create performance-specific risk description
    const riskDescription = `Academic performance concerns: Recent grades show ${performanceData.declineReason}. Current average: ${performanceData.currentAverage}%`;
    
    return await notifyParentsOfRisk(studentId, 'MEDIUM', riskDescription);
  } catch (error) {
    console.error('Error notifying parents of performance:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  notifyParentsOfRisk,
  notifyParentsOfBatchRisk,
  notifyParentsOfAttendance,
  notifyParentsOfPerformance
};
