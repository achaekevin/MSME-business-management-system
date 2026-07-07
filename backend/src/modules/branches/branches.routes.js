const express = require('express')
const router = express.Router()
const controller = require('./branches.controller')
const validators = require('./branches.validators')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Branches
 *   description: Multi-branch management
 */

router.get('/', requirePermission(PERMISSIONS.SETTINGS_VIEW), controller.list)
router.get('/:id', requirePermission(PERMISSIONS.SETTINGS_VIEW), controller.getOne)
router.post('/', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.createBranchSchema), controller.create)
router.put('/:id', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.updateBranchSchema), controller.update)
router.delete('/:id', requirePermission(PERMISSIONS.SETTINGS_EDIT), controller.remove)
router.patch('/:id/toggle', requirePermission(PERMISSIONS.SETTINGS_EDIT), controller.toggle)

module.exports = router
