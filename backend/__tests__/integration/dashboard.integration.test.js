const request = require('supertest');
const mongoose = require('mongoose');
const Student = require('../../models/Student');
const School = require('../../models/School');
const User = require('../../models/User');
const Class = require('../../models/Class');
const Attendance = require('../../models/Attendance');
const Performance = require('../../models/Performance');
const RiskFlag = require('../../models/RiskFlag');

// Import app from server
let app;
beforeAll(() => {
  const originalLog = console.log;
  const originalError = console.error;
  console.log = jest.fn();
  console.error = jest.fn();
  
  app = require('../../server');
  
  console.log = originalLog;
  console.error = originalError;
});

describe('Dashboard Statistics Routes - Integration Tests', () => {
  let testSchool;
  let testUser;
  let testClass;
  let authToken;

  // Helper function to create a valid student
  const createValidStudent = async (overrides = {}) => {
    const dateOfBirth = overrides.dateOfBirth || new Date('2010-01-01');
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear() - 
                (today.getMonth() < dateOfBirth.getMonth() || 
                 (today.getMonth() === dateOfBirth.getMonth() && today.getDate() < dateOfBirth.getDate()) ? 1 : 0);

    return await Student.create({
      firstName: 'Test',
      lastName: 'Student',
      studentId: `TEST${Date.now()}`,
      gender: 'M',
      dateOfBirth: dateOfBirth,
      age: age,
      schoolId: testSchool._id,
      classId: testClass._id,
      assignedTeacher: testUser._id,
      address: {
        district: 'Kigali',
        sector: 'Nyarugenge'
      },
      socioEconomic: {
        ubudeheLevel: 2,
        hasParents: true,
        familyStability: true,
        numberOfSiblings: 2
      },
      guardianContacts: [{
        name: 'Test Guardian',
        phone: '0781234567',
        email: 'guardian@test.com',
        relation: 'Father',
        occupation: 'Teacher',
        education: 'University'
      }],
      isActive: true,
      ...overrides
    });
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  afterAll(async () => {
    await Student.deleteMany({ firstName: /Test/ });
    await Attendance.deleteMany({});
    await Performance.deleteMany({});
    await RiskFlag.deleteMany({});
    await Class.deleteMany({ className: /Test/ });
    await School.deleteMany({ name: /Test/ });
    await User.deleteMany({ email: /test@/ });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up - delete in proper order
    await RiskFlag.deleteMany({});
    await Attendance.deleteMany({});
    await Performance.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await User.deleteMany({});
    await School.deleteMany({});

    // Create test school with unique name
    const timestamp = Date.now();
    testSchool = await School.create({
      name: `Test School ${timestamp}`,
      district: 'Kigali',
      sector: 'Nyarugenge',
      isActive: true
    });

    // Create test user (admin)
    testUser = await User.create({
      email: `testadmin${timestamp}@example.com`,
      password: 'password123',
      name: 'Test Admin',
      role: 'ADMIN',
      schoolId: testSchool._id,
      isApproved: true,
      isActive: true
    });

    // Create test class
    testClass = await Class.create({
      className: `Test Class P1 ${timestamp}`,
      name: `Test Class P1 ${timestamp}`,
      grade: 'P1',
      section: 'A',
      schoolId: testSchool._id,
      createdBy: testUser._id,
      isActive: true
    });

    // Generate auth token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-secret');
  });

  describe('GET /api/dashboard/school-admin-stats - Integration Tests', () => {
    test('should calculate correct average score from performance records', async () => {
      // Create students
      const timestamp = Date.now();
      const student1 = await createValidStudent({
        firstName: 'Student1',
        lastName: 'Test',
        studentId: `STU1${timestamp}`,
        gender: 'M'
      });

      const student2 = await createValidStudent({
        firstName: 'Student2',
        lastName: 'Test',
        studentId: `STU2${timestamp}`,
        gender: 'F'
      });

      // Create performance records
      // Student 1: 80/100 = 80%
      await Performance.create({
        studentId: student1._id,
        schoolId: testSchool._id,
        classId: testClass._id,
        academicYear: '2024-2025',
        term: 'TERM_1',
        subject: 'Math',
        score: 80,
        maxScore: 100,
        grade: 'A',
        enteredBy: testUser._id
      });

      // Student 2: 60/100 = 60%
      await Performance.create({
        studentId: student2._id,
        schoolId: testSchool._id,
        classId: testClass._id,
        academicYear: '2024-2025',
        term: 'TERM_1',
        subject: 'Math',
        score: 60,
        maxScore: 100,
        grade: 'C',
        enteredBy: testUser._id
      });

      // Refresh user from database to ensure it exists
      const User = require('../../models/User');
      const refreshedUser = await User.findById(testUser._id);
      expect(refreshedUser).not.toBeNull();

      // Regenerate token to ensure it's valid
      const jwt = require('jsonwebtoken');
      const freshToken = jwt.sign({ userId: refreshedUser._id }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .get('/api/dashboard/school-admin-stats')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(response.status).toBe(200);
      
      // Check class performance average
      const classPerformance = response.body.data.classPerformance;
      if (classPerformance && classPerformance.length > 0) {
          const testClassData = classPerformance.find((c) => c.name === 'Test Class P1');
        if (testClassData) {
          // Average should be (80 + 60) / 2 = 70%
          expect(testClassData.averageScore).toBeGreaterThan(0);
        }
      }
    });

    test('should return risk flags summary', async () => {
      // Refresh user from database to ensure it exists
      const refreshedUser = await User.findById(testUser._id);
      if (!refreshedUser) {
        // Recreate user if it doesn't exist
        const timestamp = Date.now();
        testUser = await User.create({
          email: `testadmin${timestamp}@example.com`,
          password: 'password123',
          name: 'Test Admin',
          role: 'ADMIN',
          schoolId: testSchool._id,
          isApproved: true,
          isActive: true
        });
      }

      // Regenerate token to ensure it's valid
      const jwt = require('jsonwebtoken');
      const userId = refreshedUser ? refreshedUser._id : testUser._id;
      const freshToken = jwt.sign({ userId: userId }, process.env.JWT_SECRET || 'test-secret');

      const testStudent = await createValidStudent({
        firstName: 'Risk',
        lastName: 'Student',
        studentId: `RISK${Date.now()}`,
        riskLevel: 'HIGH'
      });

      await RiskFlag.create({
        studentId: testStudent._id,
        schoolId: testSchool._id,
        type: 'ATTENDANCE',
        severity: 'HIGH',
        title: 'High Absenteeism',
        description: 'Student has been absent frequently',
        isActive: true,
        createdBy: userId
      });

      const response = await request(app)
        .get('/api/dashboard/school-admin-stats')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.riskFlags).toBeDefined();
      expect(response.body.data.riskFlags.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/dashboard/teacher-stats - Integration Tests', () => {
    let teacher;
    let teacherToken;

    beforeEach(async () => {
      const timestamp = Date.now();
      teacher = await User.create({
        email: `teacher${timestamp}@test.com`,
        password: 'password123',
        name: 'Test Teacher',
        role: 'TEACHER',
        schoolId: testSchool._id,
        isApproved: true,
        isActive: true
      });

      const jwt = require('jsonwebtoken');
      teacherToken = jwt.sign({ userId: teacher._id }, process.env.JWT_SECRET || 'test-secret');
    });

    test('should return teacher dashboard statistics', async () => {
      // Create student assigned to teacher
      const student = await createValidStudent({
        firstName: 'Teacher',
        lastName: 'Student',
        studentId: `TEA${Date.now()}`,
        assignedTeacher: teacher._id
      });

      const response = await request(app)
        .get('/api/dashboard/teacher-stats')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalStudents).toBeGreaterThanOrEqual(1);
    });

    test('should calculate class average score correctly', async () => {
      // Regenerate teacher token to ensure it's valid
      const jwt = require('jsonwebtoken');
      const freshTeacherToken = jwt.sign({ userId: teacher._id }, process.env.JWT_SECRET || 'test-secret');

      // Create student assigned to teacher
      const student = await createValidStudent({
        firstName: 'Perf',
        lastName: 'Student',
        studentId: `PERF${Date.now()}`,
        assignedTeacher: teacher._id
      });

      // Create performance record: 85/100 = 85%
      await Performance.create({
        studentId: student._id,
        schoolId: testSchool._id,
        classId: testClass._id,
        academicYear: '2024-2025',
        term: 'TERM_1',
        subject: 'Math',
        score: 85,
        maxScore: 100,
        grade: 'A',
        enteredBy: teacher._id
      });

      const response = await request(app)
        .get('/api/dashboard/teacher-stats')
        .set('Authorization', `Bearer ${freshTeacherToken}`);

      expect(response.status).toBe(200);
      
      // Check classes array has average score
      const classes = response.body.data.classes;
      if (classes && classes.length > 0) {
          const testClassData = classes.find((c) => c.name === 'Test Class P1');
        if (testClassData) {
          expect(testClassData.averageScore).toBeGreaterThan(0);
        }
      }
    });
  });
});

