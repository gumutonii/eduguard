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

describe('Authentication Validation Tests', () => {
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

  describe('POST /api/auth/register - Validation', () => {
    test('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          role: 'ADMIN',
          schoolName: 'Test School',
          schoolDistrict: 'Kigali',
          schoolSector: 'Nyarugenge'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    test('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
          role: 'ADMIN',
          schoolName: 'Test School',
          schoolDistrict: 'Kigali',
          schoolSector: 'Nyarugenge'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject registration with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'INVALID_ROLE',
          schoolName: 'Test School',
          schoolDistrict: 'Kigali',
          schoolSector: 'Nyarugenge'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login - Validation', () => {
    test('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password - Validation', () => {
    test('should reject request with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

