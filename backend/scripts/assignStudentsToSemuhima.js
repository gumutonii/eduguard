const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const Student = require('../models/Student');

async function assignStudentsToSemuhima() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('🔍 Assigning students to Semuhima Teacher...');

    // Find Semuhima Teacher
    const semuhima = await User.findOne({ email: 'semuhima@gmail.com' });
    if (!semuhima) {
      console.log('❌ Semuhima Teacher not found');
      return;
    }

    console.log(`✅ Found: ${semuhima.name} (${semuhima.email})`);
    console.log(`📚 Assigned class: ${semuhima.className}`);

    // Get current students in his class
    const currentStudents = await Student.find({ assignedTeacher: semuhima._id });
    console.log(`👥 Current students in his class: ${currentStudents.length}`);

    // Get 10 students from other classes to move to his class
    const studentsToMove = await Student.find({ 
      assignedTeacher: { $ne: semuhima._id },
      isActive: true 
    }).limit(10);

    console.log(`\n🔄 Moving ${studentsToMove.length} students to Semuhima's class...`);

    for (const student of studentsToMove) {
      await Student.findByIdAndUpdate(student._id, {
        assignedTeacher: semuhima._id,
        classId: semuhima.assignedClasses[0] // Use his assigned class
      });
      console.log(`✅ Moved: ${student.firstName} ${student.lastName} (${student.studentId})`);
    }

    // Verify the assignment
    const finalStudents = await Student.find({ assignedTeacher: semuhima._id });
    console.log(`\n🎉 Final count: ${finalStudents.length} students in Semuhima class`);
    
    console.log('\n📋 Students in Semuhima class:');
    finalStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.firstName} ${student.lastName} (${student.studentId})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

assignStudentsToSemuhima();
