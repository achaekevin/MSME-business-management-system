const express = require('express')
const router = express.Router()
const controller = require('./settings.controller')
const validators = require('./settings.validators')
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
 *   name: Settings
 *   description: API keys, webhooks, security, and notification preferences
 */

// API Keys
router.get('/api-keys', requirePermission(PERMISSIONS.API_KEYS_MANAGE), controller.listApiKeys)
router.post('/api-keys', requirePermission(PERMISSIONS.API_KEYS_MANAGE), validate(validators.apiKeySchema), controller.createApiKey)
router.delete('/api-keys/:id', requirePermission(PERMISSIONS.API_KEYS_MANAGE), controller.revokeApiKey)

// Webhooks
router.get('/webhooks', requirePermission(PERMISSIONS.API_KEYS_MANAGE), controller.listWebhooks)
router.post('/webhooks', requirePermission(PERMISSIONS.API_KEYS_MANAGE), validate(validators.webhookSchema), controller.createWebhook)
router.put('/webhooks/:id', requirePermission(PERMISSIONS.API_KEYS_MANAGE), validate(validators.webhookSchema.partial()), controller.updateWebhook)
router.delete('/webhooks/:id', requirePermission(PERMISSIONS.API_KEYS_MANAGE), controller.deleteWebhook)
router.get('/webhooks/:id/deliveries', requirePermission(PERMISSIONS.API_KEYS_MANAGE), controller.getWebhookDeliveries)

// Security
router.get('/security', requirePermission(PERMISSIONS.SETTINGS_VIEW), controller.securityOverview)

// Notifications
router.get('/notifications', requirePermission(PERMISSIONS.SETTINGS_VIEW), controller.getNotifications)
router.put('/notifications', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.notificationSettingsSchema), controller.updateNotifications)

module.exports = router
