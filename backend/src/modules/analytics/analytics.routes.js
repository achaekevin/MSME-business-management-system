const express = require('express')
const router = express.Router()
const controller = require('./analytics.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext)

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Business intelligence, KPIs, trends, and insights
 */

router.get('/kpi', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.kpi)
router.get('/revenue-trend', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.revenueTrend)
router.get('/sales-trend', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.salesTrend)
router.get('/top-products', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.topProducts)
router.get('/top-customers', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.topCustomers)
router.get('/customer-growth', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.customerGrowth)
router.get('/cash-flow', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.cashFlow)
router.get('/inventory', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.inventory)

module.exports = router
