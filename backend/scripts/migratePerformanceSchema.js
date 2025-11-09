const mongoose = require('mongoose');
require('dotenv').config();

const Performance = require('../models/Performance');
const Student = require('../models/Student');

async function migratePerformanceSchema() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Starting Performance Schema Migration...');
    
    // Step 1: Find and remove duplicate records (keep the most recent one)
    console.log('\n🔍 Step 1: Finding duplicate performance records...');
    const duplicates = await Performance.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            academicYear: '$academicYear',
            term: '$term',
            subject: '$subject'
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
        await Performance.deleteMany({ _id: { $in: idsToDelete } });
        duplicatesRemoved += idsToDelete.length;
        console.log(`   Removed ${idsToDelete.length} duplicate records for student ${group._id.studentId} - ${group._id.subject} ${group._id.term}`);
      }
    }

    console.log(`   ✅ Removed ${duplicatesRemoved} duplicate records`);

    // Step 2: Add classId to records that don't have it
    console.log('\n🔍 Step 2: Adding classId to records missing it...');
    const recordsWithoutClassId = await Performance.find({ 
      classId: { $exists: false } 
    }).lean();

    console.log(`   Found ${recordsWithoutClassId.length} records without classId`);

    let classIdAdded = 0;
    for (const record of recordsWithoutClassId) {
      try {
        const student = await Student.findById(record.studentId).select('classId');
        if (student && student.classId) {
          await Performance.updateOne(
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
    const allRecords = await Performance.find({}).lean();
    let invalidRemoved = 0;

    for (const record of allRecords) {
      try {
        const student = await Student.findById(record.studentId);
        if (!student) {
          await Performance.deleteOne({ _id: record._id });
          invalidRemoved++;
          console.log(`   Removed record ${record._id} - student not found`);
        } else if (!record.classId && student.classId) {
          // Update with classId if missing
          await Performance.updateOne(
            { _id: record._id },
            { $set: { classId: student.classId } }
          );
        }
      } catch (error) {
        console.log(`   ⚠️  Error validating record ${record._id}:`, error.message);
      }
    }

    console.log(`   ✅ Removed ${invalidRemoved} invalid records`);

    // Step 4: Ensure all records have valid grades
    console.log('\n🔍 Step 4: Validating and fixing grades...');
    const recordsToFix = await Performance.find({
      $or: [
        { grade: { $exists: false } },
        { grade: { $nin: ['A', 'B', 'C', 'D', 'E', 'F'] } }
      ]
    });

    let gradesFixed = 0;
    for (const record of recordsToFix) {
      const percentage = (record.score / record.maxScore) * 100;
      let grade = 'F';
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 80) grade = 'B';
      else if (percentage >= 70) grade = 'C';
      else if (percentage >= 60) grade = 'D';
      else if (percentage >= 50) grade = 'E';
      
      record.grade = grade;
      await record.save();
      gradesFixed++;
    }

    console.log(`   ✅ Fixed ${gradesFixed} grades`);

    // Step 5: Create/update indexes
    console.log('\n🔍 Step 5: Creating/updating indexes...');
    try {
      const existingIndexes = await Performance.collection.indexes();
      const indexNames = existingIndexes.map(idx => idx.name);
      
      // Create unique index (will fail if duplicates exist, but we cleaned them up)
      try {
        await Performance.collection.createIndex(
          { studentId: 1, academicYear: 1, term: 1, subject: 1 },
          { unique: true, name: 'studentId_1_academicYear_1_term_1_subject_1_unique' }
        );
        console.log('   ✅ Created unique index on studentId + academicYear + term + subject');
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
        { schoolId: 1, academicYear: 1, term: 1 },
        { classId: 1, subject: 1, term: 1 },
        { studentId: 1, subject: 1 },
        { schoolId: 1, classId: 1, academicYear: 1, term: 1 }
      ];

      for (const indexSpec of indexesToCreate) {
        try {
          await Performance.collection.createIndex(indexSpec);
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
    }

    // Final summary
    const totalRecords = await Performance.countDocuments();
    console.log('\n📊 Migration Summary:');
    console.log(`   - Duplicates removed: ${duplicatesRemoved}`);
    console.log(`   - classId added: ${classIdAdded}`);
    console.log(`   - Invalid records removed: ${invalidRemoved}`);
    console.log(`   - Grades fixed: ${gradesFixed}`);
    console.log(`   - Total records after migration: ${totalRecords}`);
    console.log('\n✅ Performance schema migration completed successfully!');

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
  migratePerformanceSchema()
    .then(() => {
      console.log('\n🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migratePerformanceSchema;

