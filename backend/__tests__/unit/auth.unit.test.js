const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const School = require('../../models/School');

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

describe('Authentication Routes - Unit Tests', () => {
  let testUser;
  let testSchool;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: /test@/ });
    await School.deleteMany({ name: /Test School/ });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test - delete in proper order
    await User.deleteMany({});
    await School.deleteMany({});
  });

  describe('GET /api/auth/me - Unit Tests', () => {
    beforeEach(async () => {
      const timestamp = Date.now();
      testSchool = await School.create({
        name: `Test School ${timestamp}`,
        district: 'Kigali',
        sector: 'Nyarugenge',
        isActive: true
      });

      testUser = await User.create({
        email: `metest${timestamp}@example.com`,
        password: 'password123',
        name: 'Me Test User',
        role: 'ADMIN',
        schoolId: testSchool._id,
        isApproved: true,
        isActive: true
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      // Check if login was successful before accessing token
      if (loginResponse.status === 200 && loginResponse.body.success && loginResponse.body.data) {
        authToken = loginResponse.body.data.token;
      } else {
        // If login fails, generate token directly using JWT
        const jwt = require('jsonwebtoken');
        authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
      }
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/students - Unit Tests', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/students');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/school-admin-stats - Unit Tests', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/school-admin-stats');

      expect(response.status).toBe(401);
    });

    test('should require ADMIN role', async () => {
      // Create test school and teacher user
      const timestamp = Date.now();
      const testSchool = await School.create({
        name: `Test School ${timestamp}`,
        district: 'Kigali',
        sector: 'Nyarugenge',
        isActive: true
      });

      const teacher = await User.create({
        email: `teacher${timestamp}@test.com`,
        password: 'password123',
        name: 'Test Teacher',
        role: 'TEACHER',
        schoolId: testSchool._id,
        isApproved: true,
        isActive: true
      });

      const jwt = require('jsonwebtoken');
      const teacherToken = jwt.sign({ userId: teacher._id }, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');

      const response = await request(app)
        .get('/api/dashboard/school-admin-stats')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });
  });
});

