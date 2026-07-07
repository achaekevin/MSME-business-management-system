const express = require('express')
const router = express.Router()
const controller = require('./payments.controller')
const validators = require('./payments.validators')
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
 *   name: Payments
 *   description: Payment records and M-Pesa Daraja integration
 */

router.get('/summary', requirePermission(PERMISSIONS.FINANCE_VIEW), controller.summary)
router.get('/', requirePermission(PERMISSIONS.FINANCE_VIEW), controller.list)
router.get('/:id', requirePermission(PERMISSIONS.FINANCE_VIEW), controller.getOne)
router.delete('/:id', requirePermission(PERMISSIONS.FINANCE_CREATE), controller.remove)

// M-Pesa
router.post('/mpesa/initiate', requirePermission(PERMISSIONS.FINANCE_CREATE), validate(validators.mpesaInitiateSchema), controller.mpesaInitiate)
// Public callback — Safaricom calls this, no auth
router.post('/mpesa/callback', controller.mpesaCallback)

module.exports = router
