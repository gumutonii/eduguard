const twilio = require('twilio');

class SMSService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    this.client = null;
    this.isConfigured = false;
    
    // Check if credentials look valid before initializing
    const hasValidCredentials = this.accountSid && 
                                 this.authToken && 
                                 this.fromNumber &&
                                 this.accountSid.startsWith('AC') &&
                                 this.authToken.length > 20;
    
    if (hasValidCredentials) {
      try {
        this.client = twilio(this.accountSid, this.authToken);
        this.isConfigured = true;
        console.log('✅ Twilio SMS service configured');
      } catch (error) {
        console.error('❌ Failed to initialize Twilio client:', error.message);
        console.warn('⚠️  SMS functionality disabled due to invalid credentials');
      }
    } else {
      if (this.accountSid && !this.accountSid.startsWith('AC')) {
        console.warn('⚠️  Invalid Twilio Account SID (must start with AC). SMS functionality disabled.');
      } else {
        console.warn('⚠️  Twilio credentials not configured. SMS functionality disabled.');
      }
    }
  }

  async sendSMS(to, message) {
    if (!this.isConfigured) {
      console.warn('SMS service not configured, skipping send');
      return {
        success: false,
        error: 'SMS service not configured',
        sid: null
      };
    }

    try {
      // Clean phone number
      const cleanedNumber = this.formatPhoneNumber(to);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: cleanedNumber
      });

      console.log(`✅ SMS sent successfully to ${cleanedNumber}, SID: ${result.sid}`);
      
      return {
        success: true,
        sid: result.sid,
        status: result.status,
        error: null
      };
    } catch (error) {
      console.error('❌ Failed to send SMS:', error.message);
      
      return {
        success: false,
        sid: null,
        status: 'failed',
        error: error.message
      };
    }
  }

  async sendBulkSMS(recipients) {
    if (!this.isConfigured) {
      console.warn('SMS service not configured, skipping bulk send');
      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        results: []
      };
    }

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.sendSMS(recipient.phone, recipient.message);
      
      results.push({
        phone: recipient.phone,
        success: result.success,
        sid: result.sid,
        error: result.error
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Add small delay to avoid rate limiting
      await this.delay(100);
    }

    return {
      success: sent > 0,
      sent,
      failed,
      results
    };
  }

  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Rwanda country code is +250
    if (cleaned.startsWith('250')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+250${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      return `+250${cleaned}`;
    }
    
    // If already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    return `+${cleaned}`;
  }

  async checkMessageStatus(sid) {
    if (!this.isConfigured) {
      return { status: 'unknown', error: 'SMS service not configured' };
    }

    try {
      const message = await this.client.messages(sid).fetch();
      return {
        status: message.status,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isEnabled() {
    return this.isConfigured;
  }
}

// Export singleton instance
module.exports = new SMSService();
