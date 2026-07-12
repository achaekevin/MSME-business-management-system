const express = require('express')
const router = express.Router()
const controller = require('./rbac.controller')
const { authenticate, tenantContext } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const { validate } = require('../../middleware/validation.middleware')
const { PERMISSIONS } = require('../../constants/permissions')
const validators = require('./rbac.validators')

/**
 * @swagger
 * tags:
 *   name: RBAC
 *   description: Role-Based Access Control - Custom roles and permissions
 */

// Apply authentication and tenant context to all routes
router.use(authenticate, tenantContext)

/**
 * @swagger
 * /api/rbac/permissions:
 *   get:
 *     summary: Get all permissions grouped by module
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved
 */
router.get('/permissions', 
  requirePermission(PERMISSIONS.ROLES_VIEW), 
  controller.getPermissionsByModule
)

/**
 * @swagger
 * /api/rbac/templates:
 *   get:
 *     summary: Get role templates (suggested configurations)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role templates retrieved
 */
router.get('/templates', 
  requirePermission(PERMISSIONS.ROLES_VIEW), 
  controller.getRoleTemplates
)

/**
 * @swagger
 * /api/rbac/roles:
 *   post:
 *     summary: Create a custom role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Senior Cashier"
 *               displayName:
 *                 type: string
 *                 example: "Senior Cashier"
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [system, management, sales, inventory, finance, hr, operations, custom]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               accessRestrictions:
 *                 type: object
 *     responses:
 *       201:
 *         description: Role created
 */
router.post('/roles',
  requirePermission(PERMISSIONS.ROLES_CREATE),
  validate(validators.createRoleValidator),
  controller.createCustomRole
)

/**
 * @swagger
 * /api/rbac/roles/{roleId}:
 *   get:
 *     summary: Get role details with permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role details
 */
router.get('/roles/:roleId',
  requirePermission(PERMISSIONS.ROLES_VIEW),
  validate(validators.roleIdValidator),
  controller.getRoleDetails
)

/**
 * @swagger
 * /api/rbac/roles/{roleId}:
 *   put:
 *     summary: Update custom role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put('/roles/:roleId',
  requirePermission(PERMISSIONS.ROLES_EDIT),
  validate(validators.updateRoleValidator),
  controller.updateCustomRole
)

/**
 * @swagger
 * /api/rbac/roles/{roleId}/clone:
 *   post:
 *     summary: Clone an existing role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role cloned
 */
router.post('/roles/:roleId/clone',
  requirePermission(PERMISSIONS.ROLES_CREATE),
  validate(validators.cloneRoleValidator),
  controller.cloneRole
)

/**
 * @swagger
 * /api/rbac/roles/{roleId}/restrictions:
 *   put:
 *     summary: Set access restrictions for a role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branches:
 *                 type: array
 *                 items:
 *                   type: string
 *               warehouses:
 *                 type: array
 *                 items:
 *                   type: string
 *               modules:
 *                 type: array
 *                 items:
 *                   type: string
 *               reports:
 *                 type: array
 *                 items:
 *                   type: string
 *               financialLimit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Restrictions updated
 */
router.put('/roles/:roleId/restrictions',
  requirePermission(PERMISSIONS.ROLES_EDIT),
  validate(validators.accessRestrictionsValidator),
  controller.setAccessRestrictions
)

/**
 * @swagger
 * /api/rbac/check-permission:
 *   post:
 *     summary: Check if current user has a specific permission
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionKey
 *             properties:
 *               permissionKey:
 *                 type: string
 *                 example: "sales.create"
 *     responses:
 *       200:
 *         description: Permission check result
 */
router.post('/check-permission',
  validate(validators.checkPermissionValidator),
  controller.checkPermission
)

/**
 * @swagger
 * /api/rbac/check-branch/{branchId}:
 *   get:
 *     summary: Check if current user can access a branch
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *     responses:
 *       200:
 *         description: Branch access check result
 */
router.get('/check-branch/:branchId',
  validate(validators.branchIdValidator),
  controller.checkBranchAccess
)

module.exports = router
