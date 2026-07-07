module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterFramework: [],
  globalSetup: './tests/setup.js',
  globalTeardown: './tests/teardown.js',
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/prisma/', '/tests/'],
  coverageThreshold: {
    global: { branches: 60, functions: 60, lines: 60, statements: 60 }
  },
  testTimeout: 30000,
  verbose: true
}
