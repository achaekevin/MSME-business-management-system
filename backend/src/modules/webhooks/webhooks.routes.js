/**
 * Webhooks Routes
 */

const express = require('express')
const router = express.Router()
const controller = require('./webhooks.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

// All routes require authentication and settings:write permission
router.use(authenticate)
router.use(requirePermission('settings:write'))

// Webhook CRUD
router.post('/', controller.createWebhook)
router.get('/', controller.getWebhooks)
router.get('/events', controller.getAvailableEvents)
router.get('/:id', controller.getWebhook)
router.put('/:id', controller.updateWebhook)
router.delete('/:id', controller.deleteWebhook)

// Webhook secret
router.get('/:id/secret', controller.getWebhookSecret)

// Delivery management
router.get('/:id/deliveries', controller.getWebhookDeliveries)
router.post('/deliveries/:deliveryId/retry', controller.retryDelivery)

module.exports = router
