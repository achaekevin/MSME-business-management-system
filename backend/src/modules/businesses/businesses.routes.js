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

// Dashboard
router.get('/dashboard', controller.dashboard)

// Profile management
router.get('/profile', controller.getProfile)
router.put('/profile', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.profileSchema), controller.updateProfile)
router.post('/logo', requirePermission(PERMISSIONS.SETTINGS_EDIT), uploadImage.single('logo'), controller.uploadLogo)

// Settings management
router.get('/settings', controller.getSettings)
router.put('/settings', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.settingsSchema), controller.updateSettings)

// Branding
router.get('/branding', controller.getBranding)
router.put('/branding', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.brandingSchema), controller.updateBranding)

// Tax settings
router.get('/tax-settings', controller.getTaxSettings)
router.put('/tax-settings', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.taxSettingsSchema), controller.updateTaxSettings)

// Business hours
router.get('/business-hours', controller.getBusinessHours)
router.put('/business-hours', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.businessHoursSchema), controller.updateBusinessHours)

// Holiday calendar
router.get('/holidays', controller.listHolidays)
router.post('/holidays', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.holidaySchema), controller.createHoliday)
router.get('/holidays/:id', controller.getHoliday)
router.put('/holidays/:id', requirePermission(PERMISSIONS.SETTINGS_EDIT), validate(validators.updateHolidaySchema), controller.updateHoliday)
router.delete('/holidays/:id', requirePermission(PERMISSIONS.SETTINGS_EDIT), controller.deleteHoliday)

module.exports = router
