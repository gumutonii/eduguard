const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
require('dotenv').config();

async function migrateSchemas() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    let migratedCount = 0;

    // Migrate Attendance documents
    console.log('\n📋 Migrating Attendance documents...');
    const attendanceDocs = await Attendance.find({});
    console.log(`   Found ${attendanceDocs.length} attendance records`);

    for (const doc of attendanceDocs) {
      let updated = false;

      // Ensure required fields have defaults if missing
      if (!doc.status) {
        doc.status = 'PRESENT';
        updated = true;
      }

      if (!doc.reason) {
        doc.reason = 'NONE';
        updated = true;
      }

      // Ensure status is valid enum value
      if (!['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(doc.status)) {
        doc.status = 'PRESENT';
        updated = true;
      }

      // Ensure reason is valid enum value
      if (!['ILLNESS', 'FEES', 'FAMILY_EMERGENCY', 'CHORES', 'DISTANCE', 'OTHER', 'NONE'].includes(doc.reason)) {
        doc.reason = 'NONE';
        updated = true;
      }

      if (updated) {
        await doc.save();
        migratedCount++;
      }
    }

    console.log(`   ✅ Migrated ${migratedCount} attendance records`);

    // Migrate Performance documents
    console.log('\n📋 Migrating Performance documents...');
    const performanceDocs = await Performance.find({});
    console.log(`   Found ${performanceDocs.length} performance records`);

    migratedCount = 0;

    for (const doc of performanceDocs) {
      let updated = false;

      // Ensure maxScore defaults to 100 if missing
      if (!doc.maxScore) {
        doc.maxScore = 100;
        updated = true;
      }

      // Ensure assessmentType defaults to 'EXAM' if missing
      if (!doc.assessmentType) {
        doc.assessmentType = 'EXAM';
        updated = true;
      }

      // Ensure term is valid enum value
      if (!['TERM_1', 'TERM_2', 'TERM_3'].includes(doc.term)) {
        doc.term = 'TERM_1';
        updated = true;
      }

      // Ensure assessmentType is valid enum value
      if (!['EXAM', 'TEST', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'FINAL'].includes(doc.assessmentType)) {
        doc.assessmentType = 'EXAM';
        updated = true;
      }

      // Recalculate grade if score exists
      if (doc.score !== undefined && doc.maxScore) {
        const percentage = (doc.score / doc.maxScore) * 100;
        let newGrade = 'F';
        if (percentage >= 90) newGrade = 'A';
        else if (percentage >= 80) newGrade = 'B';
        else if (percentage >= 70) newGrade = 'C';
        else if (percentage >= 60) newGrade = 'D';
        else if (percentage >= 50) newGrade = 'E';

        if (doc.grade !== newGrade) {
          doc.grade = newGrade;
          updated = true;
        }
      }

      // Ensure score is within valid range
      if (doc.score !== undefined) {
        if (doc.score < 0) {
          doc.score = 0;
          updated = true;
        } else if (doc.score > 100) {
          doc.score = 100;
          updated = true;
        }
      }

      if (updated) {
        await doc.save();
        migratedCount++;
      }
    }

    console.log(`   ✅ Migrated ${migratedCount} performance records`);

    // Rebuild indexes
    console.log('\n🔧 Rebuilding indexes...');
    try {
      await Attendance.collection.dropIndexes();
      console.log('   ✅ Dropped old attendance indexes');
    } catch (error) {
      console.log('   ℹ️  No old indexes to drop');
    }

    try {
      await Performance.collection.dropIndexes();
      console.log('   ✅ Dropped old performance indexes');
    } catch (error) {
      console.log('   ℹ️  No old indexes to drop');
    }

    // Create new indexes (they will be created automatically on next model usage)
    await Attendance.createIndexes();
    await Performance.createIndexes();
    console.log('   ✅ Created new indexes');

    await mongoose.disconnect();
    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error migrating schemas:', error);
    process.exit(1);
  }
}

// Run migration
migrateSchemas();

