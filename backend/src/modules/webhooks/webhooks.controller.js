/**
 * Webhooks Controller
 * HTTP handlers for webhook management
 */

const webhooksService = require('./webhooks.service')
const asyncHandler = require('../../helpers/asyncHandler')
const { success, ApiError } = require('../../helpers/response')

/**
 * Create webhook endpoint
 */
exports.createWebhook = asyncHandler(async (req, res) => {
  const webhook = await webhooksService.createWebhook(
    req.user.businessId,
    req.body,
    req.user.id
  )

  // Hide secret in response
  const { secret, ...webhookData } = webhook

  success(res, webhookData, 'Webhook created successfully', 201)
})

/**
 * Get all webhooks
 */
exports.getWebhooks = asyncHandler(async (req, res) => {
  const webhooks = await webhooksService.getWebhooks(req.user.businessId)

  // Hide secrets
  const sanitized = webhooks.map(({ secret, ...webhook }) => webhook)

  success(res, sanitized)
})

/**
 * Get webhook details
 */
exports.getWebhook = asyncHandler(async (req, res) => {
  const webhook = await webhooksService.getWebhook(req.params.id)

  // Verify ownership
  if (webhook.businessId !== req.user.businessId) {
    throw ApiError.forbidden('Access denied')
  }

  // Hide secret
  const { secret, ...webhookData } = webhook

  success(res, webhookData)
})

/**
 * Update webhook
 */
exports.updateWebhook = asyncHandler(async (req, res) => {
  const webhook = await webhooksService.getWebhook(req.params.id)

  // Verify ownership
  if (webhook.businessId !== req.user.businessId) {
    throw ApiError.forbidden('Access denied')
  }

  const updated = await webhooksService.updateWebhook(req.params.id, req.body)

  // Hide secret
  const { secret, ...webhookData } = updated

  success(res, webhookData, 'Webhook updated successfully')
})

/**
 * Delete webhook
 */
exports.deleteWebhook = asyncHandler(async (req, res) => {
  const webhook = await webhooksService.getWebhook(req.params.id)

  // Verify ownership
  if (webhook.businessId !== req.user.businessId) {
    throw ApiError.forbidden('Access denied')
  }

  await webhooksService.deleteWebhook(req.params.id)

  success(res, null, 'Webhook deleted successfully')
})

/**
 * Get webhook deliveries
 */
exports.getWebhookDeliveries = asyncHandler(async (req, res) => {
  const webhook = await webhooksService.getWebhook(req.params.id)

  // Verify ownership
  if (webhook.businessId !== req.user.businessId) {
    throw ApiError.forbidden('Access denied')
  }

  const deliveries = await webhooksService.getWebhookDeliveries(
    req.params.id,
    req.query
  )

  success(res, deliveries)
})

/**
 * Retry webhook delivery
 */
exports.retryDelivery = asyncHandler(async (req, res) => {
  const result = await webhooksService.retryWebhookDelivery(req.params.deliveryId)

  success(res, result, 'Webhook delivery retried')
})

/**
 * Get available webhook events
 */
exports.getAvailableEvents = asyncHandler(async (req, res) => {
  const events = webhooksService.getAvailableEvents()

  success(res, events)
})

/**
 * Get webhook secret (for regeneration)
 */
exports.getWebhookSecret = asyncHandler(async (req, res) => {
  const webhook = await webhooksService.getWebhook(req.params.id)

  // Verify ownership
  if (webhook.businessId !== req.user.businessId) {
    throw ApiError.forbidden('Access denied')
  }

  success(res, { secret: webhook.secret })
})
