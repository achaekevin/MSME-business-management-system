/**
 * API Keys Management Service
 * Allows external systems to authenticate via API keys
 */

const crypto = require('crypto')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const logger = require('../../config/logger')

/**
 * Generate a secure API key
 */
function generateApiKey() {
  // Format: ssme_live_xxxxxxxxxxxx or ssme_test_xxxxxxxxxxxx
  const prefix = process.env.NODE_ENV === 'production' ? 'ssme_live' : 'ssme_test'
  const key = crypto.randomBytes(32).toString('hex')
  return `${prefix}_${key}`
}

/**
 * Hash API key for storage
 */
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Create new API key
 */
async function createApiKey(businessId, data, createdBy) {
  const apiKey = generateApiKey()
  const hashedKey = hashApiKey(apiKey)

  const record = await prisma.apiKey.create({
    data: {
      businessId,
      name: data.name,
      keyHash: hashedKey,
      permissions: data.permissions || [],
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      ipWhitelist: data.ipWhitelist || [],
      rateLimit: data.rateLimit || 1000, // requests per hour
      isActive: true,
      createdBy
    }
  })

  logger.info(`API key created: ${data.name} for business ${businessId}`)

  // Return the plain key only once (never stored)
  return {
    id: record.id,
    name: record.name,
    apiKey, // Only shown once!
    permissions: record.permissions,
    expiresAt: record.expiresAt,
    rateLimit: record.rateLimit,
    createdAt: record.createdAt
  }
}

/**
 * List API keys for business (without revealing actual keys)
 */
async function getApiKeys(businessId) {
  return await prisma.apiKey.findMany({
    where: { businessId },
    select: {
      id: true,
      name: true,
      permissions: true,
      expiresAt: true,
      ipWhitelist: true,
      rateLimit: true,
      isActive: true,
      lastUsedAt: true,
      usageCount: true,
      createdAt: true,
      createdBy: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Get API key details
 */
async function getApiKey(id) {
  const key = await prisma.apiKey.findUnique({
    where: { id },
    select: {
      id: true,
      businessId: true,
      name: true,
      permissions: true,
      expiresAt: true,
      ipWhitelist: true,
      rateLimit: true,
      isActive: true,
      lastUsedAt: true,
      usageCount: true,
      createdAt: true,
      createdBy: true
    }
  })

  if (!key) throw ApiError.notFound('API key not found')
  return key
}

/**
 * Validate API key and return associated business context
 */
async function validateApiKey(apiKey, ip) {
  const hashedKey = hashApiKey(apiKey)

  const record = await prisma.apiKey.findUnique({
    where: { keyHash: hashedKey },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  })

  if (!record) {
    logger.warn(`Invalid API key attempt from IP: ${ip}`)
    throw ApiError.unauthorized('Invalid API key')
  }

  if (!record.isActive) {
    throw ApiError.unauthorized('API key is disabled')
  }

  if (record.expiresAt && new Date() > record.expiresAt) {
    throw ApiError.unauthorized('API key has expired')
  }

  if (record.business.status !== 'active') {
    throw ApiError.unauthorized('Business account is not active')
  }

  // Check IP whitelist
  if (record.ipWhitelist && record.ipWhitelist.length > 0) {
    if (!record.ipWhitelist.includes(ip)) {
      logger.warn(`API key used from unauthorized IP: ${ip}`)
      throw ApiError.forbidden('IP address not whitelisted')
    }
  }

  // Update usage stats
  await prisma.apiKey.update({
    where: { id: record.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 }
    }
  })

  return {
    businessId: record.businessId,
    business: record.business,
    permissions: record.permissions,
    rateLimit: record.rateLimit
  }
}

/**
 * Update API key
 */
async function updateApiKey(id, data) {
  return await prisma.apiKey.update({
    where: { id },
    data: {
      name: data.name,
      permissions: data.permissions,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      ipWhitelist: data.ipWhitelist,
      rateLimit: data.rateLimit,
      isActive: data.isActive
    }
  })
}

/**
 * Revoke/Delete API key
 */
async function revokeApiKey(id) {
  const key = await prisma.apiKey.findUnique({
    where: { id }
  })

  if (!key) throw ApiError.notFound('API key not found')

  await prisma.apiKey.delete({
    where: { id }
  })

  logger.info(`API key revoked: ${key.name}`)
  return { message: 'API key revoked successfully' }
}

/**
 * Regenerate API key
 */
async function regenerateApiKey(id) {
  const oldKey = await prisma.apiKey.findUnique({
    where: { id }
  })

  if (!oldKey) throw ApiError.notFound('API key not found')

  const newApiKey = generateApiKey()
  const hashedKey = hashApiKey(newApiKey)

  const updated = await prisma.apiKey.update({
    where: { id },
    data: {
      keyHash: hashedKey,
      usageCount: 0,
      lastUsedAt: null
    }
  })

  logger.info(`API key regenerated: ${oldKey.name}`)

  return {
    id: updated.id,
    name: updated.name,
    apiKey: newApiKey, // Only shown once!
    permissions: updated.permissions,
    expiresAt: updated.expiresAt,
    createdAt: updated.createdAt
  }
}

module.exports = {
  createApiKey,
  getApiKeys,
  getApiKey,
  validateApiKey,
  updateApiKey,
  revokeApiKey,
  regenerateApiKey
}
