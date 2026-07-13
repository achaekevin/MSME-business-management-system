/**
 * Audit Middleware
 * Automatically logs important operations
 */

const auditService = require('../services/audit.service')
const logger = require('../config/logger')

/**
 * Audit middleware - logs operations after successful response
 */
function auditMiddleware(options = {}) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json

    // Override json method to capture response
    res.json = function (data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Async log (don't wait)
        setImmediate(() => {
          logOperation(req, res, data, options)
        })
      }

      // Call original json method
      return originalJson.call(this, data)
    }

    next()
  }
}

/**
 * Log the operation
 */
async function logOperation(req, res, responseData, options) {
  try {
    const method = req.method
    const resource = extractResource(req.path)
    const resourceId = extractResourceId(req.path, req.body, responseData)
    const action = mapMethodToAction(method, req.path)

    // Skip logging for certain paths
    if (shouldSkipLogging(req.path)) {
      return
    }

    // Determine what changed
    let changes = null
    if (method === 'PUT' || method === 'PATCH') {
      changes = req.body
    } else if (method === 'POST' && responseData?.data) {
      changes = { created: responseData.data }
    }

    // Determine severity
    const severity = determineSeverity(resource, action)

    await auditService.logAudit({
      businessId: req.user?.businessId || req.businessId,
      userId: req.user?.id || req.apiKey?.businessId,
      action,
      resource,
      resourceId,
      changes,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      severity
    })
  } catch (error) {
    // Silent fail - don't break the request
    logger.error('Audit logging failed:', error)
  }
}

/**
 * Extract resource name from path
 */
function extractResource(path) {
  const parts = path.split('/').filter(Boolean)
  // Remove 'api' prefix and get first meaningful part
  const resourceIndex = parts[0] === 'api' ? 1 : 0
  return parts[resourceIndex] || 'unknown'
}

/**
 * Extract resource ID from path, body, or response
 */
function extractResourceId(path, body, responseData) {
  // Try to get ID from path (/api/products/123 -> 123)
  const pathParts = path.split('/').filter(Boolean)
  const lastPart = pathParts[pathParts.length - 1]
  
  // Check if last part looks like an ID (UUID or number)
  if (/^[a-f0-9-]{36}$/i.test(lastPart) || /^\d+$/.test(lastPart)) {
    return lastPart
  }

  // Try to get from response data
  if (responseData?.data?.id) {
    return responseData.data.id
  }

  // Try to get from body
  if (body?.id) {
    return body.id
  }

  return null
}

/**
 * Map HTTP method to audit action
 */
function mapMethodToAction(method, path) {
  const resource = extractResource(path)
  
  switch (method) {
    case 'POST':
      return `${resource}.created`
    case 'PUT':
    case 'PATCH':
      return `${resource}.updated`
    case 'DELETE':
      return `${resource}.deleted`
    case 'GET':
      // Only log important GETs
      if (path.includes('/export') || path.includes('/download')) {
        return `${resource}.exported`
      }
      return null // Don't log regular GETs
    default:
      return `${resource}.${method.toLowerCase()}`
  }
}

/**
 * Determine audit severity based on resource and action
 */
function determineSeverity(resource, action) {
  // Critical resources
  const criticalResources = ['users', 'roles', 'permissions', 'api-keys']
  if (criticalResources.includes(resource)) {
    return 'high'
  }

  // Financial resources
  const financialResources = ['payments', 'invoices', 'expenses', 'payroll', 'accounting']
  if (financialResources.includes(resource)) {
    return 'high'
  }

  // Inventory
  if (resource === 'inventory' || action?.includes('stock')) {
    return 'medium'
  }

  return 'info'
}

/**
 * Check if path should be skipped from logging
 */
function shouldSkipLogging(path) {
  const skipPaths = [
    '/api/health',
    '/api/status',
    '/api/metrics',
    '/api/docs',
    '/api/auth/me' // Too frequent
  ]

  return skipPaths.some(skip => path.startsWith(skip))
}

/**
 * Audit specific operation types
 */
function auditAuth() {
  return async (req, res, next) => {
    const originalJson = res.json

    res.json = function (data) {
      if (res.statusCode === 200) {
        setImmediate(async () => {
          try {
            const success = data.success !== false
            await auditService.logAuth(
              req.body.email || req.user?.id,
              req.user?.businessId,
              'auth.login',
              success,
              req.ip,
              req.get('user-agent'),
              { email: req.body.email }
            )
          } catch (error) {
            logger.error('Auth audit failed:', error)
          }
        })
      }

      return originalJson.call(this, data)
    }

    next()
  }
}

/**
 * Audit financial operations
 */
function auditFinancial(resource) {
  return async (req, res, next) => {
    const originalJson = res.json

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && data.success) {
        setImmediate(async () => {
          try {
            await auditService.logFinancial(
              req.user.id,
              req.user.businessId,
              `${resource}.${req.method.toLowerCase()}`,
              resource,
              data.data?.id,
              data.data?.amount || data.data?.total,
              req.body,
              req.ip,
              req.get('user-agent')
            )
          } catch (error) {
            logger.error('Financial audit failed:', error)
          }
        })
      }

      return originalJson.call(this, data)
    }

    next()
  }
}

/**
 * Audit inventory operations
 */
function auditInventory() {
  return async (req, res, next) => {
    const originalJson = res.json

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && data.success) {
        setImmediate(async () => {
          try {
            await auditService.logInventory(
              req.user.id,
              req.user.businessId,
              `inventory.${req.method.toLowerCase()}`,
              req.body.productId || data.data?.productId,
              req.body.warehouseId || data.data?.warehouseId,
              req.body.quantity || data.data?.quantity,
              req.body,
              req.ip,
              req.get('user-agent')
            )
          } catch (error) {
            logger.error('Inventory audit failed:', error)
          }
        })
      }

      return originalJson.call(this, data)
    }

    next()
  }
}

module.exports = {
  auditMiddleware,
  auditAuth,
  auditFinancial,
  auditInventory
}
