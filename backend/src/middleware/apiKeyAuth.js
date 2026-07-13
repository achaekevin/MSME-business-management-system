/**
 * API Key Authentication Middleware
 * Alternative to JWT for external integrations
 */

const { ApiError } = require('../helpers/response')
const apiKeysService = require('../modules/api-keys/api-keys.service')
const logger = require('../config/logger')

/**
 * Authenticate request via API key
 * Header: X-API-Key: ssme_live_xxxxxxxxxxxxx
 */
async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key']

    if (!apiKey) {
      throw ApiError.unauthorized('API key required')
    }

    const ip = req.ip || req.connection.remoteAddress

    // Validate API key and get business context
    const keyData = await apiKeysService.validateApiKey(apiKey, ip)

    // Attach business context to request (similar to JWT auth)
    req.apiKey = {
      businessId: keyData.businessId,
      business: keyData.business,
      permissions: keyData.permissions,
      rateLimit: keyData.rateLimit
    }

    // For compatibility with existing middleware
    req.businessId = keyData.businessId

    next()
  } catch (error) {
    logger.error('API key authentication failed:', error.message)
    next(error)
  }
}

/**
 * Check if API key has required permission
 */
function requireApiPermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return next(ApiError.unauthorized('API key authentication required'))
    }

    const hasPermission = req.apiKey.permissions.includes(permission) ||
      req.apiKey.permissions.includes('*')

    if (!hasPermission) {
      return next(ApiError.forbidden(`Missing required permission: ${permission}`))
    }

    next()
  }
}

/**
 * Flexible auth middleware - accepts either JWT or API key
 */
async function flexibleAuth(req, res, next) {
  try {
    // Check for API key first
    const apiKey = req.headers['x-api-key']
    if (apiKey) {
      return authenticateApiKey(req, res, next)
    }

    // Fall back to JWT authentication
    const { authenticate } = require('./auth')
    return authenticate(req, res, next)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  authenticateApiKey,
  requireApiPermission,
  flexibleAuth
}
