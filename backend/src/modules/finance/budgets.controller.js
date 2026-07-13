const budgetsService = require('./budgets.service')
const { asyncHandler } = require('../../helpers/asyncHandler')
const { successResponse } = require('../../helpers/response')

// Budgets
exports.createBudget = asyncHandler(async (req, res) => {
  const budget = await budgetsService.createBudget(req.businessId, req.body)
  successResponse(res, budget, 'Budget created', 201)
})

exports.getBudgets = asyncHandler(async (req, res) => {
  const budgets = await budgetsService.getBudgets(req.businessId, req.query)
  successResponse(res, budgets)
})

exports.getBudgetDetails = asyncHandler(async (req, res) => {
  const budget = await budgetsService.getBudgetDetails(req.params.id)
  successResponse(res, budget)
})

exports.updateBudget = asyncHandler(async (req, res) => {
  const budget = await budgetsService.updateBudget(req.params.id, req.body)
  successResponse(res, budget, 'Budget updated')
})

exports.approveBudget = asyncHandler(async (req, res) => {
  const budget = await budgetsService.approveBudget(req.params.id, req.userId)
  successResponse(res, budget, 'Budget approved')
})

// Budget Items
exports.addBudgetItem = asyncHandler(async (req, res) => {
  const item = await budgetsService.addBudgetItem(req.params.id, req.body)
  successResponse(res, item, 'Budget item added', 201)
})

exports.updateBudgetItem = asyncHandler(async (req, res) => {
  const item = await budgetsService.updateBudgetItem(req.params.itemId, req.body)
  successResponse(res, item, 'Budget item updated')
})

exports.deleteBudgetItem = asyncHandler(async (req, res) => {
  await budgetsService.deleteBudgetItem(req.params.itemId)
  successResponse(res, null, 'Budget item deleted')
})

// Budget Tracking
exports.syncBudgetActuals = asyncHandler(async (req, res) => {
  const budget = await budgetsService.syncBudgetActuals(req.params.id)
  successResponse(res, budget, 'Budget actuals synchronized')
})

exports.getBudgetVsActualReport = asyncHandler(async (req, res) => {
  const report = await budgetsService.getBudgetVsActualReport(req.params.id)
  successResponse(res, report)
})

exports.getActiveBudgets = asyncHandler(async (req, res) => {
  const budgets = await budgetsService.getActiveBudgets(req.businessId, req.query.date)
  successResponse(res, budgets)
})
