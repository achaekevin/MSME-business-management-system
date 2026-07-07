const express = require('express')
const router = express.Router()
const controller = require('./payroll.controller')
const validators = require('./payroll.validators')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Payroll
 *   description: Payroll processing, approval workflow, and payslip generation
 */

router.get('/', requirePermission(PERMISSIONS.EMPLOYEES_PAYROLL), controller.list)
router.get('/:id', requirePermission(PERMISSIONS.EMPLOYEES_PAYROLL), controller.getOne)
router.post('/process', requirePermission(PERMISSIONS.EMPLOYEES_PAYROLL), validate(validators.processPayrollSchema), controller.process)
router.post('/:id/approve', requirePermission(PERMISSIONS.EMPLOYEES_PAYROLL), controller.approve)
router.post('/:id/disburse', requirePermission(PERMISSIONS.EMPLOYEES_PAYROLL), controller.disburse)
router.get('/:id/payslips/:employeeId', requirePermission(PERMISSIONS.EMPLOYEES_PAYROLL), controller.getPayslip)
router.get('/:id/payslips/:employeeId/pdf', requirePermission(PERMISSIONS.EMPLOYEES_PAYROLL), controller.downloadPayslipPdf)

module.exports = router
