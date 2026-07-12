const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./users.service')
const { z } = require('zod')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

// ── Controllers ───────────────────────────────────────────────────────────────

const listUsers = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listUsers(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const getUser = asyncHandler(async (req, res) => {
  success(res, await service.getUser(req.businessId, req.params.id))
})

const inviteUser = asyncHandler(async (req, res) => {
  const result = await service.inviteUser(req.businessId, req.body, req.userId)
  created(res, result, 'Invitation sent')
})

const updateUser = asyncHandler(async (req, res) => {
  success(res, await service.updateUser(req.businessId, req.params.id, req.body), 'User updated')
})

const removeUser = asyncHandler(async (req, res) => {
  await service.removeUser(req.businessId, req.params.id)
  noContent(res)
})

const listRoles = asyncHandler(async (req, res) => {
  const { category, enabled } = req.query
  success(res, await service.listRoles(req.businessId, { category, enabled }))
})

const getRoleDetails = asyncHandler(async (req, res) => {
  success(res, await service.getRoleDetails(req.businessId, req.params.id))
})

const createRole = asyncHandler(async (req, res) => {
  created(res, await service.createRole(req.businessId, req.body), 'Role created')
})

const updateRole = asyncHandler(async (req, res) => {
  success(res, await service.updateRole(req.businessId, req.params.id, req.body), 'Role updated')
})

const toggleRole = asyncHandler(async (req, res) => {
  success(res, await service.toggleRole(req.businessId, req.params.id, req.body.isEnabled), 'Role status updated')
})

const deleteRole = asyncHandler(async (req, res) => {
  await service.deleteRole(req.businessId, req.params.id)
  noContent(res)
})

const getAvailablePermissions = asyncHandler(async (req, res) => {
  success(res, await service.getAvailablePermissions())
})

// ── Schemas ───────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  roleId: z.string().uuid().optional(),
  roleName: z.string().optional(),
  branchId: z.string().uuid().optional()
})

const roleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional().default([])
})

// ── Router ────────────────────────────────────────────────────────────────────

const express = require('express')
const router = express.Router()
router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Team members, invitations, roles, and permissions
 */

router.get('/', requirePermission(PERMISSIONS.USERS_VIEW), listUsers)
router.get('/:id', requirePermission(PERMISSIONS.USERS_VIEW), getUser)
router.post('/invite', requirePermission(PERMISSIONS.USERS_CREATE), validate(inviteSchema), inviteUser)
router.put('/:id', requirePermission(PERMISSIONS.USERS_EDIT), updateUser)
router.delete('/:id', requirePermission(PERMISSIONS.USERS_DELETE), removeUser)

router.get('/roles/all', requirePermission(PERMISSIONS.ROLES_VIEW), listRoles)
router.get('/roles/:id', requirePermission(PERMISSIONS.ROLES_VIEW), getRoleDetails)
router.post('/roles', requirePermission(PERMISSIONS.ROLES_MANAGE), validate(roleSchema), createRole)
router.put('/roles/:id', requirePermission(PERMISSIONS.ROLES_MANAGE), validate(roleSchema.partial()), updateRole)
router.patch('/roles/:id/toggle', requirePermission(PERMISSIONS.ROLES_MANAGE), toggleRole)
router.delete('/roles/:id', requirePermission(PERMISSIONS.ROLES_MANAGE), deleteRole)
router.get('/permissions/available', requirePermission(PERMISSIONS.ROLES_VIEW), getAvailablePermissions)

module.exports = router
