const logger = require('../config/logger')

/**
 * Attaches a `req.audit(action, entity, entityId, metadata)` helper that
 * controllers call after a successful mutation.
 *
 * All audit records are written via the AUDIT_LOGGING BullMQ queue so:
 *   - The response is never blocked by the write
 *   - Failures are retried automatically (3 attempts with exponential backoff)
 *   - Failed records persist in the queue for inspection
 *
 * Falls back to a no-op logger warning if the queue is unavailable (e.g. during
 * unit tests or when Redis is not configured).
 */
function auditMiddleware(req, res, next) {
  req.audit = (action, entity, entityId = null, metadata = null) => {
    try {
      // Lazy-require to break circular dependency: queue index -> worker -> middleware
      const { auditLoggingQueue } = require('../queues')

      auditLoggingQueue
        .add('write-audit-log', {
          businessId: req.businessId,
          userId: req.userId || null,
          action,
          entity,
          entityId,
          metadata,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        })
        .catch((err) => logger.error('Failed to queue audit log:', err.message))
    } catch (err) {
      logger.warn('Audit middleware: queue unavailable, log skipped', { action, entity, entityId })
    }
  }
  next()
}

module.exports = auditMiddleware
