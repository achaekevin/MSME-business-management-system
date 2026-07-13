const asyncHandler = require('../../helpers/asyncHandler')
const payrollService = require('./payroll-enhanced.service')
const { successResponse } = require('../../helpers/response')

// Components
exports.createPayrollComponent = asyncHandler(async (req, res) => {
  const component = await payrollService.createPayrollComponent(req.businessId, req.body)
  successResponse(res, component, 'Payroll component created', 201)
})

exports.getPayrollComponents = asyncHandler(async (req, res) => {
  const components = await payrollService.getPayrollComponents(req.businessId, req.query.type)
  successResponse(res, components)
})

exports.updatePayrollComponent = asyncHandler(async (req, res) => {
  const component = await payrollService.updatePayrollComponent(req.params.id, req.body)
  successResponse(res, component, 'Payroll component updated')
})

// Employee Components
exports.assignComponentToEmployee = asyncHandler(async (req, res) => {
  const assignment = await payrollService.assignComponentToEmployee(
    req.body.employeeId,
    req.body.componentId,
    req.body
  )
  successResponse(res, assignment, 'Component assigned to employee', 201)
})

exports.getEmployeeComponents = asyncHandler(async (req, res) => {
  const components = await payrollService.getEmployeeComponents(req.params.employeeId)
  successResponse(res, components)
})

exports.updateEmployeeComponent = asyncHandler(async (req, res) => {
  const component = await payrollService.updateEmployeeComponent(req.params.id, req.body)
  successResponse(res, component, 'Employee component updated')
})

// Payroll Periods
exports.createPayrollPeriod = asyncHandler(async (req, res) => {
  const period = await payrollService.createPayrollPeriod(req.businessId, req.body)
  successResponse(res, period, 'Payroll period created', 201)
})

exports.getPayrollPeriods = asyncHandler(async (req, res) => {
  const periods = await payrollService.getPayrollPeriods(req.businessId, req.query)
  successResponse(res, periods)
})

exports.processPayroll = asyncHandler(async (req, res) => {
  const result = await payrollService.processPayroll(req.params.id, req.userId)
  successResponse(res, result, 'Payroll processed successfully')
})

exports.approvePayroll = asyncHandler(async (req, res) => {
  const period = await payrollService.approvePayroll(req.params.id, req.userId)
  successResponse(res, period, 'Payroll approved')
})

// Payslips
exports.getPayslips = asyncHandler(async (req, res) => {
  const payslips = await payrollService.getPayslips(req.params.periodId)
  successResponse(res, payslips)
})

exports.getEmployeePayslip = asyncHandler(async (req, res) => {
  const payslip = await payrollService.getEmployeePayslip(req.params.id)
  successResponse(res, payslip)
})
