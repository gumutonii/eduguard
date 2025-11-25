module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/logs/',
    '/config/'
  ],
  testMatch: [
    '**/__tests__/unit/**/*.test.js',
    '**/__tests__/validation/**/*.test.js',
    '**/__tests__/integration/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/routes/test.js', // Exclude routes/test.js from being treated as a test file
    '/__tests__/routes/', // Exclude old route test files
    '/__tests__/services/' // Exclude old service test files
  ],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/logs/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  maxWorkers: 1 // Run tests sequentially to avoid database interference between tests
}

