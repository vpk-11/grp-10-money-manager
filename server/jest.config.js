module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};