const router = require('express').Router()
const controller = require('./performance.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Metrics
router.post('/metrics', requirePermission('hr.create'), controller.createPerformanceMetric)
router.get('/metrics', requirePermission('hr.view'), controller.getPerformanceMetrics)
router.put('/metrics/:id', requirePermission('hr.update'), controller.updatePerformanceMetric)

// Cycles
router.post('/cycles', requirePermission('hr.create'), controller.createPerformanceCycle)
router.get('/cycles', requirePermission('hr.view'), controller.getPerformanceCycles)
router.put('/cycles/:id', requirePermission('hr.update'), controller.updatePerformanceCycle)

// Reviews
router.post('/reviews', requirePermission('hr.create'), controller.createPerformanceReview)
router.get('/reviews', requirePermission('hr.view'), controller.getPerformanceReviews)
router.put('/reviews/:id', requirePermission('hr.update'), controller.updatePerformanceReview)
router.post('/reviews/:id/submit', requirePermission('hr.approve'), controller.submitPerformanceReview)
router.post('/reviews/:id/acknowledge', requirePermission('hr.view'), controller.acknowledgeReview)

// Reports
router.get('/reports/employees/:employeeId', requirePermission('hr.view'), controller.getEmployeePerformanceHistory)
router.get('/reports/cycles/:cycleId', requirePermission('hr.view'), controller.getCyclePerformanceReport)

module.exports = router
