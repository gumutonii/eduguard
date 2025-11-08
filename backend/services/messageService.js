const Message = require('../models/Message');
const Student = require('../models/Student');
const Settings = require('../models/Settings');
const smsService = require('../utils/smsService');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

class MessageService {
  /**
   * Send a message to a guardian
   */
  async sendMessage(messageData) {
    try {
      // Create message record
      const message = await Message.create(messageData);

      // Send via appropriate channels
      if (messageData.channel === 'SMS' || messageData.channel === 'BOTH') {
        await this.sendViaSMS(message);
      }

      if (messageData.channel === 'EMAIL' || messageData.channel === 'BOTH') {
        await this.sendViaEmail(message);
      }

      return message;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send message via SMS
   */
  async sendViaSMS(message) {
    try {
      if (!smsService.isEnabled()) {
        message.smsStatus = 'NOT_SENT';
        message.smsError = 'SMS service not configured';
        await message.save();
        return;
      }

      const result = await smsService.sendSMS(message.recipientPhone, message.content);

      if (result.success) {
        await message.markAsSent('SMS', result.sid);
        logger.info(`SMS sent successfully for message ${message._id}`);
      } else {
        await message.markAsFailed('SMS', result.error);
        logger.error(`Failed to send SMS for message ${message._id}: ${result.error}`);
      }
    } catch (error) {
      await message.markAsFailed('SMS', error.message);
      logger.error(`Error sending SMS for message ${message._id}:`, error);
    }
  }

  /**
   * Send message via Email
   */
  async sendViaEmail(message) {
    try {
      if (!message.recipientEmail) {
        message.emailStatus = 'NOT_SENT';
        message.emailError = 'No email address provided';
        await message.save();
        return;
      }

      if (!emailService.isEnabled()) {
        message.emailStatus = 'NOT_SENT';
        message.emailError = 'Email service not configured';
        await message.save();
        return;
      }

      const result = await emailService.sendEmail({
        to: message.recipientEmail,
        subject: message.subject || 'Message from EduGuard',
        text: message.content,
        html: `<p>${message.content.replace(/\n/g, '<br>')}</p>`
      });

      if (result.success) {
        await message.markAsSent('EMAIL', result.messageId);
        logger.info(`Email sent successfully for message ${message._id}`);
      } else {
        await message.markAsFailed('EMAIL', result.error);
        logger.error(`Failed to send email for message ${message._id}: ${result.error}`);
      }
    } catch (error) {
      await message.markAsFailed('EMAIL', error.message);
      logger.error(`Error sending email for message ${message._id}:`, error);
    }
  }

  /**
   * Create message from template
   */
  async createFromTemplate(studentId, templateType, variables, channel = 'SMS', sentBy) {
    try {
      const student = await Student.findById(studentId).populate('schoolId');
      if (!student) {
        throw new Error('Student not found');
      }

      const settings = await Settings.getOrCreateForSchool(student.schoolId._id);
      
      // Get primary guardian - handle both method and direct access
      let primaryGuardian;
      if (typeof student.getPrimaryGuardian === 'function') {
        primaryGuardian = student.getPrimaryGuardian();
      } else if (student.guardianContacts && student.guardianContacts.length > 0) {
        // Fallback: get first guardian with contact info
        primaryGuardian = student.guardianContacts.find(g => g.phone || g.email) || student.guardianContacts[0];
      }

      if (!primaryGuardian || (!primaryGuardian.phone && !primaryGuardian.email)) {
        throw new Error('No guardian contact found for student');
      }

      // Get template
      const language = settings.systemConfig.defaultLanguage;
      const template = this.getTemplate(settings, templateType, language, channel === 'EMAIL' ? 'email' : 'sms');

      // Get guardian name (support both new structure and legacy)
      const guardianName = primaryGuardian.name || 
        (primaryGuardian.firstName && primaryGuardian.lastName 
          ? `${primaryGuardian.firstName} ${primaryGuardian.lastName}` 
          : primaryGuardian.firstName || 'Guardian');

      // Replace variables in template
      const content = this.replaceVariables(template, {
        guardianName: guardianName,
        studentName: student.fullName || `${student.firstName} ${student.lastName}`,
        schoolName: student.schoolId?.name || student.schoolId?.name || 'School',
        contactInfo: student.schoolId?.contact?.phone || student.schoolId?.phone || '',
        ...variables
      });

      const messageData = {
        studentId: student._id,
        schoolId: student.schoolId?._id || student.schoolId,
        recipientType: 'GUARDIAN',
        recipientName: guardianName,
        recipientPhone: primaryGuardian.phone,
        recipientEmail: primaryGuardian.email,
        channel,
        type: this.getMessageType(templateType),
        template: templateType,
        language,
        content,
        sentBy
      };

      // Add subject for email
      if (channel === 'EMAIL' || channel === 'BOTH') {
        const subjectTemplate = settings.notificationTemplates[templateType][language].email.subject;
        messageData.subject = this.replaceVariables(subjectTemplate, {
          guardianName: guardianName,
          studentName: student.fullName || `${student.firstName} ${student.lastName}`,
          schoolName: student.schoolId?.name || 'School',
          ...variables
        });
      }

      return await this.sendMessage(messageData);
    } catch (error) {
      logger.error('Failed to create message from template:', error);
      throw error;
    }
  }

  /**
   * Get template from settings
   */
  getTemplate(settings, templateType, language, channel) {
    const template = settings.notificationTemplates[templateType];
    if (!template) {
      throw new Error(`Template ${templateType} not found`);
    }

    // Fallback to EN if language not found
    if (!template[language]) {
      if (template['EN']) {
        language = 'EN';
      } else {
        throw new Error(`Template ${templateType} not found for language ${language} and no EN fallback available`);
      }
    }

    if (channel === 'email') {
      return template[language].email.body;
    } else {
      return template[language].sms;
    }
  }

  /**
   * Replace variables in template
   */
  replaceVariables(template, variables) {
    let content = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      content = content.replace(regex, value);
    }
    return content;
  }

  /**
   * Get message type from template type
   */
  getMessageType(templateType) {
    const typeMap = {
      absenceAlert: 'ABSENCE_ALERT',
      performanceAlert: 'PERFORMANCE_ALERT',
      meetingRequest: 'MEETING_REQUEST'
    };
    return typeMap[templateType] || 'GENERAL';
  }

  /**
   * Process pending messages queue
   */
  async processPendingMessages() {
    try {
      const pendingMessages = await Message.getPendingMessages(50);
      
      logger.info(`Processing ${pendingMessages.length} pending messages`);

      for (const message of pendingMessages) {
        if (message.channel === 'SMS' || message.channel === 'BOTH') {
          await this.sendViaSMS(message);
        }

        if (message.channel === 'EMAIL' || message.channel === 'BOTH') {
          await this.sendViaEmail(message);
        }

        // Small delay between messages
        await this.delay(200);
      }

      logger.info(`Completed processing pending messages`);
    } catch (error) {
      logger.error('Failed to process pending messages:', error);
    }
  }

  /**
   * Send absence alert
   */
  async sendAbsenceAlert(studentId, date, sentBy) {
    return await this.createFromTemplate(
      studentId,
      'absenceAlert',
      { date: new Date(date).toLocaleDateString() },
      'BOTH',
      sentBy
    );
  }

  /**
   * Send performance alert
   */
  async sendPerformanceAlert(studentId, subject, score, sentBy) {
    return await this.createFromTemplate(
      studentId,
      'performanceAlert',
      { subject, score },
      'BOTH',
      sentBy
    );
  }

  /**
   * Send meeting request
   */
  async sendMeetingRequest(studentId, date, time, location, sentBy) {
    return await this.createFromTemplate(
      studentId,
      'meetingRequest',
      { date, time, location },
      'BOTH',
      sentBy
    );
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new MessageService();
