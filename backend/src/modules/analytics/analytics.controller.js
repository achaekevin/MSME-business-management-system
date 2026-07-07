const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')
const service = require('./analytics.service')

const kpi = asyncHandler(async (req, res) => {
  success(res, await service.getKpiSummary(req.businessId))
})

const revenueTrend = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months) || 6))
  success(res, await service.getRevenueTrend(req.businessId, months))
})

const salesTrend = asyncHandler(async (req, res) => {
  const groupBy = ['day', 'week', 'month'].includes(req.query.groupBy) ? req.query.groupBy : 'day'
  const days = Math.min(365, Math.max(7, parseInt(req.query.days) || 30))
  success(res, await service.getSalesTrend(req.businessId, groupBy, days))
})

const topProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30))
  success(res, await service.getTopProducts(req.businessId, limit, days))
})

const topCustomers = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30))
  success(res, await service.getTopCustomers(req.businessId, limit, days))
})

const customerGrowth = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months) || 6))
  success(res, await service.getCustomerGrowth(req.businessId, months))
})

const cashFlow = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months) || 6))
  success(res, await service.getCashFlow(req.businessId, months))
})

const inventory = asyncHandler(async (req, res) => {
  success(res, await service.getInventoryAnalytics(req.businessId))
})

module.exports = { kpi, revenueTrend, salesTrend, topProducts, topCustomers, customerGrowth, cashFlow, inventory }
