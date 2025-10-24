const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});

    // Create Super Admin user
    const superAdmin = new User({
      email: 'admin@eduguard.com',
      password: 'admin123',
      name: 'EduGuard Super Admin',
      role: 'SUPER_ADMIN',
      phone: '+250788000000',
      schoolName: 'EduGuard System',
      schoolDistrict: 'Kigali City',
      schoolSector: 'Nyarugenge',
      isApproved: true,
      isActive: true,
      emailVerified: true
    });
    await superAdmin.save();
    console.log('✅ Super Admin user created');

    // Create admin users
    const admins = [
      {
        email: 'headmaster@school1.edu',
        password: 'admin123',
        name: 'Dr. Jean Baptiste',
        role: 'ADMIN',
        phone: '+250788111111',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        schoolPhone: '+250788222222',
        schoolEmail: 'info@school1.edu',
        isApproved: true,
        isActive: true
      },
      {
        email: 'director@school2.edu',
        password: 'admin123',
        name: 'Mrs. Marie Claire',
        role: 'ADMIN',
        phone: '+250788333333',
        schoolName: 'Ecole Primaire de Butare',
        schoolDistrict: 'Huye',
        schoolSector: 'Butare',
        schoolPhone: '+250788444444',
        schoolEmail: 'info@school2.edu',
        isApproved: true,
        isActive: true
      }
    ];

    const createdAdmins = [];
    for (const adminData of admins) {
      const admin = new User(adminData);
      await admin.save();
      createdAdmins.push(admin);
      console.log(`✅ Admin ${adminData.name} created`);
    }

    // Create teacher users
    const teachers = [
      {
        email: 'teacher1@school1.edu',
        password: 'teacher123',
        name: 'Mr. Paul Nkurunziza',
        role: 'TEACHER',
        phone: '+250788555555',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        className: 'S6 PCB',
        classGrade: 'S6',
        classSection: 'PCB',
        isApproved: true,
        isActive: true
      },
      {
        email: 'teacher2@school1.edu',
        password: 'teacher123',
        name: 'Ms. Grace Mukamana',
        role: 'TEACHER',
        phone: '+250788666666',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        className: 'P6 A',
        classGrade: 'P6',
        classSection: 'A',
        isApproved: true,
        isActive: true
      },
      {
        email: 'teacher3@school2.edu',
        password: 'teacher123',
        name: 'Mr. Jean Claude',
        role: 'TEACHER',
        phone: '+250788777777',
        schoolName: 'Ecole Primaire de Butare',
        schoolDistrict: 'Huye',
        schoolSector: 'Butare',
        className: 'P5 B',
        classGrade: 'P5',
        classSection: 'B',
        isApproved: false, // Pending approval
        isActive: true
      }
    ];

    const createdTeachers = [];
    for (const teacherData of teachers) {
      const teacher = new User(teacherData);
      await teacher.save();
      createdTeachers.push(teacher);
      console.log(`✅ Teacher ${teacherData.name} created`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 1 Super Admin`);
    console.log(`   - ${createdAdmins.length} Admins`);
    console.log(`   - ${createdTeachers.length} Teachers`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

seedData();