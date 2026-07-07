const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, noContent } = require('../../helpers/response')
const service = require('./settings.service')

// API Keys
const listApiKeys = asyncHandler(async (req, res) => {
  success(res, await service.listApiKeys(req.businessId))
})

const createApiKey = asyncHandler(async (req, res) => {
  created(res, await service.createApiKey(req.businessId, req.body, req), 'API key created')
})

const revokeApiKey = asyncHandler(async (req, res) => {
  await service.revokeApiKey(req.businessId, req.params.id, req)
  noContent(res)
})

// Webhooks
const listWebhooks = asyncHandler(async (req, res) => {
  success(res, await service.listWebhooks(req.businessId))
})

const createWebhook = asyncHandler(async (req, res) => {
  created(res, await service.createWebhook(req.businessId, req.body, req), 'Webhook created')
})

const updateWebhook = asyncHandler(async (req, res) => {
  success(res, await service.updateWebhook(req.businessId, req.params.id, req.body, req))
})

const deleteWebhook = asyncHandler(async (req, res) => {
  await service.deleteWebhook(req.businessId, req.params.id, req)
  noContent(res)
})

const getWebhookDeliveries = asyncHandler(async (req, res) => {
  success(res, await service.getWebhookDeliveries(req.businessId, req.params.id))
})

// Security
const securityOverview = asyncHandler(async (req, res) => {
  success(res, await service.getSecurityOverview(req.businessId))
})

// Notifications
const getNotifications = asyncHandler(async (req, res) => {
  success(res, await service.getNotificationSettings(req.businessId))
})

const updateNotifications = asyncHandler(async (req, res) => {
  success(res, await service.updateNotificationSettings(req.businessId, req.body, req))
})

module.exports = {
  listApiKeys, createApiKey, revokeApiKey,
  listWebhooks, createWebhook, updateWebhook, deleteWebhook, getWebhookDeliveries,
  securityOverview, getNotifications, updateNotifications
}
