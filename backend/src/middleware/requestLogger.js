const morgan = require('morgan')
const logger = require('../config/logger')

morgan.token('tenant', (req) => req.businessId || '-')
morgan.token('user', (req) => req.userId || '-')

const format = ':method :url :status :res[content-length]B - :response-time ms tenant=:tenant user=:user'

const requestLogger = morgan(format, {
  stream: { write: (message) => logger.info(message.trim()) }
})

module.exports = requestLogger
