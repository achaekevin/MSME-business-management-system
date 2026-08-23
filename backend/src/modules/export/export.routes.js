const express = require('express')
const router = express.Router()
const exportController = require('./export.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

// All routes require authentication and tenant context
router.use(authenticate, tenantContext)

/**
 * @route   POST /api/export
 * @desc    Export data in specified format
 * @access  Private (requires view or export reports permission)
 */
router.post('/', requirePermission(PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT), exportController.exportData)

/**
 * @route   GET /api/export/stats
 * @desc    Get export statistics (record counts)
 * @access  Private
 */
router.get('/stats', requirePermission(PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT), exportController.getExportStats)

/**
 * @route   GET /api/export/types
 * @desc    Get available export types and formats
 * @access  Private
 */
router.get('/types', requirePermission(PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT), exportController.getExportTypes)

module.exports = router

