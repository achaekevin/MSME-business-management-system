const { prisma } = require('../config/database')
const logger = require('../config/logger')

// Audit event types
const AUDIT_EVENTS = {
  // Authentication
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGED: 'auth.password.changed',
  PASSWORD_RESET: 'auth.password.reset',
  TWO_FACTOR_ENABLED: 'auth.2fa.enabled',
  TWO_FACTOR_DISABLED: 'auth.2fa.disabled',
  
  // User Management
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ACTIVATED: 'user.activated',
  USER_DEACTIVATED: 'user.deactivated',
  
  // Permissions
  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_DELETED: 'role.deleted',
  PERMISSION_GRANTED: 'permission.granted',
  PERMISSION_REVOKED: 'permission.revoked',
  
  // Financial Operations
  INVOICE_CREATED: 'invoice.created',
  INVOICE_UPDATED: 'invoice.updated',
  INVOICE_DELETED: 'invoice.deleted',
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_REFUNDED: 'payment.refunded',
  EXPENSE_CREATED: 'expense.created',
  EXPENSE_APPROVED: 'expense.approved',
  JOURNAL_ENTRY_POSTED: 'accounting.journal.posted',
  PAYROLL_PROCESSED: 'payroll.processed',
  
  // Inventory
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  STOCK_ADJUSTED: 'inventory.stock.adjusted',
  STOCK_TRANSFERRED: 'inventory.stock.transferred',
  LOW_STOCK_ALERT: 'inventory.low_stock',
  
  // Sales & Purchases
  SALE_CREATED: 'sale.created',
  SALE_UPDATED: 'sale.updated',
  SALE_COMPLETED: 'sale.completed',
  PURCHASE_CREATED: 'purchase.created',
  PURCHASE_APPROVED: 'purchase.approved',
  
  // Documents
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_DOWNLOADED: 'document.downloaded',
  DOCUMENT_DELETED: 'document.deleted',
  
  // Settings
  SETTINGS_UPDATED: 'settings.updated',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',
  WEBHOOK_CREATED: 'webhook.created'
}

/**
 * Log audit event
 */
async function logAudit(data) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        businessId: data.businessId,
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        severity: data.severity || 'info',
        status: data.status || 'success'
      }
    })

    // Log to file for critical events
    if (data.severity === 'critical' || data.severity === 'high') {
      logger.warn(`AUDIT [${data.severity}]: ${data.action} by user ${data.userId}`, {
        auditId: auditLog.id,
        resource: data.resource,
        resourceId: data.resourceId
      })
    }

    return auditLog
  } catch (error) {
    logger.error('Failed to create audit log:', error)
    // Don't throw - audit failures shouldn't break the main operation
    return null
  }
}

/**
 * Log authentication event
 */
async function logAuth(userId, businessId, action, success, ipAddress, userAgent, metadata = {}) {
  return await logAudit({
    businessId,
    userId,
    action,
    resource: 'auth',
    ipAddress,
    userAgent,
    metadata: { success, ...metadata },
    severity: success ? 'info' : 'medium',
    status: success ? 'success' : 'failed'
  })
}

/**
 * Log CRUD operation
 */
async function logCRUD(userId, businessId, action, resource, resourceId, changes, ipAddress, userAgent) {
  return await logAudit({
    businessId,
    userId,
    action,
    resource,
    resourceId,
    changes,
    ipAddress,
    userAgent,
    severity: 'info'
  })
}

/**
 * Log financial transaction
 */
async function logFinancial(userId, businessId, action, resource, resourceId, amount, metadata, ipAddress, userAgent) {
  return await logAudit({
    businessId,
    userId,
    action,
    resource,
    resourceId,
    metadata: { amount, ...metadata },
    ipAddress,
    userAgent,
    severity: 'high'
  })
}

/**
 * Log inventory movement
 */
async function logInventory(userId, businessId, action, productId, warehouseId, quantity, metadata, ipAddress, userAgent) {
  return await logAudit({
    businessId,
    userId,
    action,
    resource: 'inventory',
    resourceId: productId,
    metadata: { warehouseId, quantity, ...metadata },
    ipAddress,
    userAgent,
    severity: 'medium'
  })
}

/**
 * Log permission change
 */
async function logPermissionChange(userId, businessId, action, targetUserId, permission, ipAddress, userAgent) {
  return await logAudit({
    businessId,
    userId,
    action,
    resource: 'permission',
    resourceId: targetUserId,
    metadata: { permission },
    ipAddress,
    userAgent,
    severity: 'high'
  })
}

/**
 * Get audit logs with filters
 */
async function getAuditLogs(businessId, filters = {}) {
  const where = { businessId }

  if (filters.userId) where.userId = filters.userId
  if (filters.action) where.action = { contains: filters.action }
  if (filters.resource) where.resource = filters.resource
  if (filters.severity) where.severity = filters.severity
  if (filters.status) where.status = filters.status
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.skip || 0
  })

  const total = await prisma.auditLog.count({ where })

  return {
    logs,
    total,
    page: Math.floor((filters.skip || 0) / (filters.limit || 100)) + 1,
    limit: filters.limit || 100
  }
}

/**
 * Get audit logs for specific resource
 */
async function getResourceAuditTrail(businessId, resource, resourceId) {
  return await prisma.auditLog.findMany({
    where: {
      businessId,
      resource,
      resourceId
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Get user activity
 */
async function getUserActivity(userId, filters = {}) {
  const where = { userId }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50
  })
}

/**
 * Get audit statistics
 */
async function getAuditStats(businessId, startDate, endDate) {
  const where = {
    businessId,
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  const [
    totalEvents,
    authEvents,
    financialEvents,
    inventoryEvents,
    failedEvents,
    criticalEvents
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, resource: 'auth' } }),
    prisma.auditLog.count({ where: { ...where, action: { contains: 'payment' } } }),
    prisma.auditLog.count({ where: { ...where, resource: 'inventory' } }),
    prisma.auditLog.count({ where: { ...where, status: 'failed' } }),
    prisma.auditLog.count({ where: { ...where, severity: 'critical' } })
  ])

  const topUsers = await prisma.auditLog.groupBy({
    by: ['userId'],
    where,
    _count: true,
    orderBy: {
      _count: {
        userId: 'desc'
      }
    },
    take: 10
  })

  const topActions = await prisma.auditLog.groupBy({
    by: ['action'],
    where,
    _count: true,
    orderBy: {
      _count: {
        action: 'desc'
      }
    },
    take: 10
  })

  return {
    totalEvents,
    authEvents,
    financialEvents,
    inventoryEvents,
    failedEvents,
    criticalEvents,
    topUsers,
    topActions
  }
}

/**
 * Export audit logs to CSV
 */
async function exportAuditLogs(businessId, filters = {}) {
  const { logs } = await getAuditLogs(businessId, { ...filters, limit: 10000 })

  const csv = [
    ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Status', 'Severity'].join(','),
    ...logs.map(log => [
      log.createdAt.toISOString(),
      log.user?.name || 'Unknown',
      log.action,
      log.resource,
      log.resourceId || '',
      log.ipAddress || '',
      log.status,
      log.severity
    ].join(','))
  ].join('\n')

  return csv
}

module.exports = {
  AUDIT_EVENTS,
  logAudit,
  logAuth,
  logCRUD,
  logFinancial,
  logInventory,
  logPermissionChange,
  getAuditLogs,
  getResourceAuditTrail,
  getUserActivity,
  getAuditStats,
  exportAuditLogs
}
