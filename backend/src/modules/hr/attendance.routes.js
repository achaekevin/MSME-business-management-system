const router = require('express').Router()
const controller = require('./attendance.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Policies
router.post('/policies', requirePermission('hr.create'), controller.createAttendancePolicy)
router.get('/policies', requirePermission('hr.view'), controller.getAttendancePolicies)
router.put('/policies/:id', requirePermission('hr.update'), controller.updateAttendancePolicy)

// Records
router.post('/check-in', requirePermission('hr.create'), controller.recordCheckIn)
router.post('/check-out', requirePermission('hr.create'), controller.recordCheckOut)
router.get('/records', requirePermission('hr.view'), controller.getAttendanceRecords)
router.post('/records/mark', requirePermission('hr.create'), controller.markAttendance)
router.put('/records/:id', requirePermission('hr.update'), controller.updateAttendanceRecord)

// Reports
router.get('/reports', requirePermission('hr.view'), controller.getAttendanceReport)
router.get('/reports/:employeeId/summary', requirePermission('hr.view'), controller.getEmployeeAttendanceSummary)

module.exports = router
