const { validateApiKey } = require('../modules/settings/settings.service')
const { ApiError } = require('../helpers/response')
const asyncHandler = require('../helpers/asyncHandler')

/**
 * Middleware that accepts an X-API-Key header as an alternative to a Bearer token.
 * When an API key is presented, it resolves the tenant context and attaches
 * req.user / req.businessId just like the JWT authenticate middleware, so
 * downstream handlers are completely unaware of which auth mechanism was used.
 *
 * Usage: mount BEFORE authenticate on routes that should accept both:
 *   router.use(apiKeyAuth, authenticate)
 * Or use it standalone on webhook-style integrations that only use API keys.
 */
const apiKeyAuth = asyncHandler(async (req, res, next) => {
  const rawKey = req.headers['x-api-key']
  if (!rawKey) return next() // no key — fall through to JWT authenticate

  const apiKeyRecord = await validateApiKey(rawKey)
  if (!apiKeyRecord) throw ApiError.unauthorized('Invalid or expired API key')

  const { prisma } = require('../config/database')
  const business = apiKeyRecord.business
  if (!business || !business.isActive) throw ApiError.forbidden('Business account is inactive')

  // Simulate the req shape that authenticate produces — owner-level permissions
  req.userId = null // API key calls are not user-scoped
  req.businessId = apiKeyRecord.businessId
  req.branchId = null
  req.permissions = null // null = all permissions (API keys are business-level)
  req.isApiKeyAuth = true
  req.apiKeyScopes = apiKeyRecord.scopes || []

  next()
})

module.exports = { apiKeyAuth }
