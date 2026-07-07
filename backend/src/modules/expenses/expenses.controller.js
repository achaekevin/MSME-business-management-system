const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./expenses.service')

const list = asyncHandler(async (req, res) => {
  const result = await service.listExpenses(req.businessId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const getOne = asyncHandler(async (req, res) => {
  success(res, await service.getExpense(req.businessId, req.params.id))
})

const create = asyncHandler(async (req, res) => {
  created(res, await service.createExpense(req.businessId, req.body, req.userId, req), 'Expense recorded')
})

const update = asyncHandler(async (req, res) => {
  success(res, await service.updateExpense(req.businessId, req.params.id, req.body, req), 'Expense updated')
})

const remove = asyncHandler(async (req, res) => {
  await service.deleteExpense(req.businessId, req.params.id, req)
  noContent(res)
})

const approve = asyncHandler(async (req, res) => {
  success(res, await service.approveExpense(req.businessId, req.params.id, req.userId, req), 'Expense approved')
})

const reject = asyncHandler(async (req, res) => {
  success(res, await service.rejectExpense(req.businessId, req.params.id, req.body.reason, req), 'Expense rejected')
})

const summary = asyncHandler(async (req, res) => {
  success(res, await service.getExpenseSummary(req.businessId, req.query))
})

const categories = asyncHandler(async (req, res) => {
  success(res, await service.getCategories(req.businessId))
})

module.exports = { list, getOne, create, update, remove, approve, reject, summary, categories }
