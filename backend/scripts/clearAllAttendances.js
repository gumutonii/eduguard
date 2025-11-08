const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
require('dotenv').config();

async function clearAllAttendances() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('✅ Connected to MongoDB');

    const totalRecords = await Attendance.countDocuments();
    console.log(`📊 Total attendance records: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('📌 No attendance records to delete.');
      return;
    }

    // Delete all attendance records
    const deleteResult = await Attendance.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} attendance records`);

    const finalCount = await Attendance.countDocuments();
    console.log(`✅ Final attendance records: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error clearing attendances:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
    console.log('✨ Cleanup completed successfully!');
  }
}

clearAllAttendances();

