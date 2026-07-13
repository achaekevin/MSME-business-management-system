const router = require('express').Router()
const controller = require('./leave.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Leave Types
router.post('/types', requirePermission('hr.create'), controller.createLeaveType)
router.get('/types', requirePermission('hr.view'), controller.getLeaveTypes)
router.put('/types/:id', requirePermission('hr.update'), controller.updateLeaveType)

// Leave Balances
router.post('/balances/initialize', requirePermission('hr.create'), controller.initializeLeaveBalances)
router.get('/balances/:employeeId', requirePermission('hr.view'), controller.getEmployeeLeaveBalances)

// Leave Requests
router.post('/requests', requirePermission('hr.create'), controller.createLeaveRequest)
router.get('/requests', requirePermission('hr.view'), controller.getLeaveRequests)
router.post('/requests/:id/approve', requirePermission('hr.approve'), controller.approveLeaveRequest)
router.post('/requests/:id/reject', requirePermission('hr.approve'), controller.rejectLeaveRequest)
router.post('/requests/:id/cancel', requirePermission('hr.update'), controller.cancelLeaveRequest)

// Reports
router.get('/reports', requirePermission('hr.view'), controller.getLeaveReport)

module.exports = router
