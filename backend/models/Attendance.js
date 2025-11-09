const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    required: [true, 'Status is required'],
    default: 'PRESENT'
  },
  reason: {
    type: String,
    enum: ['ILLNESS', 'FEES', 'FAMILY_EMERGENCY', 'CHORES', 'DISTANCE', 'OTHER', 'NONE'],
    default: 'NONE'
  },
  reasonDetails: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason details cannot exceed 500 characters']
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by user ID is required']
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedAt: Date,
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
// Unique index to prevent duplicate attendance records for same student on same date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ schoolId: 1, date: -1 });
attendanceSchema.index({ classId: 1, date: -1 });
attendanceSchema.index({ date: -1, status: 1 });
attendanceSchema.index({ markedBy: 1, date: -1 });
attendanceSchema.index({ studentId: 1, schoolId: 1, date: -1 });
attendanceSchema.index({ schoolId: 1, classId: 1, date: -1 });

// Static method to get attendance summary for a student
attendanceSchema.statics.getStudentSummary = async function(studentId, startDate, endDate) {
  const attendance = await this.find({
    studentId,
    date: { $gte: startDate, $lte: endDate }
  });

  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'PRESENT').length;
  const absent = attendance.filter(a => a.status === 'ABSENT').length;
  const late = attendance.filter(a => a.status === 'LATE').length;
  const excused = attendance.filter(a => a.status === 'EXCUSED').length;

  return {
    total,
    present,
    absent,
    late,
    excused,
    attendanceRate: total > 0 ? ((present + late) / total * 100).toFixed(2) : 0
  };
};

// Static method to check absenteeism patterns
attendanceSchema.statics.checkAbsenteeismPattern = async function(studentId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const recentAttendance = await this.find({
    studentId,
    date: { $gte: startDate },
    status: 'ABSENT'
  }).sort({ date: -1 });

  return {
    absences: recentAttendance.length,
    dates: recentAttendance.map(a => a.date),
    isHighRisk: recentAttendance.length >= 5,
    isMediumRisk: recentAttendance.length >= 3 && recentAttendance.length < 5
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);
