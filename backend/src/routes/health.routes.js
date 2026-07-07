const express = require('express')
const router = express.Router()
const { prisma } = require('../config/database')
const { redisClient } = require('../config/redis')
const logger = require('../config/logger')
const os = require('os')

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic liveness probe — used by Docker/K8s HEALTHCHECK
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200: { description: Service is up }
 *       503: { description: One or more dependencies are unhealthy }
 */
router.get('/health', async (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Deep readiness check — verifies database and Redis connectivity
 *     tags: [Health]
 *     security: []
 */
router.get('/status', async (req, res) => {
  const checks = { database: 'ok', redis: 'ok' }
  let httpStatus = 200

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (err) {
    checks.database = 'unhealthy'
    httpStatus = 503
    logger.error('Health check — database failure:', err.message)
  }

  try {
    await redisClient.ping()
  } catch (err) {
    checks.redis = 'unhealthy'
    httpStatus = 503
    logger.error('Health check — Redis failure:', err.message)
  }

  res.status(httpStatus).json({
    status: httpStatus === 200 ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  })
})

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: System metrics — memory, CPU, uptime (requires auth in production)
 *     tags: [Health]
 */
router.get('/metrics', async (req, res) => {
  const mem = process.memoryUsage()
  res.json({
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(mem.rss / 1024 / 1024) + 'MB'
    },
    cpu: { loadAvg: os.loadavg(), cpus: os.cpus().length },
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  })
})

module.exports = router
