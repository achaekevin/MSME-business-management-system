const asyncHandler = require('../../helpers/asyncHandler')
const { successResponse } = require('../../helpers/response')
const payrollWorkflowService = require('./payroll-workflow.service')

// ============================================================================
// PAYROLL GENERATION
// ============================================================================

/**
 * Generate payroll for a period
 * POST /api/hr/payroll-workflow/:periodId/generate
 */
exports.generatePayroll = asyncHandler(async (req, res) => {
  const { periodId } = req.params
  const userId = req.user.id

  const result = await payrollWorkflowService.generatePayrollForPeriod(
    periodId,
    userId
  )

  successResponse(res, result, 'Payroll generated successfully', 200)
})

/**
 * Post payroll to accounting
 * POST /api/hr/payroll-workflow/:periodId/post-to-accounting
 */
exports.postToAccounting = asyncHandler(async (req, res) => {
  const { periodId } = req.params
  const userId = req.user.id

  const result = await payrollWorkflowService.postPayrollToAccounting(
    periodId,
    userId
  )

  successResponse(res, result, 'Payroll posted to accounting successfully', 200)
})

/**
 * Execute complete payroll workflow
 * POST /api/hr/payroll-workflow/:periodId/execute
 */
exports.executeWorkflow = asyncHandler(async (req, res) => {
  const { periodId } = req.params
  const userId = req.user.id

  const result = await payrollWorkflowService.executeCompletePayrollWorkflow(
    periodId,
    userId
  )

  successResponse(res, result, 'Complete payroll workflow executed successfully', 200)
})

// ============================================================================
// CALCULATIONS & ANALYSIS
// ============================================================================

/**
 * Calculate work days for employee
 * GET /api/hr/payroll-workflow/calculate-workdays
 */
exports.calculateWorkDays = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate } = req.query

  const result = await payrollWorkflowService.calculateWorkDays(
    employeeId,
    new Date(startDate),
    new Date(endDate)
  )

  successResponse(res, result, 'Work days calculated successfully', 200)
})

/**
 * Calculate overtime for employee
 * GET /api/hr/payroll-workflow/calculate-overtime
 */
exports.calculateOvertime = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate, hourlyRate } = req.query

  const result = await payrollWorkflowService.calculateOvertime(
    employeeId,
    new Date(startDate),
    new Date(endDate),
    parseFloat(hourlyRate)
  )

  successResponse(res, result, 'Overtime calculated successfully', 200)
})

/**
 * Get detailed payslip
 * GET /api/hr/payroll-workflow/payslip/:payslipId
 */
exports.getDetailedPayslip = asyncHandler(async (req, res) => {
  const { payslipId } = req.params

  const result = await payrollWorkflowService.getDetailedPayslip(payslipId)

  successResponse(res, result, 'Payslip retrieved successfully', 200)
})

/**
 * Get payroll summary
 * GET /api/hr/payroll-workflow/summary
 */
exports.getPayrollSummary = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId
  const { year, month } = req.query

  const result = await payrollWorkflowService.getPayrollSummary(
    businessId,
    parseInt(year),
    parseInt(month)
  )

  successResponse(res, result, 'Payroll summary retrieved successfully', 200)
})

/**
 * Preview payroll calculation for employee
 * POST /api/hr/payroll-workflow/preview
 */
exports.previewPayroll = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate } = req.body

  // Get employee
  const { prisma } = require('../../config/database')
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  })

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' })
  }

  // Calculate work days
  const workDays = await payrollWorkflowService.calculateWorkDays(
    employeeId,
    new Date(startDate),
    new Date(endDate)
  )

  // Calculate overtime
  const hourlyRate = employee.salaryType === 'monthly'
    ? Number(employee.salary) / 30 / 8
    : Number(employee.salary) / 8

  const overtime = await payrollWorkflowService.calculateOvertime(
    employeeId,
    new Date(startDate),
    new Date(endDate),
    hourlyRate
  )

  // Calculate salary
  const salary = await payrollWorkflowService.calculateSalaryComponents(
    employee,
    workDays.paidDays,
    workDays.totalWorkingDays,
    overtime.overtimeAmount
  )

  const preview = {
    employee: {
      id: employee.id,
      name: employee.name,
      employeeNumber: employee.employeeNumber
    },
    period: {
      startDate,
      endDate
    },
    workDays,
    overtime,
    salary
  }

  successResponse(res, preview, 'Payroll preview calculated successfully', 200)
})
