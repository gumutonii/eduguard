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
      const primaryGuardian = student.getPrimaryGuardian();

      if (!primaryGuardian) {
        throw new Error('No guardian contact found for student');
      }

      // Get template
      const language = settings.systemConfig.defaultLanguage;
      const template = this.getTemplate(settings, templateType, language, channel === 'EMAIL' ? 'email' : 'sms');

      // Replace variables in template
      const content = this.replaceVariables(template, {
        guardianName: primaryGuardian.name,
        studentName: student.fullName,
        schoolName: student.schoolId.name,
        contactInfo: student.schoolId.contact?.phone || '',
        ...variables
      });

      const messageData = {
        studentId: student._id,
        schoolId: student.schoolId._id,
        recipientType: 'GUARDIAN',
        recipientName: primaryGuardian.name,
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
          guardianName: primaryGuardian.name,
          studentName: student.fullName,
          schoolName: student.schoolId.name,
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
    if (!template || !template[language]) {
      throw new Error(`Template ${templateType} not found for language ${language}`);
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
