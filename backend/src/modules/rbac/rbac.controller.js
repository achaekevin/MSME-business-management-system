const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')
const service = require('./rbac.service')

/**
 * Create custom role
 */
const createCustomRole = asyncHandler(async (req, res) => {
  const role = await service.createCustomRole(req.businessId, req.body, req)
  success(res, role, 'Custom role created successfully', 201)
})

/**
 * Update custom role
 */
const updateCustomRole = asyncHandler(async (req, res) => {
  const role = await service.updateCustomRole(req.businessId, req.params.roleId, req.body, req)
  success(res, role, 'Role updated successfully')
})

/**
 * Clone existing role
 */
const cloneRole = asyncHandler(async (req, res) => {
  const role = await service.cloneRole(req.businessId, req.params.roleId, req.body, req)
  success(res, role, 'Role cloned successfully', 201)
})

/**
 * Set access restrictions
 */
const setAccessRestrictions = asyncHandler(async (req, res) => {
  const role = await service.setAccessRestrictions(req.businessId, req.params.roleId, req.body, req)
  success(res, role, 'Access restrictions updated')
})

/**
 * Get permissions grouped by module
 */
const getPermissionsByModule = asyncHandler(async (req, res) => {
  const permissions = await service.getPermissionsByModule()
  success(res, permissions, 'Permissions retrieved successfully')
})

/**
 * Get role templates
 */
const getRoleTemplates = asyncHandler(async (req, res) => {
  const templates = service.getRoleTemplates()
  success(res, templates, 'Role templates retrieved successfully')
})

/**
 * Get role details
 */
const getRoleDetails = asyncHandler(async (req, res) => {
  const role = await service.getRoleWithDetails(req.businessId, req.params.roleId)
  success(res, role, 'Role details retrieved successfully')
})

/**
 * Check user permission
 */
const checkPermission = asyncHandler(async (req, res) => {
  const { permissionKey } = req.body
  const hasPermission = await service.checkUserPermission(req.userId, permissionKey)
  success(res, { hasPermission, permissionKey })
})

/**
 * Check branch access
 */
const checkBranchAccess = asyncHandler(async (req, res) => {
  const { branchId } = req.params
  const hasAccess = await service.checkBranchAccess(req.userId, branchId)
  success(res, { hasAccess, branchId })
})

module.exports = {
  createCustomRole,
  updateCustomRole,
  cloneRole,
  setAccessRestrictions,
  getPermissionsByModule,
  getRoleTemplates,
  getRoleDetails,
  checkPermission,
  checkBranchAccess
}
