const request = require('supertest');
const mongoose = require('mongoose');
const Student = require('../../models/Student');
const School = require('../../models/School');
const User = require('../../models/User');
const Class = require('../../models/Class');

// Import app from server
let app;
beforeAll(() => {
  // Suppress console logs during tests
  const originalLog = console.log;
  const originalError = console.error;
  console.log = jest.fn();
  console.error = jest.fn();
  
  app = require('../../server');
  
  // Restore console after app loads
  console.log = originalLog;
  console.error = originalError;
});

describe('Student Management Routes - Integration Tests', () => {
  let testSchool;
  let testUser;
  let testClass;
  let authToken;
  let testStudent;

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
    await Class.deleteMany({ className: /Test/ });
    await School.deleteMany({ name: /Test/ });
    await User.deleteMany({ email: /test@/ });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up - delete in proper order
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

  describe('GET /api/students - Integration Tests', () => {
    test('should return list of students for authenticated admin', async () => {
      // Regenerate token to ensure it's valid
      const jwt = require('jsonwebtoken');
      const freshToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-secret');

      // Create test student with all required fields
      testStudent = await createValidStudent();

      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

