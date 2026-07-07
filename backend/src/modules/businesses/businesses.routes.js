const express = require('express')
const router = express.Router()
const controller = require('./businesses.controller')
const validators = require('./businesses.validators')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { uploadImage } = require('../../middleware/upload.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Business
 *   description: Business profile, settings, and dashboard
 */

router.get('/dashboard', controller.dashboard)
router.get('/profile', controller.getProfile)
router.put('/profile', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.profileSchema), controller.updateProfile)
router.post('/logo', requirePermission(PERMISSIONS.SETTINGS_EDIT), uploadImage.single('logo'), controller.uploadLogo)
router.get('/settings', controller.getSettings)
router.put('/settings', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.settingsSchema), controller.updateSettings)

module.exports = router
