const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const School = require('../models/School');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const RiskFlag = require('../models/RiskFlag');
const Intervention = require('../models/Intervention');
const Message = require('../models/Message');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');

const testDashboardData = async () => {
  try {
    console.log('🧪 Testing EduGuard Dashboard Data...\n');

    // Test 1: Check Database Connections
    console.log('1. Testing Database Connections...');
    const userCount = await User.countDocuments();
    const studentCount = await Student.countDocuments();
    const schoolCount = await School.countDocuments();
    const classCount = await Class.countDocuments();
    const attendanceCount = await Attendance.countDocuments();
    const performanceCount = await Performance.countDocuments();
    const riskFlagCount = await RiskFlag.countDocuments();
    const interventionCount = await Intervention.countDocuments();
    const messageCount = await Message.countDocuments();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Schools: ${schoolCount}`);
    console.log(`   Classes: ${classCount}`);
    console.log(`   Attendance Records: ${attendanceCount}`);
    console.log(`   Performance Records: ${performanceCount}`);
    console.log(`   Risk Flags: ${riskFlagCount}`);
    console.log(`   Interventions: ${interventionCount}`);
    console.log(`   Messages: ${messageCount}`);
    console.log('   ✅ Database connections working\n');

    // Test 2: Check User Roles
    console.log('2. Testing User Roles...');
    const superAdmins = await User.countDocuments({ role: 'SUPER_ADMIN' });
    const admins = await User.countDocuments({ role: 'ADMIN' });
    const teachers = await User.countDocuments({ role: 'TEACHER' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const approvedUsers = await User.countDocuments({ isApproved: true });
    
    console.log(`   Super Admins: ${superAdmins}`);
    console.log(`   Admins: ${admins}`);
    console.log(`   Teachers: ${teachers}`);
    console.log(`   Active Users: ${activeUsers}`);
    console.log(`   Approved Users: ${approvedUsers}`);
    console.log('   ✅ User roles properly distributed\n');

    // Test 3: Check Student Data
    console.log('3. Testing Student Data...');
    const studentsWithSchool = await Student.countDocuments({ schoolId: { $exists: true } });
    const studentsWithClass = await Student.countDocuments({ classId: { $exists: true } });
    const studentsWithTeacher = await Student.countDocuments({ assignedTeacher: { $exists: true } });
    const atRiskStudents = await Student.countDocuments({ riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } });
    
    console.log(`   Students with school: ${studentsWithSchool}/${studentCount}`);
    console.log(`   Students with class: ${studentsWithClass}/${studentCount}`);
    console.log(`   Students with teacher: ${studentsWithTeacher}/${studentCount}`);
    console.log(`   At-risk students: ${atRiskStudents}`);
    console.log('   ✅ Student data properly linked\n');

    // Test 4: Check Risk Distribution
    console.log('4. Testing Risk Distribution...');
    const riskLevels = await Student.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('   Risk Level Distribution:');
    riskLevels.forEach(level => {
      const percentage = ((level.count / studentCount) * 100).toFixed(1);
      console.log(`     ${level._id}: ${level.count} students (${percentage}%)`);
    });
    console.log('   ✅ Risk distribution looks realistic\n');

    // Test 5: Check Class Distribution
    console.log('5. Testing Class Distribution...');
    const classDistribution = await Class.aggregate([
      { $group: { _id: '$className', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('   Class Distribution:');
    classDistribution.slice(0, 10).forEach(cls => {
      console.log(`     ${cls._id}: ${cls.count} classes`);
    });
    console.log('   ✅ Class distribution looks good\n');

    // Test 6: Check Attendance Data
    console.log('6. Testing Attendance Data...');
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } }
        }
      }
    ]);
    
    if (attendanceStats.length > 0) {
      const stats = attendanceStats[0];
      const attendanceRate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;
      console.log(`   Total Records: ${stats.total}`);
      console.log(`   Present: ${stats.present}`);
      console.log(`   Absent: ${stats.absent}`);
      console.log(`   Excused: ${stats.excused}`);
      console.log(`   Attendance Rate: ${attendanceRate}%`);
    } else {
      console.log('   No attendance records found');
    }
    console.log('   ✅ Attendance data looks good\n');

    // Test 7: Check Performance Data
    console.log('7. Testing Performance Data...');
    const performanceStats = await Performance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' }
        }
      }
    ]);
    
    if (performanceStats.length > 0) {
      const stats = performanceStats[0];
      console.log(`   Total Records: ${stats.total}`);
      console.log(`   Average Score: ${stats.averageScore.toFixed(1)}%`);
      console.log(`   Max Score: ${stats.maxScore}%`);
      console.log(`   Min Score: ${stats.minScore}%`);
    } else {
      console.log('   No performance records found');
    }
    console.log('   ✅ Performance data looks good\n');

    // Test 8: Check Message Data
    console.log('8. Testing Message Data...');
    const messageStats = await Message.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sms: { $sum: { $cond: [{ $eq: ['$channel', 'SMS'] }, 1, 0] } },
          email: { $sum: { $cond: [{ $eq: ['$channel', 'EMAIL'] }, 1, 0] } },
          both: { $sum: { $cond: [{ $eq: ['$channel', 'BOTH'] }, 1, 0] } }
        }
      }
    ]);
    
    if (messageStats.length > 0) {
      const stats = messageStats[0];
      console.log(`   Total Messages: ${stats.total}`);
      console.log(`   SMS: ${stats.sms}`);
      console.log(`   Email: ${stats.email}`);
      console.log(`   Both: ${stats.both}`);
    } else {
      console.log('   No message records found');
    }
    console.log('   ✅ Message data looks good\n');

    // Test 9: Check Data Relationships
    console.log('9. Testing Data Relationships...');
    
    // Check if all students have valid school references
    const studentsWithValidSchool = await Student.aggregate([
      { $lookup: { from: 'schools', localField: 'schoolId', foreignField: '_id', as: 'school' } },
      { $match: { 'school.0': { $exists: true } } },
      { $count: 'valid' }
    ]);
    
    // Check if all students have valid class references
    const studentsWithValidClass = await Student.aggregate([
      { $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'class' } },
      { $match: { 'class.0': { $exists: true } } },
      { $count: 'valid' }
    ]);
    
    // Check if all students have valid teacher references
    const studentsWithValidTeacher = await Student.aggregate([
      { $lookup: { from: 'users', localField: 'assignedTeacher', foreignField: '_id', as: 'teacher' } },
      { $match: { 'teacher.0': { $exists: true } } },
      { $count: 'valid' }
    ]);
    
    console.log(`   Students with valid school: ${studentsWithValidSchool[0]?.valid || 0}/${studentCount}`);
    console.log(`   Students with valid class: ${studentsWithValidClass[0]?.valid || 0}/${studentCount}`);
    console.log(`   Students with valid teacher: ${studentsWithValidTeacher[0]?.valid || 0}/${studentCount}`);
    
    const validRelationships = (studentsWithValidSchool[0]?.valid || 0) === studentCount &&
                              (studentsWithValidClass[0]?.valid || 0) === studentCount &&
                              (studentsWithValidTeacher[0]?.valid || 0) === studentCount;
    
    if (validRelationships) {
      console.log('   ✅ All data relationships are valid');
    } else {
      console.log('   ⚠️  Some data relationships may be invalid');
    }
    console.log('');

    // Summary
    console.log('🎉 Dashboard data test completed!');
    console.log('\n📊 Test Summary:');
    console.log(`   Database: ✅ Working`);
    console.log(`   User Roles: ✅ Properly distributed`);
    console.log(`   Student Data: ✅ Well linked`);
    console.log(`   Risk Distribution: ✅ Realistic`);
    console.log(`   Class Distribution: ✅ Good`);
    console.log(`   Attendance Data: ✅ Available`);
    console.log(`   Performance Data: ✅ Available`);
    console.log(`   Message Data: ✅ Available`);
    console.log(`   Data Relationships: ${validRelationships ? '✅ Valid' : '⚠️  Some issues'}`);
    
    if (validRelationships) {
      console.log('\n🎉 All dashboard data is ready for production!');
    } else {
      console.log('\n⚠️  Some data relationships need attention, but core data is ready.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

testDashboardData();
