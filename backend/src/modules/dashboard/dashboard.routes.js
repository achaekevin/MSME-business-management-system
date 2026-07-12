const express = require('express')
const router = express.Router()
const controller = require('./dashboard.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Role-based dashboard endpoints with customizable widgets
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
 */
router.get('/', requirePermission(PERMISSIONS.DASHBOARD_VIEW), controller.getRoleDashboard)

/**
 * @swagger
 * /api/dashboard/widgets:
 *   get:
 *     summary: Get all widgets data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [today, yesterday, week, month, quarter, year]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: All widgets data
 */
router.get('/widgets', requirePermission(PERMISSIONS.DASHBOARD_VIEW), controller.getAllWidgets)

/**
 * @swagger
 * /api/dashboard/widgets/available:
 *   get:
 *     summary: Get available widget types
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available widgets list
 */
router.get('/widgets/available', requirePermission(PERMISSIONS.DASHBOARD_VIEW), controller.getAvailableWidgets)

/**
 * @swagger
 * /api/dashboard/widgets/{widgetId}:
 *   get:
 *     summary: Get specific widget data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: widgetId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Widget data
 */
router.get('/widgets/:widgetId', requirePermission(PERMISSIONS.DASHBOARD_VIEW), controller.getWidget)

/**
 * @swagger
 * /api/dashboard/layout:
 *   get:
 *     summary: Get user's dashboard layout
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's layout configuration
 */
router.get('/layout', requirePermission(PERMISSIONS.DASHBOARD_VIEW), controller.getUserLayout)

/**
 * @swagger
 * /api/dashboard/layout:
 *   put:
 *     summary: Save user's dashboard layout
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Layout saved
 */
router.put('/layout', requirePermission(PERMISSIONS.DASHBOARD_VIEW), controller.saveUserLayout)

/**
 * @swagger
 * /api/dashboard/layout/reset:
 *   post:
 *     summary: Reset to default layout
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Layout reset
 */
router.post('/layout/reset', requirePermission(PERMISSIONS.DASHBOARD_VIEW), controller.resetUserLayout)

module.exports = router
