const express = require('express')
const router = express.Router()
const controller = require('./dashboard.controller')
const { authenticate, tenantContext } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Role-based dashboard endpoints
 */

// Apply authentication and tenant context
router.use(authenticate, tenantContext)

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get role-specific dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 */
router.get('/', requirePermission(PERMISSIONS.DASHBOARD_VIEW), controller.getRoleDashboard)

module.exports = router
