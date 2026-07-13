const asyncHandler = require('../../helpers/asyncHandler')
const { successResponse } = require('../../helpers/response')
const apiKeysService = require('./api-keys.service')

/**
 * Create new API key
 * POST /api/api-keys
 */
exports.createApiKey = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId
  const { name, permissions, expiresAt, ipWhitelist, rateLimit } = req.body

  const result = await apiKeysService.createApiKey(
    businessId,
    { name, permissions, expiresAt, ipWhitelist, rateLimit },
    req.user.id
  )

  successResponse(res, result, 'API key created successfully. Save the key securely - it will not be shown again.', 201)
})

/**
 * Get all API keys
 * GET /api/api-keys
 */
exports.getApiKeys = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId
  const keys = await apiKeysService.getApiKeys(businessId)

  successResponse(res, keys, 'API keys retrieved successfully')
})

/**
 * Get API key details
 * GET /api/api-keys/:id
 */
exports.getApiKey = asyncHandler(async (req, res) => {
  const { id } = req.params
  const key = await apiKeysService.getApiKey(id)

  successResponse(res, key, 'API key retrieved successfully')
})

/**
 * Update API key
 * PUT /api/api-keys/:id
 */
exports.updateApiKey = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { name, permissions, expiresAt, ipWhitelist, rateLimit, isActive } = req.body

  const updated = await apiKeysService.updateApiKey(id, {
    name,
    permissions,
    expiresAt,
    ipWhitelist,
    rateLimit,
    isActive
  })

  successResponse(res, updated, 'API key updated successfully')
})

/**
 * Revoke API key
 * DELETE /api/api-keys/:id
 */
exports.revokeApiKey = asyncHandler(async (req, res) => {
  const { id } = req.params
  const result = await apiKeysService.revokeApiKey(id)

  successResponse(res, result, 'API key revoked successfully')
})

/**
 * Regenerate API key
 * POST /api/api-keys/:id/regenerate
 */
exports.regenerateApiKey = asyncHandler(async (req, res) => {
  const { id } = req.params
  const result = await apiKeysService.regenerateApiKey(id)

  successResponse(res, result, 'API key regenerated successfully. Save the new key securely.')
})
