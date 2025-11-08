const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
require('dotenv').config();

async function cleanAttendances() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get total count
    const totalCount = await Attendance.countDocuments();
    console.log(`📊 Total attendance records: ${totalCount}`);

    if (totalCount <= 5) {
      console.log('ℹ️  Collection already has 5 or fewer records. No cleanup needed.');
      await mongoose.disconnect();
      return;
    }

    // Get 5 sample documents to keep
    const samplesToKeep = await Attendance.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id');
    
    const idsToKeep = samplesToKeep.map(doc => doc._id);
    console.log(`📌 Keeping ${idsToKeep.length} sample records`);

    // Delete all documents except the ones we want to keep
    const deleteResult = await Attendance.deleteMany({
      _id: { $nin: idsToKeep }
    });

    console.log(`🗑️  Deleted ${deleteResult.deletedCount} attendance records`);
    
    // Verify final count
    const finalCount = await Attendance.countDocuments();
    console.log(`✅ Final attendance records: ${finalCount}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('✨ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error cleaning attendances:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanAttendances();

