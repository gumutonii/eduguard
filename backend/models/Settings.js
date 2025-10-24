const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  schoolDistrict: {
    type: String,
    required: [true, 'School district is required'],
    trim: true,
    maxlength: [100, 'District name cannot exceed 100 characters']
  },
  schoolSector: {
    type: String,
    required: [true, 'School sector is required'],
    trim: true,
    maxlength: [100, 'Sector name cannot exceed 100 characters']
  },
  // Risk Assessment Rules
  riskRules: {
    attendance: {
      enabled: { type: Boolean, default: true },
      mediumThreshold: {
        absences: { type: Number, default: 3 },
        withinDays: { type: Number, default: 7 }
      },
      highThreshold: {
        absences: { type: Number, default: 5 },
        withinDays: { type: Number, default: 7 }
      },
      criticalThreshold: {
        absences: { type: Number, default: 7 },
        withinDays: { type: Number, default: 14 }
      }
    },
    performance: {
      enabled: { type: Boolean, default: true },
      mediumThreshold: {
        scoreDrop: { type: Number, default: 15 },
        belowAverage: { type: Boolean, default: true }
      },
      highThreshold: {
        scoreDrop: { type: Number, default: 25 },
        failingGrade: { type: String, default: 'F' }
      },
      criticalThreshold: {
        scoreDrop: { type: Number, default: 35 },
        multipleFailures: { type: Number, default: 3 }
      }
    },
    socioeconomic: {
      enabled: { type: Boolean, default: true },
      highRiskFactors: {
        ubudeheLevel: { type: Number, default: 1 },
        noParents: { type: Boolean, default: true },
        familyConflict: { type: Boolean, default: true }
      }
    },
    combined: {
      enabled: { type: Boolean, default: true },
      escalateWhen: {
        multipleMediumFlags: { type: Number, default: 2 },
        attendanceAndPerformance: { type: Boolean, default: true }
      }
    }
  },
  
  // Notification Templates
  notificationTemplates: {
    absenceAlert: {
      en: {
        sms: { type: String, default: 'Dear {guardianName}, {studentName} was absent from {schoolName} on {date}. Please contact us if this continues. {contactInfo}' },
        email: {
          subject: { type: String, default: 'Absence Alert for {studentName}' },
          body: { type: String, default: 'Dear {guardianName},\n\nWe noticed that {studentName} was absent from {schoolName} on {date}.\n\nIf there are any concerns, please contact us.\n\nBest regards,\n{schoolName}' }
        }
      },
      rw: {
        sms: { type: String, default: 'Ndabagira {guardianName}, {studentName} ntiyaje ku ishuri {schoolName} ku itariki {date}. Tuhamagare niba ibi bikomeje. {contactInfo}' },
        email: {
          subject: { type: String, default: 'Ubutumwa bwo kutaja kwa {studentName}' },
          body: { type: String, default: 'Ndabagira {guardianName},\n\nTwabonye ko {studentName} ataje ku ishuri {schoolName} ku itariki {date}.\n\nNiba hari ikibazo, tuhamagare.\n\nMurakoze,\n{schoolName}' }
        }
      }
    },
    performanceAlert: {
      en: {
        sms: { type: String, default: 'Dear {guardianName}, {studentName}\'s performance in {subject} has dropped to {score}. Please discuss with your child. {contactInfo}' },
        email: {
          subject: { type: String, default: 'Performance Alert for {studentName}' },
          body: { type: String, default: 'Dear {guardianName},\n\nWe want to inform you that {studentName}\'s performance in {subject} has declined to {score}.\n\nWe recommend discussing this with your child and contacting their teacher.\n\nBest regards,\n{schoolName}' }
        }
      },
      rw: {
        sms: { type: String, default: 'Ndabagira {guardianName}, amanota ya {studentName} mu {subject} yagabanutse kugeza kuri {score}. Muganire n\'umwana. {contactInfo}' },
        email: {
          subject: { type: String, default: 'Ubutumwa bwo kugabanuka kw\'amanota ya {studentName}' },
          body: { type: String, default: 'Ndabagira {guardianName},\n\nTwifuza kubamenyesha ko amanota ya {studentName} mu {subject} yagabanutse kugeza kuri {score}.\n\nTubasaba kuganira n\'umwana wanyu no guhamagara umwarimu.\n\nMurakoze,\n{schoolName}' }
        }
      }
    },
    meetingRequest: {
      en: {
        sms: { type: String, default: 'Dear {guardianName}, we request a meeting about {studentName} on {date} at {time}. Please confirm. {contactInfo}' },
        email: {
          subject: { type: String, default: 'Meeting Request for {studentName}' },
          body: { type: String, default: 'Dear {guardianName},\n\nWe would like to schedule a meeting to discuss {studentName}\'s progress.\n\nDate: {date}\nTime: {time}\nLocation: {location}\n\nPlease confirm your attendance.\n\nBest regards,\n{schoolName}' }
        }
      },
      rw: {
        sms: { type: String, default: 'Ndabagira {guardianName}, twifuza guhuza inama ku bijyanye na {studentName} ku itariki {date} ku isaha {time}. Emeza. {contactInfo}' },
        email: {
          subject: { type: String, default: 'Guhuza inama ku bijyanye na {studentName}' },
          body: { type: String, default: 'Ndabagira {guardianName},\n\nTwifuza guhuza inama kugira ngo tuganire ku bijyanye n\'iterambere rya {studentName}.\n\nItariki: {date}\nIgihe: {time}\nAho: {location}\n\nEmeza ko uzaza.\n\nMurakoze,\n{schoolName}' }
        }
      }
    }
  },
  
  // Academic Calendar
  academicCalendar: {
    currentYear: { type: String, required: true },
    terms: [{
      name: { type: String, enum: ['TERM_1', 'TERM_2', 'TERM_3'], required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    }],
    holidays: [{
      name: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    }]
  },
  
  // System Configuration
  systemConfig: {
    defaultLanguage: { type: String, enum: ['EN', 'RW'], default: 'RW' },
    timezone: { type: String, default: 'Africa/Kigali' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    enableSMS: { type: Boolean, default: true },
    enableEmail: { type: Boolean, default: true },
    autoRiskDetection: { type: Boolean, default: true },
    riskDetectionFrequency: { type: String, enum: ['DAILY', 'WEEKLY'], default: 'DAILY' }
  },
  
  // Integration Settings
  integrations: {
    twilio: {
      enabled: { type: Boolean, default: false },
      fromNumber: { type: String, trim: true }
    },
    email: {
      enabled: { type: Boolean, default: false },
      fromEmail: { type: String, trim: true },
      fromName: { type: String, trim: true }
    }
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
settingsSchema.index({ schoolName: 1, schoolDistrict: 1 });

// Static method to get or create settings for a school
settingsSchema.statics.getOrCreateForSchool = async function(schoolName, schoolDistrict, schoolSector) {
  let settings = await this.findOne({ schoolName, schoolDistrict });
  
  if (!settings) {
    // Create default settings
    const currentYear = new Date().getFullYear();
    settings = await this.create({
      schoolName,
      schoolDistrict,
      schoolSector,
      academicCalendar: {
        currentYear: `${currentYear}/${currentYear + 1}`,
        terms: [
          {
            name: 'TERM_1',
            startDate: new Date(currentYear, 8, 1), // September 1
            endDate: new Date(currentYear, 11, 15) // December 15
          },
          {
            name: 'TERM_2',
            startDate: new Date(currentYear + 1, 0, 7), // January 7
            endDate: new Date(currentYear + 1, 3, 30) // April 30
          },
          {
            name: 'TERM_3',
            startDate: new Date(currentYear + 1, 4, 15), // May 15
            endDate: new Date(currentYear + 1, 7, 15) // August 15
          }
        ],
        holidays: []
      }
    });
  }
  
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
