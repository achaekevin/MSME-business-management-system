const { ApiError } = require('../helpers/response')
const rbacService = require('../modules/rbac/rbac.service')

/**
 * Middleware to check if user can access a specific branch
 */
const requireBranchAccess = (branchIdParam = 'branchId') => {
  return async (req, res, next) => {
    try {
      const branchId = req.params[branchIdParam] || req.body[branchIdParam] || req.query[branchIdParam]
      
      if (!branchId) {
        return next()
      }
      
      const hasAccess = await rbacService.checkBranchAccess(req.userId, branchId)
      
      if (!hasAccess) {
        throw ApiError.forbidden('You do not have access to this branch')
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware to check if user can access a specific warehouse
 */
const requireWarehouseAccess = (warehouseIdParam = 'warehouseId') => {
  return async (req, res, next) => {
    try {
      const warehouseId = req.params[warehouseIdParam] || req.body[warehouseIdParam] || req.query[warehouseIdParam]
      
      if (!warehouseId) {
        return next()
      }
      
      const hasAccess = await rbacService.checkWarehouseAccess(req.userId, warehouseId)
      
      if (!hasAccess) {
        throw ApiError.forbidden('You do not have access to this warehouse')
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware to check if user can access a specific report
 */
const requireReportAccess = (reportType) => {
  return async (req, res, next) => {
    try {
      const hasAccess = await rbacService.checkReportAccess(req.userId, reportType)
      
      if (!hasAccess) {
        throw ApiError.forbidden('You do not have access to this report')
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware to check if transaction is within user's financial limit
 */
const checkFinancialLimit = (amountParam = 'amount') => {
  return async (req, res, next) => {
    try {
      const amount = req.body[amountParam] || req.body.total || 0
      
      if (amount <= 0) {
        return next()
      }
      
      const withinLimit = await rbacService.checkFinancialLimit(req.userId, amount)
      
      if (!withinLimit) {
        throw ApiError.forbidden(`Transaction amount exceeds your authorized limit`)
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware to check if user has multiple permissions (AND logic)
 */
const requireAllPermissions = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      const checks = await Promise.all(
        permissionKeys.map(key => rbacService.checkUserPermission(req.userId, key))
      )
      
      const hasAll = checks.every(result => result === true)
      
      if (!hasAll) {
        throw ApiError.forbidden('You do not have all required permissions')
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware to check if user has any of the permissions (OR logic)
 */
const requireAnyPermission = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      const checks = await Promise.all(
        permissionKeys.map(key => rbacService.checkUserPermission(req.userId, key))
      )
      
      const hasAny = checks.some(result => result === true)
      
      if (!hasAny) {
        throw ApiError.forbidden('You do not have any of the required permissions')
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = {
  requireBranchAccess,
  requireWarehouseAccess,
  requireReportAccess,
  checkFinancialLimit,
  requireAllPermissions,
  requireAnyPermission
}
