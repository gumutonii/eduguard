const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const Class = require('../models/Class');

async function assignTeachersToClasses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('Connected to MongoDB');

    // Get all teachers without class assignments
    const unassignedTeachers = await User.find({ 
      role: 'TEACHER', 
      $or: [
        { className: { $exists: false } },
        { className: null },
        { className: '' }
      ]
    });

    // Get all classes without assigned teachers
    const unassignedClasses = await Class.find({ 
      assignedTeacher: { $exists: false } 
    });

    console.log(`Found ${unassignedTeachers.length} unassigned teachers`);
    console.log(`Found ${unassignedClasses.length} unassigned classes`);

    if (unassignedTeachers.length === 0) {
      console.log('All teachers are already assigned to classes!');
      return;
    }

    if (unassignedClasses.length === 0) {
      console.log('No available classes for assignment. Creating more classes...');
      
      // Find a school to create classes for
      const school = await Class.findOne().populate('schoolId');
      if (!school) {
        console.error('No schools found. Cannot create classes.');
        return;
      }

      const creator = await User.findOne({ role: 'SUPER_ADMIN' });
      if (!creator) {
        console.error('No super admin found. Cannot create classes.');
        return;
      }

      // Create additional classes
      const additionalClasses = [
        { className: 'P3A', grade: 'P3', section: 'A', schoolId: school.schoolId._id, studentCount: 26, createdBy: creator._id },
        { className: 'P4B', grade: 'P4', section: 'B', schoolId: school.schoolId._id, studentCount: 29, createdBy: creator._id },
        { className: 'P5C', grade: 'P5', section: 'C', schoolId: school.schoolId._id, studentCount: 31, createdBy: creator._id },
        { className: 'P6A', grade: 'P6', section: 'A', schoolId: school.schoolId._id, studentCount: 28, createdBy: creator._id },
        { className: 'S4A', grade: 'S4', section: 'A', schoolId: school.schoolId._id, studentCount: 33, createdBy: creator._id },
        { className: 'S5B', grade: 'S5', section: 'B', schoolId: school.schoolId._id, studentCount: 30, createdBy: creator._id },
        { className: 'S6C', grade: 'S6', section: 'C', schoolId: school.schoolId._id, studentCount: 27, createdBy: creator._id }
      ];

      for (const classData of additionalClasses) {
        const newClass = new Class(classData);
        await newClass.save();
        console.log(`✅ Created class: ${newClass.className}`);
      }

      // Refresh unassigned classes
      const newUnassignedClasses = await Class.find({ 
        assignedTeacher: { $exists: false } 
      });
      unassignedClasses.push(...newUnassignedClasses);
    }

    // Assign classes to teachers
    console.log('\nAssigning classes to teachers...');
    const minAssignments = Math.min(unassignedTeachers.length, unassignedClasses.length);
    
    for (let i = 0; i < minAssignments; i++) {
      const teacher = unassignedTeachers[i];
      const assignedClass = unassignedClasses[i];
      
      // Update teacher with class assignment
      await User.findByIdAndUpdate(teacher._id, {
        className: assignedClass.className,
        classGrade: assignedClass.grade,
        classSection: assignedClass.section,
        assignedClasses: [assignedClass._id]
      });

      // Update class with assigned teacher
      await Class.findByIdAndUpdate(assignedClass._id, {
        assignedTeacher: teacher._id
      });

      console.log(`✅ Assigned ${assignedClass.className} to ${teacher.name}`);
    }

    // If there are more teachers than classes, assign multiple classes to teachers
    if (unassignedTeachers.length > unassignedClasses.length) {
      const remainingTeachers = unassignedTeachers.slice(unassignedClasses.length);
      const allClasses = await Class.find();
      
      for (let i = 0; i < remainingTeachers.length; i++) {
        const teacher = remainingTeachers[i];
        const classIndex = i % allClasses.length; // Cycle through available classes
        const assignedClass = allClasses[classIndex];
        
        // Add class to teacher's assigned classes
        await User.findByIdAndUpdate(teacher._id, {
          $addToSet: { assignedClasses: assignedClass._id },
          className: assignedClass.className,
          classGrade: assignedClass.grade,
          classSection: assignedClass.section
        });

        console.log(`✅ Assigned ${assignedClass.className} to ${teacher.name} (additional class)`);
      }
    }

    console.log('\n✅ All teachers assigned to classes successfully!');
    
    // Show final assignments
    console.log('\n📚 Final Class Assignments:');
    const allTeachers = await User.find({ role: 'TEACHER' });
    allTeachers.forEach(teacher => {
      if (teacher.className) {
        console.log(`- ${teacher.name}: ${teacher.className} (${teacher.teacherTitle || 'Teacher'})`);
      } else {
        console.log(`- ${teacher.name}: NO CLASS ASSIGNED`);
      }
    });

  } catch (error) {
    console.error('Error assigning teachers to classes:', error);
  } finally {
    await mongoose.disconnect();
  }
}

assignTeachersToClasses();
