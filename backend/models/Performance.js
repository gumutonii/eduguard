const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
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
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  term: {
    type: String,
    enum: ['TERM_1', 'TERM_2', 'TERM_3'],
    required: [true, 'Term is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  maxScore: {
    type: Number,
    default: 100,
    min: [1, 'Max score must be at least 1']
  },
  assessmentType: {
    type: String,
    enum: ['EXAM', 'TEST', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'FINAL'],
    required: [true, 'Assessment type is required'],
    default: 'EXAM'
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    required: true
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Entered by user ID is required']
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
performanceSchema.index({ studentId: 1, academicYear: 1, term: 1 });
performanceSchema.index({ schoolName: 1, schoolDistrict: 1, academicYear: 1, term: 1 });
performanceSchema.index({ classId: 1, subject: 1, term: 1 });
performanceSchema.index({ studentId: 1, subject: 1 });

// Auto-calculate grade before saving
performanceSchema.pre('save', function(next) {
  const percentage = (this.score / this.maxScore) * 100;
  
  if (percentage >= 90) this.grade = 'A';
  else if (percentage >= 80) this.grade = 'B';
  else if (percentage >= 70) this.grade = 'C';
  else if (percentage >= 60) this.grade = 'D';
  else if (percentage >= 50) this.grade = 'E';
  else this.grade = 'F';
  
  next();
});

// Static method to get student performance summary
performanceSchema.statics.getStudentSummary = async function(studentId, academicYear, term) {
  const performances = await this.find({
    studentId,
    academicYear,
    term
  });

  if (performances.length === 0) {
    return null;
  }

  const totalScore = performances.reduce((sum, p) => sum + p.score, 0);
  const averageScore = totalScore / performances.length;

  const gradeCount = performances.reduce((acc, p) => {
    acc[p.grade] = (acc[p.grade] || 0) + 1;
    return acc;
  }, {});

  return {
    subjects: performances.length,
    averageScore: averageScore.toFixed(2),
    totalScore,
    gradeDistribution: gradeCount,
    performances
  };
};

// Static method to detect performance drops
performanceSchema.statics.detectPerformanceDrop = async function(studentId, subject, currentTerm, previousTerm, academicYear) {
  const current = await this.findOne({
    studentId,
    subject,
    term: currentTerm,
    academicYear
  });

  const previous = await this.findOne({
    studentId,
    subject,
    term: previousTerm,
    academicYear
  });

  if (!current || !previous) {
    return null;
  }

  const drop = previous.score - current.score;
  
  return {
    subject,
    currentScore: current.score,
    previousScore: previous.score,
    drop,
    isHighRisk: drop >= 25,
    isMediumRisk: drop >= 15 && drop < 25,
    percentage: ((drop / previous.score) * 100).toFixed(2)
  };
};

// Static method to calculate class average
performanceSchema.statics.getClassAverage = async function(classId, subject, term, academicYear) {
  const performances = await this.find({
    classId,
    subject,
    term,
    academicYear
  });

  if (performances.length === 0) {
    return null;
  }

  const totalScore = performances.reduce((sum, p) => sum + p.score, 0);
  const averageScore = totalScore / performances.length;

  return {
    subject,
    term,
    academicYear,
    studentsCount: performances.length,
    averageScore: averageScore.toFixed(2),
    highestScore: Math.max(...performances.map(p => p.score)),
    lowestScore: Math.min(...performances.map(p => p.score))
  };
};

module.exports = mongoose.model('Performance', performanceSchema);
