const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await School.deleteMany({});
    await User.deleteMany({});
    await Student.deleteMany({});

    // Create school
    const school = new School({
      name: 'EduGuard Demo School',
      address: {
        street: '123 Education Street',
        city: 'Learning City',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      contact: {
        phone: '+1-555-0123',
        email: 'info@eduguard-demo.edu',
        website: 'https://eduguard-demo.edu'
      }
    });
    await school.save();
    console.log('✅ School created');

    // Create admin user
    const admin = new User({
      email: 'admin@eduguard.com',
      password: 'admin123',
      name: 'System Administrator',
      role: 'ADMIN',
      schoolId: school._id,
      phone: '+15550001'
    });
    await admin.save();
    console.log('✅ Admin user created');

    // Create teacher users
    const teachers = [
      {
        email: 'teacher1@eduguard.com',
        password: 'teacher123',
        name: 'Sarah Johnson',
        role: 'TEACHER',
        schoolId: school._id,
        phone: '+15550002'
      },
      {
        email: 'teacher2@eduguard.com',
        password: 'teacher123',
        name: 'Michael Chen',
        role: 'TEACHER',
        schoolId: school._id,
        phone: '+15550003'
      }
    ];

    const createdTeachers = [];
    for (const teacherData of teachers) {
      const teacher = new User(teacherData);
      await teacher.save();
      createdTeachers.push(teacher);
      console.log(`✅ Teacher ${teacherData.name} created`);
    }

    // Create parent users
    const parents = [
      {
        email: 'parent1@example.com',
        password: 'parent123',
        name: 'John Wilson',
        role: 'PARENT',
        schoolId: school._id,
        phone: '+15550004'
      },
      {
        email: 'parent2@example.com',
        password: 'parent123',
        name: 'Lisa Smith',
        role: 'PARENT',
        schoolId: school._id,
        phone: '+15550005'
      }
    ];

    const createdParents = [];
    for (const parentData of parents) {
      const parent = new User(parentData);
      await parent.save();
      createdParents.push(parent);
      console.log(`✅ Parent ${parentData.name} created`);
    }

    // Create students
    const students = [
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        gender: 'F',
        dob: new Date('2008-03-15'),
        schoolId: school._id,
        classroomId: 'Grade 10A',
        assignedTeacherId: createdTeachers[0]._id,
        guardianContacts: [{
          name: 'John Wilson',
          relation: 'Father',
          phone: '+15550004',
          email: 'parent1@example.com',
          isPrimary: true
        }],
        riskLevel: 'LOW',
        riskFlags: []
      },
      {
        firstName: 'Alex',
        lastName: 'Wilson',
        gender: 'M',
        dob: new Date('2009-07-22'),
        schoolId: school._id,
        classroomId: 'Grade 8B',
        assignedTeacherId: createdTeachers[1]._id,
        guardianContacts: [{
          name: 'John Wilson',
          relation: 'Father',
          phone: '+15550004',
          email: 'parent1@example.com',
          isPrimary: true
        }],
        riskLevel: 'MEDIUM',
        riskFlags: [{
          type: 'ATTENDANCE',
          description: 'Multiple absences in the last month',
          severity: 'MEDIUM',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          isResolved: false
        }]
      },
      {
        firstName: 'Sophia',
        lastName: 'Smith',
        gender: 'F',
        dob: new Date('2007-11-08'),
        schoolId: school._id,
        classroomId: 'Grade 10A',
        assignedTeacherId: createdTeachers[0]._id,
        guardianContacts: [{
          name: 'Lisa Smith',
          relation: 'Mother',
          phone: '+15550005',
          email: 'parent2@example.com',
          isPrimary: true
        }],
        riskLevel: 'HIGH',
        riskFlags: [{
          type: 'PERFORMANCE',
          description: 'Significant drop in mathematics grades',
          severity: 'HIGH',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isResolved: false
        }, {
          type: 'ATTENDANCE',
          description: 'Frequent tardiness',
          severity: 'MEDIUM',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          isResolved: false
        }]
      },
      {
        firstName: 'James',
        lastName: 'Brown',
        gender: 'M',
        dob: new Date('2008-05-12'),
        schoolId: school._id,
        classroomId: 'Grade 10B',
        assignedTeacherId: createdTeachers[1]._id,
        guardianContacts: [{
          name: 'Robert Brown',
          relation: 'Father',
          phone: '+15550006',
          email: 'robert.brown@example.com',
          isPrimary: true
        }],
        riskLevel: 'LOW',
        riskFlags: []
      }
    ];

    for (const studentData of students) {
      const student = new Student(studentData);
      await student.save();
      console.log(`✅ Student ${studentData.firstName} ${studentData.lastName} created`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@eduguard.com / admin123');
    console.log('Teacher 1: teacher1@eduguard.com / teacher123');
    console.log('Teacher 2: teacher2@eduguard.com / teacher123');
    console.log('Parent 1: parent1@example.com / parent123');
    console.log('Parent 2: parent2@example.com / parent123');
    console.log('\n🔗 Frontend URL: http://localhost:5173');
    console.log('🔗 Backend URL: http://localhost:3000/api');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
