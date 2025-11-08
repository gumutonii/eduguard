const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
require('dotenv').config();

async function validateSchemas() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Validate Attendance Schema
    console.log('\n📋 Validating Attendance Schema...');
    const attendanceCount = await Attendance.countDocuments();
    console.log(`   Total attendance records: ${attendanceCount}`);

    // Check for documents missing required fields
    const attendanceIssues = [];
    
    // Check for missing studentId
    const missingStudentId = await Attendance.countDocuments({ studentId: { $exists: false } });
    if (missingStudentId > 0) attendanceIssues.push(`Missing studentId: ${missingStudentId}`);
    
    // Check for missing schoolId
    const missingSchoolId = await Attendance.countDocuments({ schoolId: { $exists: false } });
    if (missingSchoolId > 0) attendanceIssues.push(`Missing schoolId: ${missingSchoolId}`);
    
    // Check for missing date
    const missingDate = await Attendance.countDocuments({ date: { $exists: false } });
    if (missingDate > 0) attendanceIssues.push(`Missing date: ${missingDate}`);
    
    // Check for missing status
    const missingStatus = await Attendance.countDocuments({ status: { $exists: false } });
    if (missingStatus > 0) attendanceIssues.push(`Missing status: ${missingStatus}`);
    
    // Check for missing markedBy
    const missingMarkedBy = await Attendance.countDocuments({ markedBy: { $exists: false } });
    if (missingMarkedBy > 0) attendanceIssues.push(`Missing markedBy: ${missingMarkedBy}`);
    
    // Check for invalid status values
    const invalidStatus = await Attendance.countDocuments({ 
      status: { $nin: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] } 
    });
    if (invalidStatus > 0) attendanceIssues.push(`Invalid status values: ${invalidStatus}`);

    if (attendanceIssues.length > 0) {
      console.log('   ⚠️  Issues found:');
      attendanceIssues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('   ✅ All attendance records match schema');
    }

    // Validate Performance Schema
    console.log('\n📋 Validating Performance Schema...');
    const performanceCount = await Performance.countDocuments();
    console.log(`   Total performance records: ${performanceCount}`);

    const performanceIssues = [];
    
    // Check for missing required fields
    const missingPerfStudentId = await Performance.countDocuments({ studentId: { $exists: false } });
    if (missingPerfStudentId > 0) performanceIssues.push(`Missing studentId: ${missingPerfStudentId}`);
    
    const missingPerfSchoolId = await Performance.countDocuments({ schoolId: { $exists: false } });
    if (missingPerfSchoolId > 0) performanceIssues.push(`Missing schoolId: ${missingPerfSchoolId}`);
    
    const missingPerfClassId = await Performance.countDocuments({ classId: { $exists: false } });
    if (missingPerfClassId > 0) performanceIssues.push(`Missing classId: ${missingPerfClassId}`);
    
    const missingPerfAcademicYear = await Performance.countDocuments({ academicYear: { $exists: false } });
    if (missingPerfAcademicYear > 0) performanceIssues.push(`Missing academicYear: ${missingPerfAcademicYear}`);
    
    const missingPerfTerm = await Performance.countDocuments({ term: { $exists: false } });
    if (missingPerfTerm > 0) performanceIssues.push(`Missing term: ${missingPerfTerm}`);
    
    const missingPerfSubject = await Performance.countDocuments({ subject: { $exists: false } });
    if (missingPerfSubject > 0) performanceIssues.push(`Missing subject: ${missingPerfSubject}`);
    
    const missingPerfScore = await Performance.countDocuments({ score: { $exists: false } });
    if (missingPerfScore > 0) performanceIssues.push(`Missing score: ${missingPerfScore}`);
    
    const missingPerfGrade = await Performance.countDocuments({ grade: { $exists: false } });
    if (missingPerfGrade > 0) performanceIssues.push(`Missing grade: ${missingPerfGrade}`);
    
    const missingPerfEnteredBy = await Performance.countDocuments({ enteredBy: { $exists: false } });
    if (missingPerfEnteredBy > 0) performanceIssues.push(`Missing enteredBy: ${missingPerfEnteredBy}`);
    
    // Check for invalid term values
    const invalidTerm = await Performance.countDocuments({ 
      term: { $nin: ['TERM_1', 'TERM_2', 'TERM_3'] } 
    });
    if (invalidTerm > 0) performanceIssues.push(`Invalid term values: ${invalidTerm}`);
    
    // Check for invalid grade values
    const invalidGrade = await Performance.countDocuments({ 
      grade: { $nin: ['A', 'B', 'C', 'D', 'E', 'F'] } 
    });
    if (invalidGrade > 0) performanceIssues.push(`Invalid grade values: ${invalidGrade}`);
    
    // Check for scores out of range
    const invalidScore = await Performance.countDocuments({ 
      $or: [
        { score: { $lt: 0 } },
        { score: { $gt: 100 } }
      ]
    });
    if (invalidScore > 0) performanceIssues.push(`Invalid score range: ${invalidScore}`);

    if (performanceIssues.length > 0) {
      console.log('   ⚠️  Issues found:');
      performanceIssues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('   ✅ All performance records match schema');
    }

    // Sample documents
    console.log('\n📄 Sample Attendance Document:');
    const sampleAttendance = await Attendance.findOne().lean();
    if (sampleAttendance) {
      console.log(JSON.stringify(sampleAttendance, null, 2));
    } else {
      console.log('   No attendance records found');
    }

    console.log('\n📄 Sample Performance Document:');
    const samplePerformance = await Performance.findOne().lean();
    if (samplePerformance) {
      console.log(JSON.stringify(samplePerformance, null, 2));
    } else {
      console.log('   No performance records found');
    }

    await mongoose.disconnect();
    console.log('\n✅ Validation completed!');
  } catch (error) {
    console.error('❌ Error validating schemas:', error);
    process.exit(1);
  }
}

// Run validation
validateSchemas();

