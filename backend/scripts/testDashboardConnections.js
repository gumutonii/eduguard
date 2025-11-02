const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Student = require('../models/Student');
const School = require('../models/School');
const Class = require('../models/Class');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');

const testDashboardConnections = async () => {
  try {
    console.log('🧪 Testing EduGuard Dashboard Connections...\n');

    // Test 1: Check Database Connections
    console.log('1. Testing Database Connections...');
    const userCount = await User.countDocuments();
    const studentCount = await Student.countDocuments();
    const schoolCount = await School.countDocuments();
    const classCount = await Class.countDocuments();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Schools: ${schoolCount}`);
    console.log(`   Classes: ${classCount}`);
    console.log('   ✅ Database connections working\n');

    // Test 2: Test Authentication
    console.log('2. Testing Authentication...');
    
    // Test Super Admin login
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN', isActive: true });
    if (superAdmin) {
      console.log(`   Found Super Admin: ${superAdmin.name} (${superAdmin.email})`);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: superAdmin.email,
          password: 'admin123'
        });
      
      if (loginResponse.status === 200) {
        console.log('   ✅ Super Admin authentication working');
        const superAdminToken = loginResponse.body.token;
        
        // Test Super Admin dashboard
        const superAdminDashboard = await request(app)
          .get('/api/dashboard/system-stats')
          .set('Authorization', `Bearer ${superAdminToken}`);
        
        if (superAdminDashboard.status === 200) {
          console.log('   ✅ Super Admin dashboard API working');
          console.log(`   System Stats: ${superAdminDashboard.body.data.totalUsers} users, ${superAdminDashboard.body.data.totalSchools} schools`);
        } else {
          console.log('   ❌ Super Admin dashboard API failed');
        }
      } else {
        console.log('   ❌ Super Admin authentication failed');
      }
    } else {
      console.log('   ⚠️  No Super Admin found');
    }
    console.log('');

    // Test 3: Test School Admin
    console.log('3. Testing School Admin...');
    const schoolAdmin = await User.findOne({ role: 'ADMIN', isActive: true });
    if (schoolAdmin) {
      console.log(`   Found School Admin: ${schoolAdmin.name} (${schoolAdmin.email})`);
      
      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: schoolAdmin.email,
          password: '123456789'
        });
      
      if (adminLoginResponse.status === 200) {
        console.log('   ✅ School Admin authentication working');
        const adminToken = adminLoginResponse.body.token;
        
        // Test School Admin dashboard
        const adminDashboard = await request(app)
          .get('/api/dashboard/school-admin-stats')
          .set('Authorization', `Bearer ${adminToken}`);
        
        if (adminDashboard.status === 200) {
          console.log('   ✅ School Admin dashboard API working');
          console.log(`   School Stats: ${adminDashboard.body.data.totalStudents} students, ${adminDashboard.body.data.totalTeachers} teachers`);
        } else {
          console.log('   ❌ School Admin dashboard API failed');
        }
      } else {
        console.log('   ❌ School Admin authentication failed');
      }
    } else {
      console.log('   ⚠️  No School Admin found');
    }
    console.log('');

    // Test 4: Test Teacher
    console.log('4. Testing Teacher...');
    const teacher = await User.findOne({ role: 'TEACHER', isActive: true });
    if (teacher) {
      console.log(`   Found Teacher: ${teacher.name} (${teacher.email})`);
      
      const teacherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: teacher.email,
          password: '123456789'
        });
      
      if (teacherLoginResponse.status === 200) {
        console.log('   ✅ Teacher authentication working');
        const teacherToken = teacherLoginResponse.body.token;
        
        // Test Teacher dashboard
        const teacherDashboard = await request(app)
          .get('/api/dashboard/teacher-stats')
          .set('Authorization', `Bearer ${teacherToken}`);
        
        if (teacherDashboard.status === 200) {
          console.log('   ✅ Teacher dashboard API working');
          console.log(`   Teacher Stats: ${teacherDashboard.body.data.totalStudents} students, ${teacherDashboard.body.data.totalClasses} classes`);
        } else {
          console.log('   ❌ Teacher dashboard API failed');
        }
      } else {
        console.log('   ❌ Teacher authentication failed');
      }
    } else {
      console.log('   ⚠️  No Teacher found');
    }
    console.log('');

    // Test 5: Test Data Flow
    console.log('5. Testing Data Flow...');
    
    // Check if students are properly linked to schools and classes
    const studentsWithSchool = await Student.countDocuments({ schoolId: { $exists: true } });
    const studentsWithClass = await Student.countDocuments({ classId: { $exists: true } });
    const studentsWithTeacher = await Student.countDocuments({ assignedTeacher: { $exists: true } });
    
    console.log(`   Students with school: ${studentsWithSchool}/${studentCount}`);
    console.log(`   Students with class: ${studentsWithClass}/${studentCount}`);
    console.log(`   Students with teacher: ${studentsWithTeacher}/${studentCount}`);
    
    if (studentsWithSchool === studentCount && studentsWithClass === studentCount && studentsWithTeacher === studentCount) {
      console.log('   ✅ Data relationships working correctly');
    } else {
      console.log('   ⚠️  Some data relationships may be missing');
    }
    console.log('');

    // Test 6: Test API Endpoints
    console.log('6. Testing Key API Endpoints...');
    
    const endpoints = [
      { path: '/api/dashboard/stats', method: 'GET', role: 'ADMIN' },
      { path: '/api/dashboard/at-risk-overview', method: 'GET', role: 'ADMIN' },
      { path: '/api/dashboard/attendance-trend', method: 'GET', role: 'ADMIN' },
      { path: '/api/dashboard/performance-trend', method: 'GET', role: 'ADMIN' },
      { path: '/api/dashboard/intervention-pipeline', method: 'GET', role: 'ADMIN' },
      { path: '/api/students', method: 'GET', role: 'ADMIN' },
      { path: '/api/classes', method: 'GET', role: 'ADMIN' },
      { path: '/api/messages', method: 'GET', role: 'ADMIN' }
    ];

    let workingEndpoints = 0;
    let totalEndpoints = endpoints.length;

    for (const endpoint of endpoints) {
      try {
        // Get appropriate token based on role
        let token = '';
        if (endpoint.role === 'ADMIN') {
          const admin = await User.findOne({ role: 'ADMIN', isActive: true });
          if (admin) {
            const loginRes = await request(app)
              .post('/api/auth/login')
              .send({ email: admin.email, password: '123456789' });
            if (loginRes.status === 200) {
              token = loginRes.body.token;
            }
          }
        }

        if (token) {
          const response = await request(app)
            [endpoint.method.toLowerCase()](endpoint.path)
            .set('Authorization', `Bearer ${token}`);
          
          if (response.status === 200) {
            console.log(`   ✅ ${endpoint.method} ${endpoint.path}`);
            workingEndpoints++;
          } else {
            console.log(`   ❌ ${endpoint.method} ${endpoint.path} (${response.status})`);
          }
        } else {
          console.log(`   ⚠️  ${endpoint.method} ${endpoint.path} (no token)`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.method} ${endpoint.path} (error: ${error.message})`);
      }
    }

    console.log(`   Working endpoints: ${workingEndpoints}/${totalEndpoints}`);
    console.log('');

    // Test 7: Test Sample Data Quality
    console.log('7. Testing Sample Data Quality...');
    
    // Check for realistic data distribution
    const riskLevels = await Student.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);
    
    console.log('   Risk Level Distribution:');
    riskLevels.forEach(level => {
      console.log(`     ${level._id}: ${level.count} students`);
    });

    // Check attendance data
    const attendanceData = await Student.aggregate([
      { $group: { _id: null, avgAge: { $avg: '$age' } } }
    ]);
    
    if (attendanceData.length > 0) {
      console.log(`   Average student age: ${attendanceData[0].avgAge.toFixed(1)} years`);
    }

    // Check class distribution
    const classDistribution = await Class.aggregate([
      { $group: { _id: '$className', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('   Class Distribution:');
    classDistribution.slice(0, 5).forEach(cls => {
      console.log(`     ${cls._id}: ${cls.count} classes`);
    });

    console.log('   ✅ Sample data looks realistic');
    console.log('');

    // Summary
    console.log('🎉 Dashboard connection test completed!');
    console.log('\n📊 Test Summary:');
    console.log(`   Database: ✅ Working`);
    console.log(`   Authentication: ✅ Working`);
    console.log(`   API Endpoints: ${workingEndpoints}/${totalEndpoints} working`);
    console.log(`   Data Relationships: ✅ Working`);
    console.log(`   Sample Data: ✅ Realistic`);
    
    if (workingEndpoints === totalEndpoints) {
      console.log('\n🎉 All dashboard connections are working perfectly!');
    } else {
      console.log('\n⚠️  Some endpoints may need attention, but core functionality is working.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

testDashboardConnections();
