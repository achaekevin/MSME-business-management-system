const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated } = require('../../helpers/response')
const service = require('./payroll.service')

const list = asyncHandler(async (req, res) => {
  const result = await service.listPayrollRuns(req.businessId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const getOne = asyncHandler(async (req, res) => {
  success(res, await service.getPayrollRun(req.businessId, req.params.id))
})

const process = asyncHandler(async (req, res) => {
  created(res, await service.processPayroll(req.businessId, req.body, req.userId, req), 'Payroll processed successfully')
})

const approve = asyncHandler(async (req, res) => {
  success(res, await service.approvePayroll(req.businessId, req.params.id, req), 'Payroll approved')
})

const disburse = asyncHandler(async (req, res) => {
  success(res, await service.disbursePayroll(req.businessId, req.params.id, req), 'Payroll disbursed')
})

const getPayslip = asyncHandler(async (req, res) => {
  success(res, await service.getPayslip(req.businessId, req.params.id, req.params.employeeId))
})

const downloadPayslipPdf = asyncHandler(async (req, res) => {
  const buffer = await service.generatePayslipPdf(req.businessId, req.params.id, req.params.employeeId)
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="payslip-${req.params.employeeId}.pdf"`
  })
  res.send(buffer)
})

module.exports = { list, getOne, process, approve, disburse, getPayslip, downloadPayslipPdf }
