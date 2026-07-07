const { PrismaClient } = require('@prisma/client')
const logger = require('./logger')

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' }
  ]
})

if (process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query} — Params: ${e.params} — Duration: ${e.duration}ms`)
  })
}

prisma.$on('error', (e) => logger.error('Prisma error:', e))
prisma.$on('warn', (e) => logger.warn('Prisma warning:', e))

async function connectDatabase() {
  try {
    await prisma.$connect()
    logger.info('✅ Database connected (MySQL via Prisma)')
  } catch (err) {
    logger.error('❌ Database connection failed:', err)
    process.exit(1)
  }
}

async function disconnectDatabase() {
  await prisma.$disconnect()
}

module.exports = { prisma, connectDatabase, disconnectDatabase }
