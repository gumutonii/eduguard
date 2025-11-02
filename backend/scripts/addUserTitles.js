const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function addUserTitles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('Connected to MongoDB');

    console.log('Adding titles to existing users...');

    // Update Super Admin
    await User.findOneAndUpdate(
      { email: 'admin@eduguard.com' },
      { 
        adminTitle: 'System Administrator',
        teacherTitle: null 
      }
    );
    console.log('✅ Updated Super Admin title');

    // Update Admin users
    await User.updateMany(
      { role: 'ADMIN' },
      { 
        adminTitle: 'Head Teacher',
        teacherTitle: null 
      }
    );
    console.log('✅ Updated Admin titles to "Head Teacher"');

    // Update Teacher users with various titles
    const teacherTitles = [
      'Mathematics Teacher',
      'Physics Teacher',
      'Chemistry Teacher',
      'Biology Teacher',
      'English Teacher',
      'French Teacher',
      'History Teacher',
      'Geography Teacher',
      'Computer Science Teacher',
      'Physical Education Teacher',
      'Art Teacher',
      'Music Teacher'
    ];

    const teachers = await User.find({ role: 'TEACHER' });
    
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const title = teacherTitles[i % teacherTitles.length];
      
      await User.findByIdAndUpdate(teacher._id, {
        teacherTitle: title,
        adminTitle: null
      });
      
      console.log(`✅ Updated ${teacher.name} title to "${title}"`);
    }

    console.log('\nAll user titles have been added successfully!');

    // Verify the updates
    console.log('\nCurrent users with titles:');
    const allUsers = await User.find({}).select('name email role adminTitle teacherTitle');
    allUsers.forEach(user => {
      const title = user.adminTitle || user.teacherTitle || 'No title';
      console.log(`- ${user.name} (${user.email}) - ${user.role} - ${title}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error adding user titles:', error);
  }
}

addUserTitles();
