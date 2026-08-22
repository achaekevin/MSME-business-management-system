// tests/setup.js
const { execSync } = require('child_process')

module.exports = async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || 'mysql://root:Newsecurepassword2026@localhost:3306/msme_db'
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-characters'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters'
  process.env.REDIS_HOST = 'localhost'
  process.env.REDIS_PORT = '6379'

  try {
    execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
      env: { ...process.env },
      stdio: 'inherit'
    })
  } catch (err) {
    console.warn('Warning: Could not run test migrations (database may not be available):', err.message)
  }
}
