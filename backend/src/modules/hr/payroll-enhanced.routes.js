const router = require('express').Router()
const controller = require('./payroll-enhanced.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Components
router.post('/components', requirePermission('hr.create'), controller.createPayrollComponent)
router.get('/components', requirePermission('hr.view'), controller.getPayrollComponents)
router.put('/components/:id', requirePermission('hr.update'), controller.updatePayrollComponent)

// Employee Components
router.post('/employee-components', requirePermission('hr.create'), controller.assignComponentToEmployee)
router.get('/employee-components/:employeeId', requirePermission('hr.view'), controller.getEmployeeComponents)
router.put('/employee-components/:id', requirePermission('hr.update'), controller.updateEmployeeComponent)

// Payroll Periods
router.post('/periods', requirePermission('hr.create'), controller.createPayrollPeriod)
router.get('/periods', requirePermission('hr.view'), controller.getPayrollPeriods)
router.post('/periods/:id/process', requirePermission('hr.approve'), controller.processPayroll)
router.post('/periods/:id/approve', requirePermission('hr.approve'), controller.approvePayroll)

// Payslips
router.get('/periods/:periodId/payslips', requirePermission('hr.view'), controller.getPayslips)
router.get('/payslips/:id', requirePermission('hr.view'), controller.getEmployeePayslip)

module.exports = router
