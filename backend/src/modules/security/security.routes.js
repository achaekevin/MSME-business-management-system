const express = require('express')
const router = express.Router()
const controller = require('./security.controller')
const validators = require('./security.validators')
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
 *   name: Security
 *   description: Advanced security features - login history, device management, IP restrictions
 */

// Login History
router.get('/login-history', controller.getLoginHistory)
router.get('/login-history/:userId', requirePermission(PERMISSIONS.USERS_VIEW), controller.getUserLoginHistory)

// Device Management
router.get('/devices', controller.getMyDevices)
router.get('/devices/:userId', requirePermission(PERMISSIONS.USERS_VIEW), controller.getUserDevices)
router.delete('/devices/:deviceId', controller.revokeDevice)
router.post('/devices/:deviceId/trust', controller.trustDevice)

// IP Restrictions
router.get('/ip-restrictions', requirePermission(PERMISSIONS.SETTINGS_EDIT), controller.getIpRestrictions)
router.post('/ip-restrictions', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.ipRestrictionSchema), controller.addIpRestriction)
router.put('/ip-restrictions/:id', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.updateIpRestrictionSchema), controller.updateIpRestriction)
router.delete('/ip-restrictions/:id', requirePermission(PERMISSIONS.SETTINGS_EDIT), controller.deleteIpRestriction)

// Activity Logs (enhanced user activity)
router.get('/activity', controller.getMyActivity)
router.get('/activity/:userId', requirePermission(PERMISSIONS.AUDIT_VIEW), controller.getUserActivity)
router.get('/activity/export', requirePermission(PERMISSIONS.AUDIT_VIEW), controller.exportActivity)

// Security Settings
router.get('/settings', requirePermission(PERMISSIONS.SETTINGS_VIEW), controller.getSecuritySettings)
router.put('/settings', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.securitySettingsSchema), controller.updateSecuritySettings)

// Failed Login Attempts
router.get('/failed-logins', requirePermission(PERMISSIONS.AUDIT_VIEW), controller.getFailedLogins)
router.post('/unlock-user/:userId', requirePermission(PERMISSIONS.USERS_EDIT), controller.unlockUser)

module.exports = router
