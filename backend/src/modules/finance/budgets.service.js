const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// BUDGETS
// ============================================================================

async function createBudget(businessId, data) {
  return await prisma.budget.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getBudgets(businessId, filters = {}) {
  const where = { businessId }
  if (filters.status) where.status = filters.status
  if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear
  if (filters.budgetType) where.budgetType = filters.budgetType

  return await prisma.budget.findMany({
    where,
    include: {
      _count: {
        select: { items: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function getBudgetDetails(budgetId) {
  return await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      items: {
        orderBy: { category: 'asc' }
      }
    }
  })
}

async function updateBudget(budgetId, data) {
  return await prisma.budget.update({
    where: { id: budgetId },
    data
  })
}

async function approveBudget(budgetId, approvedBy) {
  return await prisma.budget.update({
    where: { id: budgetId },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    }
  })
}

// ============================================================================
// BUDGET ITEMS
// ============================================================================

async function addBudgetItem(budgetId, data) {
  const variance = Number(data.actualAmount || 0) - Number(data.budgetedAmount)
  const variancePct = Number(data.budgetedAmount) > 0 
    ? (variance / Number(data.budgetedAmount)) * 100 
    : 0

  const item = await prisma.budgetItem.create({
    data: {
      budgetId,
      variance,
      variancePct,
      ...data
    }
  })

  // Update budget totals
  await updateBudgetTotals(budgetId)

  return item
}

async function updateBudgetItem(itemId, data) {
  if (data.budgetedAmount !== undefined || data.actualAmount !== undefined) {
    const existing = await prisma.budgetItem.findUnique({ where: { id: itemId } })
    const budgetedAmount = data.budgetedAmount !== undefined 
      ? Number(data.budgetedAmount) 
      : Number(existing.budgetedAmount)
    const actualAmount = data.actualAmount !== undefined 
      ? Number(data.actualAmount) 
      : Number(existing.actualAmount)

    data.variance = actualAmount - budgetedAmount
    data.variancePct = budgetedAmount > 0 ? (data.variance / budgetedAmount) * 100 : 0
  }

  const item = await prisma.budgetItem.update({
    where: { id: itemId },
    data
  })

  // Update budget totals
  await updateBudgetTotals(item.budgetId)

  return item
}

async function deleteBudgetItem(itemId) {
  const item = await prisma.budgetItem.delete({ where: { id: itemId } })
  await updateBudgetTotals(item.budgetId)
  return item
}

async function updateBudgetTotals(budgetId) {
  const items = await prisma.budgetItem.findMany({ where: { budgetId } })

  const totalBudget = items.reduce((sum, item) => sum + Number(item.budgetedAmount), 0)
  const totalActual = items.reduce((sum, item) => sum + Number(item.actualAmount), 0)
  const variance = totalActual - totalBudget

  return await prisma.budget.update({
    where: { id: budgetId },
    data: {
      totalBudget,
      totalActual,
      variance
    }
  })
}

// ============================================================================
// BUDGET TRACKING & REPORTS
// ============================================================================

async function syncBudgetActuals(budgetId) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { items: true }
  })

  if (!budget) throw ApiError.notFound('Budget not found')

  const startDate = new Date(budget.startDate)
  const endDate = new Date(budget.endDate)

  for (const item of budget.items) {
    let actualAmount = 0

    if (item.category === 'revenue') {
      const income = await prisma.incomeRecord.aggregate({
        where: {
          businessId: budget.businessId,
          incomeDate: { gte: startDate, lte: endDate },
          ...(item.accountId && { categoryId: item.accountId })
        },
        _sum: { amount: true }
      })
      actualAmount = Number(income._sum.amount || 0)
    } else if (item.category === 'expense') {
      const expense = await prisma.expenseRecord.aggregate({
        where: {
          businessId: budget.businessId,
          expenseDate: { gte: startDate, lte: endDate },
          status: 'paid',
          ...(item.accountId && { categoryId: item.accountId })
        },
        _sum: { amount: true }
      })
      actualAmount = Number(expense._sum.amount || 0)
    }

    await updateBudgetItem(item.id, { actualAmount })
  }

  return await getBudgetDetails(budgetId)
}

async function getBudgetVsActualReport(budgetId) {
  const budget = await getBudgetDetails(budgetId)
  if (!budget) throw ApiError.notFound('Budget not found')

  const revenue = budget.items.filter(i => i.category === 'revenue')
  const expenses = budget.items.filter(i => i.category === 'expense')
  const capex = budget.items.filter(i => i.category === 'capex')

  const summary = {
    revenue: {
      budgeted: revenue.reduce((sum, i) => sum + Number(i.budgetedAmount), 0),
      actual: revenue.reduce((sum, i) => sum + Number(i.actualAmount), 0),
      variance: revenue.reduce((sum, i) => sum + Number(i.variance), 0)
    },
    expenses: {
      budgeted: expenses.reduce((sum, i) => sum + Number(i.budgetedAmount), 0),
      actual: expenses.reduce((sum, i) => sum + Number(i.actualAmount), 0),
      variance: expenses.reduce((sum, i) => sum + Number(i.variance), 0)
    },
    capex: {
      budgeted: capex.reduce((sum, i) => sum + Number(i.budgetedAmount), 0),
      actual: capex.reduce((sum, i) => sum + Number(i.actualAmount), 0),
      variance: capex.reduce((sum, i) => sum + Number(i.variance), 0)
    }
  }

  summary.netIncome = {
    budgeted: summary.revenue.budgeted - summary.expenses.budgeted,
    actual: summary.revenue.actual - summary.expenses.actual,
    variance: summary.revenue.variance - summary.expenses.variance
  }

  return {
    budget: {
      id: budget.id,
      name: budget.name,
      fiscalYear: budget.fiscalYear,
      period: {
        start: budget.startDate,
        end: budget.endDate
      }
    },
    summary,
    details: {
      revenue,
      expenses,
      capex
    }
  }
}

async function getActiveBudgets(businessId, date = new Date()) {
  return await prisma.budget.findMany({
    where: {
      businessId,
      status: 'active',
      startDate: { lte: date },
      endDate: { gte: date }
    },
    include: {
      items: true
    }
  })
}

module.exports = {
  createBudget,
  getBudgets,
  getBudgetDetails,
  updateBudget,
  approveBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  syncBudgetActuals,
  getBudgetVsActualReport,
  getActiveBudgets
}
