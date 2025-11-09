const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');

/**
 * Script to identify and remove sample/test attendance records
 * This script helps clean up any attendance data that might have been created
 * as sample/test data rather than from real student attendance lists
 */
async function cleanSampleAttendance() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Starting Sample Attendance Cleanup...');
    
    const totalRecords = await Attendance.countDocuments();
    console.log(`📊 Total attendance records: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('📌 No attendance records found. Nothing to clean.');
      await mongoose.disconnect();
      return;
    }

    // Step 1: Find attendance records with invalid student references
    console.log('\n🔍 Step 1: Finding records with invalid student references...');
    const allAttendance = await Attendance.find({}).lean();
    const invalidStudentRecords = [];
    const validStudentIds = new Set();

    for (const record of allAttendance) {
      if (!validStudentIds.has(record.studentId.toString())) {
        const student = await Student.findById(record.studentId);
        if (!student) {
          invalidStudentRecords.push(record._id);
        } else {
          validStudentIds.add(record.studentId.toString());
        }
      }
    }

    console.log(`   Found ${invalidStudentRecords.length} records with invalid student references`);

    // Step 2: Find attendance records with invalid school references
    console.log('\n🔍 Step 2: Finding records with invalid school references...');
    const invalidSchoolRecords = [];
    const validSchoolIds = new Set();

    for (const record of allAttendance) {
      if (record.schoolId && !validSchoolIds.has(record.schoolId.toString())) {
        const user = await User.findOne({ schoolId: record.schoolId });
        if (!user) {
          // Check if schoolId might be a valid ObjectId but no user exists
          // This is a heuristic - in production, you might want to check a School model
          invalidSchoolRecords.push(record._id);
        } else {
          validSchoolIds.add(record.schoolId.toString());
        }
      }
    }

    console.log(`   Found ${invalidSchoolRecords.length} records with suspicious school references`);

    // Step 3: Find attendance records with invalid classId (new requirement)
    console.log('\n🔍 Step 3: Finding records with missing or invalid classId...');
    const missingClassIdRecords = await Attendance.find({
      $or: [
        { classId: { $exists: false } },
        { classId: null }
      ]
    }).lean();

    console.log(`   Found ${missingClassIdRecords.length} records with missing classId`);

    // Step 4: Find attendance records with suspicious patterns
    // (e.g., all created on the same day, same status, etc.)
    console.log('\n🔍 Step 4: Finding records with suspicious creation patterns...');
    
    // Group by creation date to find bulk creations
    const creationGroups = await Attendance.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          records: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gte: 10 } // More than 10 records created on same day might be suspicious
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const suspiciousBulkRecords = [];
    for (const group of creationGroups) {
      // Check if all records have same status (might indicate sample data)
      const statusCounts = {};
      group.records.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      });
      
      // If more than 80% have the same status, it might be sample data
      const maxStatusCount = Math.max(...Object.values(statusCounts));
      if (maxStatusCount / group.count > 0.8) {
        console.log(`   ⚠️  Suspicious bulk creation on ${group._id}: ${group.count} records, ${maxStatusCount} with same status`);
        group.records.forEach(r => {
          suspiciousBulkRecords.push(r._id);
        });
      }
    }

    console.log(`   Found ${suspiciousBulkRecords.length} records in suspicious bulk creation patterns`);

    // Step 5: Find records created by test users or suspicious users
    console.log('\n🔍 Step 5: Finding records created by test/suspicious users...');
    const testUserPatterns = ['test', 'sample', 'demo', 'admin@eduguard'];
    const suspiciousUserRecords = [];
    
    for (const record of allAttendance) {
      if (record.markedBy) {
        const user = await User.findById(record.markedBy);
        if (user) {
          const email = (user.email || '').toLowerCase();
          const name = (user.name || '').toLowerCase();
          if (testUserPatterns.some(pattern => email.includes(pattern) || name.includes(pattern))) {
            suspiciousUserRecords.push(record._id);
          }
        }
      }
    }

    console.log(`   Found ${suspiciousUserRecords.length} records created by test/suspicious users`);

    // Step 6: Compile all records to delete
    const recordsToDelete = new Set([
      ...invalidStudentRecords,
      ...invalidSchoolRecords,
      ...missingClassIdRecords.map(r => r._id.toString()),
      ...suspiciousBulkRecords.map(r => r.toString()),
      ...suspiciousUserRecords.map(r => r.toString())
    ]);

    console.log(`\n📊 Summary:`);
    console.log(`   - Invalid student references: ${invalidStudentRecords.length}`);
    console.log(`   - Invalid school references: ${invalidSchoolRecords.length}`);
    console.log(`   - Missing classId: ${missingClassIdRecords.length}`);
    console.log(`   - Suspicious bulk patterns: ${suspiciousBulkRecords.length}`);
    console.log(`   - Test user records: ${suspiciousUserRecords.length}`);
    console.log(`   - Total unique records to delete: ${recordsToDelete.size}`);

    if (recordsToDelete.size === 0) {
      console.log('\n✅ No suspicious attendance records found. Database is clean!');
      await mongoose.disconnect();
      return;
    }

    // Ask for confirmation (in production, you might want to add a --force flag)
    console.log('\n⚠️  WARNING: This will delete the identified suspicious records.');
    console.log('   If you want to proceed, modify this script to set confirmDelete = true');
    
    const confirmDelete = process.env.FORCE_DELETE === 'true' || false;
    
    if (confirmDelete) {
      const deleteResult = await Attendance.deleteMany({
        _id: { $in: Array.from(recordsToDelete).map(id => new mongoose.Types.ObjectId(id)) }
      });
      
      console.log(`\n✅ Deleted ${deleteResult.deletedCount} suspicious attendance records`);
      
      const remainingCount = await Attendance.countDocuments();
      console.log(`📊 Remaining attendance records: ${remainingCount}`);
    } else {
      console.log('\n📋 Records that would be deleted (dry run):');
      console.log('   To actually delete, set FORCE_DELETE=true environment variable');
      console.log('   Example: FORCE_DELETE=true node scripts/cleanSampleAttendance.js');
    }

    console.log('\n✅ Sample attendance cleanup analysis completed!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanSampleAttendance()
    .then(() => {
      console.log('\n🎉 Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = cleanSampleAttendance;

