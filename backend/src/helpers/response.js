class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message, errors) { return new ApiError(400, message, errors) }
  static unauthorized(message = 'Unauthorized') { return new ApiError(401, message) }
  static forbidden(message = 'Forbidden') { return new ApiError(403, message) }
  static notFound(message = 'Resource not found') { return new ApiError(404, message) }
  static conflict(message = 'Conflict') { return new ApiError(409, message) }
  static tooManyRequests(message = 'Too many requests') { return new ApiError(429, message) }
  static internal(message = 'Internal server error') { return new ApiError(500, message) }
}

function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data })
}

function created(res, data, message = 'Created successfully') {
  return success(res, data, message, 201)
}

function paginated(res, items, total, page, limit, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data: {
      data: items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  })
}

function noContent(res) {
  return res.status(204).send()
}

module.exports = { ApiError, success, created, paginated, noContent }
