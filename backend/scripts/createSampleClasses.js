const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Class = require('../models/Class');
const User = require('../models/User');
const School = require('../models/School');

async function createSampleClasses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('Connected to MongoDB');

    // Find a school to assign classes to
    const school = await School.findOne();
    if (!school) {
      console.error('No schools found in the database. Please ensure schools are seeded.');
      return;
    }

    console.log('Creating 5 new sample classes...');

    // Define the 5 new classes
    const sampleClasses = [
      {
        className: 'P1A',
        grade: 'P1',
        section: 'A',
        schoolId: school._id,
        studentCount: 25,
        isActive: true,
        description: 'Primary 1 Class A - Foundation level'
      },
      {
        className: 'P2B',
        grade: 'P2',
        section: 'B',
        schoolId: school._id,
        studentCount: 28,
        isActive: true,
        description: 'Primary 2 Class B - Basic level'
      },
      {
        className: 'S1A',
        grade: 'S1',
        section: 'A',
        schoolId: school._id,
        studentCount: 30,
        isActive: true,
        description: 'Secondary 1 Class A - Lower secondary'
      },
      {
        className: 'S2B',
        grade: 'S2',
        section: 'B',
        schoolId: school._id,
        studentCount: 27,
        isActive: true,
        description: 'Secondary 2 Class B - Lower secondary'
      },
      {
        className: 'S3C',
        grade: 'S3',
        section: 'C',
        schoolId: school._id,
        studentCount: 32,
        isActive: true,
        description: 'Secondary 3 Class C - Upper secondary'
      }
    ];

    // Create the classes
    const createdClasses = [];
    for (const classData of sampleClasses) {
      const newClass = new Class(classData);
      const savedClass = await newClass.save();
      createdClasses.push(savedClass);
      console.log(`✅ Created class: ${savedClass.className}`);
    }

    console.log('\nAssigning classes to teachers...');

    // Get all teachers
    const teachers = await User.find({ role: 'TEACHER' }).limit(5);
    
    if (teachers.length === 0) {
      console.log('No teachers found to assign classes to.');
      return;
    }

    // Assign classes to teachers
    for (let i = 0; i < Math.min(teachers.length, createdClasses.length); i++) {
      const teacher = teachers[i];
      const assignedClass = createdClasses[i];
      
      // Update teacher with class assignment
      await User.findByIdAndUpdate(teacher._id, {
        className: assignedClass.className,
        classGrade: assignedClass.grade,
        classSection: assignedClass.section
      });

      // Update class with assigned teacher
      await Class.findByIdAndUpdate(assignedClass._id, {
        assignedTeacher: teacher._id
      });

      console.log(`✅ Assigned ${assignedClass.className} to ${teacher.name}`);
    }

    // If there are more classes than teachers, assign remaining classes to available teachers
    if (createdClasses.length > teachers.length) {
      const remainingClasses = createdClasses.slice(teachers.length);
      for (let i = 0; i < remainingClasses.length; i++) {
        const classToAssign = remainingClasses[i];
        const teacherIndex = i % teachers.length; // Cycle through available teachers
        const teacher = teachers[teacherIndex];
        
        // Update teacher with additional class assignment
        await User.findByIdAndUpdate(teacher._id, {
          className: classToAssign.className,
          classGrade: classToAssign.grade,
          classSection: classToAssign.section
        });

        // Update class with assigned teacher
        await Class.findByIdAndUpdate(classToAssign._id, {
          assignedTeacher: teacher._id
        });

        console.log(`✅ Assigned ${classToAssign.className} to ${teacher.name}`);
      }
    }

    console.log('\n✅ All sample classes created and assigned successfully!');
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`- Created ${createdClasses.length} classes`);
    console.log(`- Assigned classes to ${teachers.length} teachers`);
    
    // Show class assignments
    console.log('\n📚 Class Assignments:');
    const updatedTeachers = await User.find({ role: 'TEACHER' }).populate('schoolId', 'name');
    updatedTeachers.forEach(teacher => {
      if (teacher.className) {
        console.log(`- ${teacher.name}: ${teacher.className} (${teacher.teacherTitle || 'Teacher'})`);
      }
    });

  } catch (error) {
    console.error('Error creating sample classes:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSampleClasses();
