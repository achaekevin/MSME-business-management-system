const express = require('express')
const router = express.Router()
const controller = require('./subscriptions.controller')
const validators = require('./subscriptions.validators')
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
 *   name: Subscriptions
 *   description: SaaS subscription management, billing, and payment methods
 */

router.get('/plans', controller.getPlans)
router.get('/current', controller.getCurrent)
router.post('/upgrade', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.upgradeSchema), controller.upgrade)
router.post('/cancel', requirePermission(PERMISSIONS.SETTINGS_EDIT), controller.cancel)
router.get('/billing', controller.billing)
router.get('/payment-methods', controller.listPaymentMethods)
router.post('/payment-methods', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.paymentMethodSchema), controller.addPaymentMethod)
router.delete('/payment-methods/:id', requirePermission(PERMISSIONS.SETTINGS_EDIT), controller.removePaymentMethod)

module.exports = router
