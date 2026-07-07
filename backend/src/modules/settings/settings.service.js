const repo = require('./settings.repository')
const { ApiError } = require('../../helpers/response')
const { invalidateTenantCache } = require('../../config/redis')
const crypto = require('crypto')

// ── API Keys ──────────────────────────────────────────────────────────────────

async function listApiKeys(businessId) {
  return repo.findApiKeys(businessId)
}

async function createApiKey(businessId, data, req) {
  const { rawKey, ...key } = await repo.createApiKey(
    businessId, data.name,
    data.scopes || [],
    data.expiresAt ? new Date(data.expiresAt) : null
  )
  req?.audit?.('api_key.created', 'ApiKey', key.id, { name: data.name })
  return { ...key, key: rawKey, warning: 'Copy this key now. It will never be shown again.' }
}

async function revokeApiKey(businessId, id, req) {
  const key = await repo.findApiKeyById(businessId, id)
  if (!key) throw ApiError.notFound('API key not found or already revoked')
  await repo.revokeApiKey(id)
  req?.audit?.('api_key.revoked', 'ApiKey', id)
  return { revoked: true }
}

async function validateApiKey(rawKey) {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const key = await repo.findApiKeyByHash(keyHash)
  if (!key) return null
  if (key.expiresAt && key.expiresAt < new Date()) return null
  await repo.touchApiKey(key.id)
  return key
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

async function listWebhooks(businessId) {
  return repo.findWebhooks(businessId)
}

async function createWebhook(businessId, data, req) {
  const webhook = await repo.createWebhook(businessId, data.url, data.events)
  req?.audit?.('webhook.created', 'Webhook', webhook.id, { url: data.url })
  return webhook
}

async function updateWebhook(businessId, id, data, req) {
  const wh = await repo.findWebhookById(businessId, id)
  if (!wh) throw ApiError.notFound('Webhook not found')
  const updated = await repo.updateWebhook(id, data.url, data.events, data.isActive)
  req?.audit?.('webhook.updated', 'Webhook', id)
  return updated
}

async function deleteWebhook(businessId, id, req) {
  const wh = await repo.findWebhookById(businessId, id)
  if (!wh) throw ApiError.notFound('Webhook not found')
  await repo.deleteWebhook(id)
  req?.audit?.('webhook.deleted', 'Webhook', id)
  return { deleted: true }
}

async function getWebhookDeliveries(businessId, webhookId) {
  const wh = await repo.findWebhookById(businessId, webhookId)
  if (!wh) throw ApiError.notFound('Webhook not found')
  return repo.findWebhookDeliveries(webhookId)
}

// ── Security ──────────────────────────────────────────────────────────────────

async function getSecurityOverview(businessId) {
  const [activeSessions, activeApiKeys, recentLogins] = await repo.getSecurityData(businessId)
  return { activeSessions, activeApiKeys, recentLogins }
}

// ── Notification Settings ─────────────────────────────────────────────────────

async function getNotificationSettings(businessId) {
  const settings = await repo.findNotificationSettings(businessId)
  return settings?.notificationSettings || {
    email: { lowStock: true, newSale: true, invoicePaid: true, newCustomer: false },
    inApp: { lowStock: true, newSale: true, invoicePaid: true, subscriptionExpiring: true }
  }
}

async function updateNotificationSettings(businessId, data, req) {
  await repo.upsertNotificationSettings(businessId, data)
  await invalidateTenantCache(businessId, 'settings')
  req?.audit?.('settings.notifications_updated', 'BusinessSetting', businessId)
  return data
}

module.exports = {
  listApiKeys, createApiKey, revokeApiKey, validateApiKey,
  listWebhooks, createWebhook, updateWebhook, deleteWebhook, getWebhookDeliveries,
  getSecurityOverview, getNotificationSettings, updateNotificationSettings
}
