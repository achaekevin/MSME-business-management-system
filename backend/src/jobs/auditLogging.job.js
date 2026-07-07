const { prisma } = require('../config/database')
const { notificationsQueue } = require('../queues')
const { uploadBuffer } = require('../storage/storage.service')
const logger = require('../config/logger')
const dayjs = require('dayjs')

/**
 * Async audit log processor — writes audit records to the database in the
 * background so the main API request thread can return immediately.
 *
 * Job data: { businessId, userId, action, entity, entityId, metadata, ip, userAgent }
 */
async function processAuditLoggingJob(job) {
  const { businessId, userId, action, entity, entityId, metadata, ip, userAgent } = job.data

  if (!businessId || !action) {
    logger.warn('Audit job skipped — missing required fields', job.data)
    return { skipped: true }
  }

  await prisma.auditLog.create({
    data: {
      businessId,
      userId: userId || null,
      action,
      entity: entity || 'Unknown',
      entityId: entityId || null,
      metadata: metadata || {},
      ipAddress: ip || null,
      userAgent: userAgent || null
    }
  })

  logger.debug(`Audit log written: ${action} on ${entity}:${entityId} by user ${userId}`)
  return { logged: true }
}

module.exports = processAuditLoggingJob
