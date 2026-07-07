const express = require('express')
const router = express.Router()
const controller = require('./audit.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext)

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Immutable audit trail of all business operations
 */

router.get('/summary', requirePermission(PERMISSIONS.AUDIT_VIEW), controller.summary)
router.get('/entities', requirePermission(PERMISSIONS.AUDIT_VIEW), controller.entities)
router.get('/entity/:entity/:entityId', requirePermission(PERMISSIONS.AUDIT_VIEW), controller.entityHistory)
router.get('/', requirePermission(PERMISSIONS.AUDIT_VIEW), controller.list)

module.exports = router
