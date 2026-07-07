const { ApiError } = require('../helpers/response')

/**
 * Usage: router.get('/customers', authenticate, tenantContext, requirePermission('customers.view'), handler)
 *
 * req.permissions is set by authMiddleware:
 *   - null  => user is Owner/Admin, bypasses all checks
 *   - array => list of permission keys the user's role grants
 */
function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (req.permissions === null) return next() // owner/admin bypass

    const hasPermission = requiredPermissions.some((perm) => req.permissions?.includes(perm))
    if (!hasPermission) {
      throw ApiError.forbidden(`Missing required permission: ${requiredPermissions.join(' or ')}`)
    }
    next()
  }
}

/**
 * Requires ALL listed permissions rather than any one of them.
 */
function requireAllPermissions(...requiredPermissions) {
  return (req, res, next) => {
    if (req.permissions === null) return next()

    const hasAll = requiredPermissions.every((perm) => req.permissions?.includes(perm))
    if (!hasAll) {
      throw ApiError.forbidden(`Missing required permissions: ${requiredPermissions.join(', ')}`)
    }
    next()
  }
}

function requireRole(...roleNames) {
  return (req, res, next) => {
    if (req.user.isOwner) return next()
    if (!req.user.role || !roleNames.includes(req.user.role.name)) {
      throw ApiError.forbidden(`This action requires one of these roles: ${roleNames.join(', ')}`)
    }
    next()
  }
}

module.exports = { requirePermission, requireAllPermissions, requireRole }
