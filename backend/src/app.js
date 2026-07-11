const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const swaggerUi = require('swagger-ui-express')
const { createBullBoard } = require('@bull-board/api')
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter')
const { ExpressAdapter } = require('@bull-board/express')

const appConfig = require('./config/app')
const swaggerSpec = require('./config/swagger')
const requestLogger = require('./middleware/requestLogger')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const { apiLimiter } = require('./middleware/rateLimiter')
const apiRouter = require('./routes')
const logger = require('./config/logger')

function createApp() {
  const app = express()

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: appConfig.env === 'production',
    crossOriginEmbedderPolicy: appConfig.env === 'production'
  }))

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || appConfig.cors.origins.includes(origin) || appConfig.env === 'development') {
        return cb(null, true)
      }
      cb(new Error(`CORS policy does not allow origin: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Business-ID']
  }))

  // ── Core middleware ───────────────────────────────────────────────────────
  app.use(compression())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  app.use(cookieParser())
  app.use(mongoSanitize()) // strips $ and . from request data — prevents NoSQL-style injections even in MySQL queries
  app.use(requestLogger)

  // Trust proxy headers (needed for correct req.ip behind nginx/ALB)
  app.set('trust proxy', 1)

  // ── Rate limiting ─────────────────────────────────────────────────────────
  app.use('/api', apiLimiter)

  // ── API docs (Swagger UI) ─────────────────────────────────────────────────
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'MSME BMS API Docs',
    swaggerOptions: { persistAuthorization: true }
  }))

  // Serve raw OpenAPI JSON for tools like Postman
  app.get('/api/docs.json', (req, res) => res.json(swaggerSpec))

  // ── Queue monitoring dashboard (lock down in prod) ────────────────────────
  // Only setup Bull Board if queues are available (requires Redis 5.0+)
  try {
    const emailQueue = require('./queues/email.queue')
    const { smsQueue, notificationsQueue, reportGenerationQueue, inventoryAlertsQueue } = require('./queues')
    
    const bullBoardAdapter = new ExpressAdapter()
    bullBoardAdapter.setBasePath('/queues')

    createBullBoard({
      queues: [
        new BullMQAdapter(emailQueue),
        new BullMQAdapter(smsQueue),
        new BullMQAdapter(notificationsQueue),
        new BullMQAdapter(reportGenerationQueue),
        new BullMQAdapter(inventoryAlertsQueue)
      ],
      serverAdapter: bullBoardAdapter
    })

    // Protect queue board in production — basic check, replace with proper auth
    app.use('/queues', (req, res, next) => {
      if (appConfig.env === 'production') {
        const key = req.headers['x-queue-key']
        if (key !== process.env.QUEUE_BOARD_KEY) return res.status(403).json({ message: 'Forbidden' })
      }
      next()
    }, bullBoardAdapter.getRouter())
    
    logger.info('✅ Queue dashboard available at /queues')
  } catch (err) {
    logger.warn('⚠️  Queue dashboard disabled - Redis may be incompatible')
    // Queue board unavailable, but app continues
    app.use('/queues', (req, res) => {
      res.status(503).json({ 
        message: 'Queue dashboard unavailable - Redis version incompatible or not running',
        error: err.message 
      })
    })
  }

  // ── API routes ─────────────────────────────────────────────────────────────
  app.use('/api', apiRouter)

  // ── 404 + error handlers (must be last) ───────────────────────────────────
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

module.exports = createApp
