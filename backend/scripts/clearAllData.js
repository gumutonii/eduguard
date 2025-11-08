const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
require('dotenv').config();

async function clearAllData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('✅ Connected to MongoDB');

    // Clear Attendance collection
    const attendanceCount = await Attendance.countDocuments();
    console.log(`📊 Total attendance records: ${attendanceCount}`);
    if (attendanceCount > 0) {
      const attendanceDeleteResult = await Attendance.deleteMany({});
      console.log(`🗑️  Deleted ${attendanceDeleteResult.deletedCount} attendance records`);
    } else {
      console.log('📌 No attendance records to delete');
    }

    // Clear Performance collection
    const performanceCount = await Performance.countDocuments();
    console.log(`📊 Total performance records: ${performanceCount}`);
    if (performanceCount > 0) {
      const performanceDeleteResult = await Performance.deleteMany({});
      console.log(`🗑️  Deleted ${performanceDeleteResult.deletedCount} performance records`);
    } else {
      console.log('📌 No performance records to delete');
    }

    // Verify deletion
    const finalAttendanceCount = await Attendance.countDocuments();
    const finalPerformanceCount = await Performance.countDocuments();
    console.log(`✅ Final attendance records: ${finalAttendanceCount}`);
    console.log(`✅ Final performance records: ${finalPerformanceCount}`);

  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
    console.log('✨ Cleanup completed successfully!');
  }
}

clearAllData();

