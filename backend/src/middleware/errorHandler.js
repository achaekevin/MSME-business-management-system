const logger = require('../config/logger')
const { ApiError } = require('../helpers/response')

/**
 * Translates known Prisma error codes into clean ApiErrors before they
 * reach the generic handler below.
 */
function normalizePrismaError(err) {
  if (err.code === 'P2002') {
    const fields = err.meta?.target || []
    return ApiError.conflict(`A record with this ${Array.isArray(fields) ? fields.join(', ') : fields} already exists`)
  }
  if (err.code === 'P2025') {
    return ApiError.notFound('Record not found')
  }
  if (err.code === 'P2003') {
    return ApiError.badRequest('Invalid reference — related record does not exist')
  }
  return null
}

function errorHandler(err, req, res, next) {
  let error = err

  if (err.code && err.code.startsWith('P')) {
    error = normalizePrismaError(err) || ApiError.internal('Database error')
  }

  if (err.name === 'ZodError') {
    error = ApiError.badRequest('Validation failed', err.flatten().fieldErrors)
  }

  if (err.name === 'JsonWebTokenError') error = ApiError.unauthorized('Invalid token')
  if (err.name === 'TokenExpiredError') error = ApiError.unauthorized('Token expired')

  const statusCode = error.statusCode || 500
  const message = error.isOperational ? error.message : 'Internal server error'

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack })
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${statusCode} ${message}`)
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || undefined,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {})
  })
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` })
}

module.exports = { errorHandler, notFoundHandler }
