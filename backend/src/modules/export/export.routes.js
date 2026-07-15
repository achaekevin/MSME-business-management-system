/**
 * Data Export Routes
 */

const express = require('express')
const router = express.Router()
const exportController = require('./export.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

// All routes require authentication
router.use(authenticate)

/**
 * @route   POST /api/export
 * @desc    Export data in specified format
 * @access  Private (requires view permission for the data type)
 */
router.post('/', requirePermission('view_reports'), exportController.exportData)

/**
 * @route   GET /api/export/stats
 * @desc    Get export statistics (record counts)
 * @access  Private
 */
router.get('/stats', exportController.getExportStats)

/**
 * @route   GET /api/export/types
 * @desc    Get available export types and formats
 * @access  Private
 */
router.get('/types', exportController.getExportTypes)

module.exports = router
