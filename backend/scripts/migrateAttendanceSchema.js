const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

async function migrateAttendanceSchema() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Starting Attendance Schema Migration...');
    
    // Step 1: Find and remove duplicate records (keep the most recent one)
    console.log('\n🔍 Step 1: Finding duplicate attendance records...');
    const duplicates = await Attendance.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' }
            }
          },
          count: { $sum: 1 },
          records: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`   Found ${duplicates.length} groups with duplicates`);

    let duplicatesRemoved = 0;
    for (const group of duplicates) {
      const records = group.records;
      // Sort by createdAt (most recent first)
      records.sort((a, b) => {
        const dateA = a.createdAt || a._id.getTimestamp();
        const dateB = b.createdAt || b._id.getTimestamp();
        return dateB - dateA;
      });

      // Keep the first (most recent) record, delete the rest
      const toDelete = records.slice(1);
      const idsToDelete = toDelete.map(r => r._id);
      
      if (idsToDelete.length > 0) {
        await Attendance.deleteMany({ _id: { $in: idsToDelete } });
        duplicatesRemoved += idsToDelete.length;
        console.log(`   Removed ${idsToDelete.length} duplicate records for student ${group._id.studentId} on ${group._id.date}`);
      }
    }

    console.log(`   ✅ Removed ${duplicatesRemoved} duplicate records`);

    // Step 2: Add classId to records that don't have it
    console.log('\n🔍 Step 2: Adding classId to records missing it...');
    const recordsWithoutClassId = await Attendance.find({ 
      classId: { $exists: false } 
    }).lean();

    console.log(`   Found ${recordsWithoutClassId.length} records without classId`);

    let classIdAdded = 0;
    for (const record of recordsWithoutClassId) {
      try {
        const student = await Student.findById(record.studentId).select('classId');
        if (student && student.classId) {
          await Attendance.updateOne(
            { _id: record._id },
            { $set: { classId: student.classId } }
          );
          classIdAdded++;
        } else {
          console.log(`   ⚠️  Student ${record.studentId} not found or has no classId, skipping record ${record._id}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error updating record ${record._id}:`, error.message);
      }
    }

    console.log(`   ✅ Added classId to ${classIdAdded} records`);

    // Step 3: Remove records with invalid studentId or missing required fields
    console.log('\n🔍 Step 3: Cleaning up invalid records...');
    const allRecords = await Attendance.find({}).lean();
    let invalidRemoved = 0;

    for (const record of allRecords) {
      try {
        const student = await Student.findById(record.studentId);
        if (!student) {
          await Attendance.deleteOne({ _id: record._id });
          invalidRemoved++;
          console.log(`   Removed record ${record._id} - student not found`);
        } else if (!record.classId && student.classId) {
          // Update with classId if missing
          await Attendance.updateOne(
            { _id: record._id },
            { $set: { classId: student.classId } }
          );
        }
      } catch (error) {
        console.log(`   ⚠️  Error validating record ${record._id}:`, error.message);
      }
    }

    console.log(`   ✅ Removed ${invalidRemoved} invalid records`);

    // Step 4: Create/update indexes
    console.log('\n🔍 Step 4: Creating/updating indexes...');
    try {
      // Drop existing indexes that might conflict
      const existingIndexes = await Attendance.collection.indexes();
      const indexNames = existingIndexes.map(idx => idx.name);
      
      if (indexNames.includes('studentId_1_date_-1')) {
        try {
          await Attendance.collection.dropIndex('studentId_1_date_-1');
          console.log('   Dropped old studentId_1_date_-1 index');
        } catch (e) {
          console.log('   ⚠️  Could not drop old index:', e.message);
        }
      }

      // Create unique index (will fail if duplicates exist, but we cleaned them up)
      try {
        await Attendance.collection.createIndex(
          { studentId: 1, date: 1 },
          { unique: true, name: 'studentId_1_date_1_unique' }
        );
        console.log('   ✅ Created unique index on studentId + date');
      } catch (error) {
        if (error.code === 85 || error.message.includes('duplicate')) {
          console.log('   ⚠️  Unique index creation failed due to duplicates. Please run migration again after cleaning.');
        } else if (error.code === 86 || error.message.includes('already exists')) {
          console.log('   ℹ️  Unique index already exists');
        } else {
          throw error;
        }
      }

      // Create other indexes (use createIndex which is idempotent)
      const indexesToCreate = [
        { schoolId: 1, date: -1 },
        { classId: 1, date: -1 },
        { date: -1, status: 1 },
        { markedBy: 1, date: -1 },
        { studentId: 1, schoolId: 1, date: -1 },
        { schoolId: 1, classId: 1, date: -1 }
      ];

      for (const indexSpec of indexesToCreate) {
        try {
          await Attendance.collection.createIndex(indexSpec);
        } catch (error) {
          // Index might already exist, that's okay
          if (error.code !== 86 && !error.message.includes('already exists')) {
            console.log(`   ⚠️  Error creating index:`, error.message);
          }
        }
      }
      console.log('   ✅ All indexes verified/created');
    } catch (error) {
      console.log('   ⚠️  Error creating indexes:', error.message);
      // Continue even if index creation fails (might already exist)
    }

    // Step 5: Normalize dates in existing records (set to start of day UTC)
    console.log('\n🔍 Step 5: Normalizing dates in existing records...');
    const recordsToNormalize = await Attendance.find({
      date: { $exists: true }
    });

    let datesNormalized = 0;
    for (const record of recordsToNormalize) {
      const originalDate = new Date(record.date);
      const normalizedDate = new Date(originalDate);
      normalizedDate.setUTCHours(0, 0, 0, 0);
      
      // Only update if date needs normalization
      if (originalDate.getUTCHours() !== 0 || 
          originalDate.getUTCMinutes() !== 0 || 
          originalDate.getUTCSeconds() !== 0 ||
          originalDate.getUTCMilliseconds() !== 0) {
        record.date = normalizedDate;
        await record.save();
        datesNormalized++;
      }
    }

    console.log(`   ✅ Normalized ${datesNormalized} dates`);

    // Final summary
    const totalRecords = await Attendance.countDocuments();
    console.log('\n📊 Migration Summary:');
    console.log(`   - Duplicates removed: ${duplicatesRemoved}`);
    console.log(`   - classId added: ${classIdAdded}`);
    console.log(`   - Invalid records removed: ${invalidRemoved}`);
    console.log(`   - Dates normalized: ${datesNormalized}`);
    console.log(`   - Total records after migration: ${totalRecords}`);
    console.log('\n✅ Attendance schema migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateAttendanceSchema()
    .then(() => {
      console.log('\n🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateAttendanceSchema;

