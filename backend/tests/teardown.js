// tests/teardown.js
const { disconnectDatabase } = require('../src/config/database')
const { redisClient } = require('../src/config/redis')

module.exports = async () => {
  try {
    await disconnectDatabase()
    await redisClient.quit()
  } catch {
    // ignore cleanup errors
  }
}
