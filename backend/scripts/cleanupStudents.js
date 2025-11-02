const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('../models/Student');
const Class = require('../models/Class'); // Need to load Class model for populate

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const cleanupStudents = async () => {
  try {
    console.log('🔍 Checking current students count...');
    
    const totalStudents = await Student.countDocuments({});
    console.log(`📊 Total students in database: ${totalStudents}`);
    
    if (totalStudents <= 10) {
      console.log('✅ Database already has 10 or fewer students. No cleanup needed.');
      await mongoose.connection.close();
      return;
    }
    
    console.log('🎯 Selecting 10 diverse sample students...');
    
    // Get diverse students representing different situations
    // Strategy: Get 2-3 from each risk level, ensuring gender diversity and class diversity
    
    const selectedIds = [];
    
    // 1. Low risk students (2 students - 1 male, 1 female, different classes if possible)
    const lowRiskStudents = await Student.find({ riskLevel: 'LOW', isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    const lowRiskMale = lowRiskStudents.find(s => s.gender === 'M');
    const lowRiskFemale = lowRiskStudents.find(s => s.gender === 'F');
    if (lowRiskMale) selectedIds.push(lowRiskMale._id);
    if (lowRiskFemale && selectedIds.length < 10) selectedIds.push(lowRiskFemale._id);
    
    // 2. Medium risk students (2 students - 1 male, 1 female, different classes if possible)
    const mediumRiskStudents = await Student.find({ riskLevel: 'MEDIUM', isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    const mediumRiskMale = mediumRiskStudents.find(s => s.gender === 'M' && !selectedIds.includes(s._id));
    const mediumRiskFemale = mediumRiskStudents.find(s => s.gender === 'F' && !selectedIds.includes(s._id));
    if (mediumRiskMale && selectedIds.length < 10) selectedIds.push(mediumRiskMale._id);
    if (mediumRiskFemale && selectedIds.length < 10) selectedIds.push(mediumRiskFemale._id);
    
    // 3. High risk students (2 students - 1 male, 1 female, different classes if possible)
    const highRiskStudents = await Student.find({ riskLevel: 'HIGH', isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    const highRiskMale = highRiskStudents.find(s => s.gender === 'M' && !selectedIds.includes(s._id));
    const highRiskFemale = highRiskStudents.find(s => s.gender === 'F' && !selectedIds.includes(s._id));
    if (highRiskMale && selectedIds.length < 10) selectedIds.push(highRiskMale._id);
    if (highRiskFemale && selectedIds.length < 10) selectedIds.push(highRiskFemale._id);
    
    // 4. Critical risk students (up to 2 if available)
    const criticalRiskStudents = await Student.find({ riskLevel: 'CRITICAL', isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    criticalRiskStudents.forEach(student => {
      if (selectedIds.length < 10 && !selectedIds.includes(student._id)) {
        selectedIds.push(student._id);
      }
    });
    
    // 5. Fill remaining slots ensuring class and gender diversity
    const selectedClassIds = new Set();
    const selectedStudentsInfo = await Student.find({ _id: { $in: selectedIds } })
      .select('classId gender')
      .lean();
    selectedStudentsInfo.forEach(s => {
      if (s.classId) selectedClassIds.add(s.classId.toString());
    });
    
    const additionalNeeded = 10 - selectedIds.length;
    if (additionalNeeded > 0) {
      // Get students from different classes and genders
      const additionalStudents = await Student.aggregate([
        { $match: { _id: { $nin: selectedIds }, isActive: true } },
        { $sort: { createdAt: -1 } },
        { $limit: 50 }
      ]);
      
      // Prioritize students from classes we don't have yet
      const prioritizedStudents = additionalStudents.sort((a, b) => {
        const aClassNew = !selectedClassIds.has(a.classId?.toString());
        const bClassNew = !selectedClassIds.has(b.classId?.toString());
        if (aClassNew && !bClassNew) return -1;
        if (!aClassNew && bClassNew) return 1;
        return 0;
      });
      
      prioritizedStudents.forEach(student => {
        if (selectedIds.length < 10) {
          selectedIds.push(student._id);
          if (student.classId) selectedClassIds.add(student.classId.toString());
        }
      });
    }
    
    console.log(`✅ Selected ${selectedIds.length} students to keep:`);
    
    // Display selected students info
    const selectedStudents = await Student.find({ _id: { $in: selectedIds } })
      .populate('classId', 'className')
      .select('firstName lastName gender riskLevel className');
    
    selectedStudents.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.firstName} ${student.lastName} (${student.gender === 'M' ? 'Male' : 'Female'}) - ${student.riskLevel} Risk - ${student.classId?.className || 'No Class'}`);
    });
    
    // Delete all other students
    const deleteResult = await Student.deleteMany({
      _id: { $nin: selectedIds },
      isActive: true
    });
    
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} students`);
    console.log(`✅ Database now contains ${selectedIds.length} students`);
    
    // Verify final count
    const finalCount = await Student.countDocuments({ isActive: true });
    console.log(`📊 Final students count: ${finalCount}`);
    
    console.log('✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the cleanup
cleanupStudents();

