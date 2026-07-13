const asyncHandler = require('../../helpers/asyncHandler')
const taxService = require('./tax.service')
const { successResponse } = require('../../helpers/response')

// Tax Rates
exports.createTaxRate = asyncHandler(async (req, res) => {
  const taxRate = await taxService.createTaxRate(req.businessId, req.body)
  successResponse(res, taxRate, 'Tax rate created', 201)
})

exports.getTaxRates = asyncHandler(async (req, res) => {
  const taxRates = await taxService.getTaxRates(req.businessId, req.query)
  successResponse(res, taxRates)
})

exports.updateTaxRate = asyncHandler(async (req, res) => {
  const taxRate = await taxService.updateTaxRate(req.params.id, req.body)
  successResponse(res, taxRate, 'Tax rate updated')
})

exports.deleteTaxRate = asyncHandler(async (req, res) => {
  await taxService.deleteTaxRate(req.params.id)
  successResponse(res, null, 'Tax rate deleted')
})

// Tax Exemptions
exports.createTaxExemption = asyncHandler(async (req, res) => {
  const exemption = await taxService.createTaxExemption(req.businessId, req.body)
  successResponse(res, exemption, 'Tax exemption created', 201)
})

exports.getTaxExemptions = asyncHandler(async (req, res) => {
  const exemptions = await taxService.getTaxExemptions(req.businessId, req.query)
  successResponse(res, exemptions)
})

exports.updateTaxExemption = asyncHandler(async (req, res) => {
  const exemption = await taxService.updateTaxExemption(req.params.id, req.body)
  successResponse(res, exemption, 'Tax exemption updated')
})

// Tax Payments
exports.createTaxPayment = asyncHandler(async (req, res) => {
  const payment = await taxService.createTaxPayment(req.businessId, req.body)
  successResponse(res, payment, 'Tax payment created', 201)
})

exports.getTaxPayments = asyncHandler(async (req, res) => {
  const payments = await taxService.getTaxPayments(req.businessId, req.query)
  successResponse(res, payments)
})

exports.updateTaxPayment = asyncHandler(async (req, res) => {
  const payment = await taxService.updateTaxPayment(req.params.id, req.body)
  successResponse(res, payment, 'Tax payment updated')
})

exports.markTaxPaymentPaid = asyncHandler(async (req, res) => {
  const payment = await taxService.markTaxPaymentPaid(req.params.id, req.body)
  successResponse(res, payment, 'Tax payment marked as paid')
})

// Tax Reports
exports.getTaxReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, taxRateId } = req.query
  const report = await taxService.getTaxReport(req.businessId, startDate, endDate, taxRateId)
  successResponse(res, report)
})

exports.calculateTaxLiability = asyncHandler(async (req, res) => {
  const { periodStart, periodEnd } = req.query
  const liability = await taxService.calculateTaxLiability(req.businessId, periodStart, periodEnd)
  successResponse(res, liability)
})
