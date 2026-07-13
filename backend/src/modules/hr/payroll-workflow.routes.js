const express = require('express')
const router = express.Router()
const controller = require('./payroll-workflow.controller')
const { authenticate } = require('../../middleware/auth')
const { requirePermission } = require('../../middleware/permission.middleware')

// All routes require authentication
router.use(authenticate)

// ── Payroll Generation ────────────────────────────────────────────────────────
router.post(
  '/:periodId/generate',
  requirePermission('payroll:process'),
  controller.generatePayroll
)

router.post(
  '/:periodId/post-to-accounting',
  requirePermission('payroll:approve'),
  controller.postToAccounting
)

router.post(
  '/:periodId/execute',
  requirePermission('payroll:approve'),
  controller.executeWorkflow
)

// ── Calculations & Analysis ───────────────────────────────────────────────────
router.get(
  '/calculate-workdays',
  requirePermission('payroll:read'),
  controller.calculateWorkDays
)

router.get(
  '/calculate-overtime',
  requirePermission('payroll:read'),
  controller.calculateOvertime
)

router.post(
  '/preview',
  requirePermission('payroll:read'),
  controller.previewPayroll
)

router.get(
  '/payslip/:payslipId',
  requirePermission('payroll:read'),
  controller.getDetailedPayslip
)

router.get(
  '/summary',
  requirePermission('payroll:read'),
  controller.getPayrollSummary
)

module.exports = router
