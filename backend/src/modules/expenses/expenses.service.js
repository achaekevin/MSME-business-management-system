const repo = require('./expenses.repository')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const dayjs = require('dayjs')

async function listExpenses(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total, aggregate] = await repo.findMany(businessId, {
    skip, take, orderBy,
    search: query.search,
    category: query.category,
    startDate: query.startDate,
    endDate: query.endDate,
    paymentMethod: query.paymentMethod
  })
  return { items, total, page, limit, totalAmount: Number(aggregate._sum.amount || 0) }
}

async function getExpense(businessId, id) {
  const expense = await repo.findById(businessId, id)
  if (!expense) throw ApiError.notFound('Expense not found')
  return expense
}

async function createExpense(businessId, data, userId, req) {
  const expense = await repo.create(businessId, { ...data, createdById: userId, status: 'pending' })
  req?.audit?.('expense.created', 'Expense', expense.id, {
    category: expense.category, amount: expense.amount
  })
  return expense
}

async function updateExpense(businessId, id, data, req) {
  const expense = await repo.findById(businessId, id)
  if (!expense) throw ApiError.notFound('Expense not found')
  if (expense.status === 'approved') throw ApiError.conflict('Approved expenses cannot be edited')

  const updated = await repo.update(id, data)
  req?.audit?.('expense.updated', 'Expense', id, { changes: data })
  return updated
}

async function deleteExpense(businessId, id, req) {
  const expense = await repo.findById(businessId, id)
  if (!expense) throw ApiError.notFound('Expense not found')
  if (expense.status === 'approved') throw ApiError.conflict('Cannot delete an approved expense')

  await repo.remove(id)
  req?.audit?.('expense.deleted', 'Expense', id, { category: expense.category, amount: expense.amount })
  return { deleted: true }
}

async function approveExpense(businessId, id, approverId, req) {
  const expense = await repo.findById(businessId, id)
  if (!expense) throw ApiError.notFound('Expense not found')
  if (expense.status !== 'pending') throw ApiError.conflict(`Expense is already ${expense.status}`)

  const approved = await repo.approve(id, approverId)
  req?.audit?.('expense.approved', 'Expense', id, { amount: expense.amount })
  return approved
}

async function rejectExpense(businessId, id, reason, req) {
  const expense = await repo.findById(businessId, id)
  if (!expense) throw ApiError.notFound('Expense not found')
  if (expense.status !== 'pending') throw ApiError.conflict(`Expense is already ${expense.status}`)

  const rejected = await repo.reject(id, reason)
  req?.audit?.('expense.rejected', 'Expense', id, { reason })
  return rejected
}

async function getExpenseSummary(businessId, query) {
  const dateFilter = {}
  if (query.startDate) dateFilter.gte = new Date(query.startDate)
  if (query.endDate) dateFilter.lte = new Date(query.endDate)

  const [byCategory, trend] = await Promise.all([
    repo.groupByCategory(businessId, Object.keys(dateFilter).length ? dateFilter : null),
    repo.groupByMonth(businessId, dayjs().subtract(6, 'month').toDate())
  ])

  // Build monthly trend from flat records
  const monthMap = {}
  for (const row of trend) {
    const key = dayjs(row.date).format('MMM YYYY')
    if (!monthMap[key]) monthMap[key] = { name: key, total: 0, count: 0 }
    monthMap[key].total += Number(row.amount)
    monthMap[key].count++
  }

  const totalAmount = byCategory.reduce((s, c) => s + Number(c._sum.amount || 0), 0)

  return {
    totalAmount,
    byCategory: byCategory.map((c) => ({
      category: c.category,
      amount: Number(c._sum.amount || 0),
      count: c._count,
      percentage: totalAmount ? Math.round((Number(c._sum.amount || 0) / totalAmount) * 100) : 0
    })),
    trend: Object.values(monthMap)
  }
}

async function getCategories(businessId) {
  const rows = await repo.getDistinctCategories(businessId)
  const fromData = rows.map((r) => r.category)
  const defaults = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Transport', 'Office Supplies', 'Maintenance', 'Insurance', 'Taxes', 'Other']
  return [...new Set([...defaults, ...fromData])].sort()
}

module.exports = {
  listExpenses, getExpense, createExpense, updateExpense, deleteExpense,
  approveExpense, rejectExpense, getExpenseSummary, getCategories
}
