require('dotenv').config()
const http = require('http')
const createApp = require('./app')
const { connectDatabase, disconnectDatabase } = require('./config/database')
const { redisClient } = require('./config/redis')
const { initSocket } = require('./config/socket')
const { ensureBucket } = require('./storage/storage.service')
const appConfig = require('./config/app')
const logger = require('./config/logger')

async function boot() {
  try {
    // ── Infrastructure connections ─────────────────────────────────────────
    await connectDatabase()
    logger.info('Database ready')

    // Redis client connects lazily on first command; verify it here
    let redisAvailable = false
    let redisVersionOk = false
    try {
      await redisClient.ping()
      const redisInfo = await redisClient.info('server')
      const versionMatch = redisInfo.match(/redis_version:(\d+)\.(\d+)\.(\d+)/)
      if (versionMatch) {
        const majorVersion = parseInt(versionMatch[1])
        redisVersionOk = majorVersion >= 5
      }
      logger.info('Redis ready')
      redisAvailable = true
      
      if (!redisVersionOk) {
        logger.warn('⚠️  Redis version < 5.0.0 detected — BullMQ queue features will be disabled')
      }
    } catch (err) {
      logger.warn('⚠️  Redis not available — queue features disabled')
      logger.warn(`Redis error: ${err.message}`)
    }

    // Ensure object-storage bucket exists (creates it if not)
    await ensureBucket().catch((err) =>
      logger.warn('Storage bucket check failed (non-fatal in dev):', err.message)
    )

    // ── HTTP server ────────────────────────────────────────────────────────
    const app = createApp(redisVersionOk)
    const server = http.createServer(app)

    // ── Socket.io ──────────────────────────────────────────────────────────
    initSocket(server)
    logger.info('Socket.io initialized')

    // ── Scheduled / repeatable BullMQ jobs ────────────────────────────────
    if (redisAvailable && redisVersionOk) {
      try {
        const { registerScheduledJobs } = require('./queues/scheduler')
        await registerScheduledJobs()
      } catch (err) {
        logger.warn('⚠️  Failed to register scheduled jobs — queue features disabled')
        logger.warn(`Scheduler error: ${err.message}`)
      }
    }

    // ── Listen ─────────────────────────────────────────────────────────────
    server.listen(appConfig.port, () => {
      logger.info(`🚀 MSME BMS API running on port ${appConfig.port} [${appConfig.env}]`)
      logger.info(`   API:   http://localhost:${appConfig.port}/api`)
      logger.info(`   Docs:  http://localhost:${appConfig.port}/api/docs`)
      logger.info(`   Health: http://localhost:${appConfig.port}/health`)
      logger.info(`   Queues: http://localhost:${appConfig.port}/queues`)
    })

    // ── Graceful shutdown ──────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully...`)
      server.close(async () => {
        await disconnectDatabase()
        if (redisAvailable) {
          try {
            await redisClient.quit()
          } catch (err) {
            logger.warn('Redis disconnect failed:', err.message)
          }
        }
        logger.info('Shutdown complete')
        process.exit(0)
      })

      // Force exit after 30s if graceful shutdown stalls
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit')
        process.exit(1)
      }, 30_000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason)
    })

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err)
      process.exit(1)
    })

    return server
  } catch (err) {
    logger.error('Fatal error during boot:', err)
    process.exit(1)
  }
}

boot()
