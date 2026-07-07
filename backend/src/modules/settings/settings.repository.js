const crypto = require('crypto')
const { prisma } = require('../../config/database')

// ── API Keys ──────────────────────────────────────────────────────────────────

function findApiKeys(businessId) {
  return prisma.apiKey.findMany({
    where: { businessId, revokedAt: null },
    select: { id: true, name: true, keyPrefix: true, scopes: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
}

function createApiKey(businessId, name, scopes, expiresAt) {
  const rawKey = `msme_live_${crypto.randomBytes(24).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 18) + '...'

  return prisma.apiKey.create({
    data: { businessId, name, keyHash, keyPrefix, scopes, expiresAt },
    select: { id: true, name: true, keyPrefix: true, scopes: true, expiresAt: true, createdAt: true }
  }).then((key) => ({ ...key, rawKey }))
}

function findApiKeyById(businessId, id) {
  return prisma.apiKey.findFirst({ where: { id, businessId, revokedAt: null } })
}

function revokeApiKey(id) {
  return prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } })
}

function findApiKeyByHash(keyHash) {
  return prisma.apiKey.findFirst({
    where: { keyHash, revokedAt: null },
    include: { business: true }
  })
}

function touchApiKey(id) {
  return prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } }).catch(() => {})
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

function findWebhooks(businessId) {
  return prisma.webhook.findMany({
    where: { businessId },
    include: { _count: { select: { deliveries: true } } },
    orderBy: { createdAt: 'desc' }
  })
}

function findWebhookById(businessId, id) {
  return prisma.webhook.findFirst({ where: { id, businessId } })
}

function createWebhook(businessId, url, events) {
  const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`
  return prisma.webhook.create({
    data: { businessId, url, events, secret, isActive: true }
  }).then((wh) => ({ ...wh, secret }))
}

function updateWebhook(id, url, events, isActive) {
  return prisma.webhook.update({ where: { id }, data: { url, events, isActive } })
}

function deleteWebhook(id) {
  return prisma.webhook.delete({ where: { id } })
}

function findWebhookDeliveries(webhookId) {
  return prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
}

// ── Security ──────────────────────────────────────────────────────────────────

function getSecurityData(businessId) {
  return Promise.all([
    prisma.session.count({ where: { user: { businessId }, expiresAt: { gt: new Date() } } }),
    prisma.apiKey.count({ where: { businessId, revokedAt: null } }),
    prisma.user.findMany({
      where: { businessId, lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: 'desc' }, take: 10,
      select: { id: true, name: true, email: true, lastLoginAt: true, lastLoginIp: true }
    })
  ])
}

// ── Business Settings ─────────────────────────────────────────────────────────

function findNotificationSettings(businessId) {
  return prisma.businessSetting.findUnique({ where: { businessId } })
}

function upsertNotificationSettings(businessId, data) {
  return prisma.businessSetting.upsert({
    where: { businessId },
    create: { businessId, notificationSettings: data },
    update: { notificationSettings: data }
  })
}

module.exports = {
  findApiKeys, createApiKey, findApiKeyById, revokeApiKey, findApiKeyByHash, touchApiKey,
  findWebhooks, findWebhookById, createWebhook, updateWebhook, deleteWebhook, findWebhookDeliveries,
  getSecurityData, findNotificationSettings, upsertNotificationSettings
}
