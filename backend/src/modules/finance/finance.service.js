const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// CASH ACCOUNTS
// ============================================================================

async function createCashAccount(businessId, data) {
  return await prisma.cashAccount.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getCashAccounts(businessId, filters = {}) {
  const where = { businessId }
  if (filters.isActive !== undefined) where.isActive = filters.isActive
  if (filters.branchId) where.branchId = filters.branchId

  return await prisma.cashAccount.findMany({
    where,
    include: {
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function getCashAccountBalance(cashAccountId) {
  const account = await prisma.cashAccount.findUnique({
    where: { id: cashAccountId },
    select: { balance: true, currency: true, name: true }
  })
  
  if (!account) throw ApiError.notFound('Cash account not found')
  return account
}

async function createCashTransaction(cashAccountId, data) {
  return await prisma.$transaction(async (tx) => {
    const account = await tx.cashAccount.findUnique({ where: { id: cashAccountId } })
    if (!account) throw ApiError.notFound('Cash account not found')

    const transaction = await tx.cashTransaction.create({
      data: {
        cashAccountId,
        ...data
      }
    })

    // Update account balance
    const balanceChange = data.type === 'receipt' ? data.amount : -data.amount
    await tx.cashAccount.update({
      where: { id: cashAccountId },
      data: { balance: { increment: balanceChange } }
    })

    return transaction
  })
}

async function getCashTransactions(cashAccountId, filters = {}) {
  const where = { cashAccountId }
  if (filters.type) where.type = filters.type
  if (filters.startDate && filters.endDate) {
    where.transactionDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  return await prisma.cashTransaction.findMany({
    where,
    orderBy: { transactionDate: 'desc' }
  })
}

// ============================================================================
// BANK ACCOUNTS
// ============================================================================

async function createBankAccount(businessId, data) {
  return await prisma.bankAccount.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getBankAccounts(businessId, isActive) {
  const where = { businessId }
  if (isActive !== undefined) where.isActive = isActive

  return await prisma.bankAccount.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
}

async function updateBankAccountBalance(bankAccountId, amount, operation = 'add') {
  return await prisma.bankAccount.update({
    where: { id: bankAccountId },
    data: {
      balance: operation === 'add' 
        ? { increment: amount }
        : { decrement: amount }
    }
  })
}

// ============================================================================
// INCOME TRACKING
// ============================================================================

async function createIncomeCategory(businessId, data) {
  return await prisma.incomeCategory.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getIncomeCategories(businessId) {
  return await prisma.incomeCategory.findMany({
    where: { businessId, isActive: true },
    include: {
      _count: {
        select: { incomes: true }
      }
    }
  })
}

async function createIncome(businessId, data) {
  const lastIncome = await prisma.incomeRecord.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: { incomeNumber: true }
  })

  const incomeNumber = generateIncomeNumber(lastIncome?.incomeNumber)

  return await prisma.incomeRecord.create({
    data: {
      businessId,
      incomeNumber,
      ...data
    },
    include: {
      category: true
    }
  })
}

async function getIncomes(businessId, filters = {}) {
  const where = { businessId }
  if (filters.categoryId) where.categoryId = filters.categoryId
  if (filters.startDate && filters.endDate) {
    where.incomeDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  return await prisma.incomeRecord.findMany({
    where,
    include: {
      category: true
    },
    orderBy: { incomeDate: 'desc' }
  })
}

async function getIncomeStats(businessId, startDate, endDate) {
  const where = {
    businessId,
    incomeDate: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  const [total, byCategory] = await Promise.all([
    prisma.incomeRecord.aggregate({
      where,
      _sum: { amount: true, taxAmount: true },
      _count: true
    }),
    prisma.incomeRecord.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true
    })
  ])

  const categories = await prisma.incomeCategory.findMany({
    where: { 
      businessId,
      id: { in: byCategory.map(c => c.categoryId) }
    }
  })

  return {
    total: {
      amount: Number(total._sum.amount || 0),
      taxAmount: Number(total._sum.taxAmount || 0),
      count: total._count
    },
    byCategory: byCategory.map(c => ({
      categoryId: c.categoryId,
      categoryName: categories.find(cat => cat.id === c.categoryId)?.name,
      amount: Number(c._sum.amount),
      count: c._count
    }))
  }
}

// ============================================================================
// EXPENSE TRACKING (Enhanced)
// ============================================================================

async function createExpenseCategory(businessId, data) {
  return await prisma.expenseCategory.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getExpenseCategories(businessId) {
  return await prisma.expenseCategory.findMany({
    where: { businessId, isActive: true },
    include: {
      _count: {
        select: { expenses: true }
      }
    }
  })
}

async function createExpense(businessId, data) {
  const lastExpense = await prisma.expenseRecord.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: { expenseNumber: true }
  })

  const expenseNumber = generateExpenseNumber(lastExpense?.expenseNumber)

  return await prisma.expenseRecord.create({
    data: {
      businessId,
      expenseNumber,
      ...data
    },
    include: {
      category: true
    }
  })
}

async function getExpenses(businessId, filters = {}) {
  const where = { businessId }
  if (filters.categoryId) where.categoryId = filters.categoryId
  if (filters.status) where.status = filters.status
  if (filters.startDate && filters.endDate) {
    where.expenseDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  return await prisma.expenseRecord.findMany({
    where,
    include: {
      category: true
    },
    orderBy: { expenseDate: 'desc' }
  })
}

async function approveExpense(expenseId, approvedBy) {
  return await prisma.expenseRecord.update({
    where: { id: expenseId },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    }
  })
}

async function getExpenseStats(businessId, startDate, endDate) {
  const where = {
    businessId,
    expenseDate: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  const [total, byCategory, byStatus] = await Promise.all([
    prisma.expenseRecord.aggregate({
      where,
      _sum: { amount: true, taxAmount: true },
      _count: true
    }),
    prisma.expenseRecord.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true
    }),
    prisma.expenseRecord.groupBy({
      by: ['status'],
      where,
      _sum: { amount: true },
      _count: true
    })
  ])

  const categories = await prisma.expenseCategory.findMany({
    where: { 
      businessId,
      id: { in: byCategory.map(c => c.categoryId) }
    }
  })

  return {
    total: {
      amount: Number(total._sum.amount || 0),
      taxAmount: Number(total._sum.taxAmount || 0),
      count: total._count
    },
    byCategory: byCategory.map(c => ({
      categoryId: c.categoryId,
      categoryName: categories.find(cat => cat.id === c.categoryId)?.name,
      amount: Number(c._sum.amount),
      count: c._count
    })),
    byStatus: byStatus.map(s => ({
      status: s.status,
      amount: Number(s._sum.amount),
      count: s._count
    }))
  }
}

// ============================================================================
// PAYMENT RECONCILIATION
// ============================================================================

async function createReconciliation(businessId, data) {
  const difference = Number(data.closingBalance) - Number(data.systemBalance)
  
  return await prisma.paymentReconciliation.create({
    data: {
      businessId,
      difference,
      ...data
    }
  })
}

async function getReconciliations(businessId, filters = {}) {
  const where = { businessId }
  if (filters.status) where.status = filters.status
  if (filters.bankAccountId) where.bankAccountId = filters.bankAccountId

  return await prisma.paymentReconciliation.findMany({
    where,
    include: {
      items: true
    },
    orderBy: { statementDate: 'desc' }
  })
}

async function addReconciliationItem(reconciliationId, data) {
  return await prisma.paymentReconciliationItem.create({
    data: {
      reconciliationId,
      ...data
    }
  })
}

async function markReconciled(reconciliationId, reconciledBy) {
  return await prisma.paymentReconciliation.update({
    where: { id: reconciliationId },
    data: {
      status: 'reconciled',
      reconciledBy,
      reconciledAt: new Date()
    }
  })
}

// ============================================================================
// CASH FLOW REPORT
// ============================================================================

async function getCashFlowReport(businessId, startDate, endDate) {
  const [cashIn, cashOut, openingCash, closingCash] = await Promise.all([
    // Cash Inflows
    prisma.incomeRecord.aggregate({
      where: {
        businessId,
        incomeDate: { gte: new Date(startDate), lte: new Date(endDate) }
      },
      _sum: { amount: true }
    }),
    // Cash Outflows
    prisma.expenseRecord.aggregate({
      where: {
        businessId,
        expenseDate: { gte: new Date(startDate), lte: new Date(endDate) },
        status: 'paid'
      },
      _sum: { amount: true }
    }),
    // Opening Cash
    prisma.cashAccount.aggregate({
      where: { businessId, isActive: true },
      _sum: { balance: true }
    }),
    // Closing Cash
    prisma.bankAccount.aggregate({
      where: { businessId, isActive: true },
      _sum: { balance: true }
    })
  ])

  const netCashFlow = Number(cashIn._sum.amount || 0) - Number(cashOut._sum.amount || 0)

  return {
    period: { startDate, endDate },
    inflows: {
      operations: Number(cashIn._sum.amount || 0),
      total: Number(cashIn._sum.amount || 0)
    },
    outflows: {
      operations: Number(cashOut._sum.amount || 0),
      total: Number(cashOut._sum.amount || 0)
    },
    netCashFlow,
    openingBalance: Number(openingCash._sum.balance || 0),
    closingBalance: Number(openingCash._sum.balance || 0) + netCashFlow
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateIncomeNumber(lastNumber) {
  if (!lastNumber) return 'INC-0001'
  const num = parseInt(lastNumber.split('-')[1]) + 1
  return `INC-${String(num).padStart(4, '0')}`
}

function generateExpenseNumber(lastNumber) {
  if (!lastNumber) return 'EXP-0001'
  const num = parseInt(lastNumber.split('-')[1]) + 1
  return `EXP-${String(num).padStart(4, '0')}`
}

module.exports = {
  // Cash Accounts
  createCashAccount,
  getCashAccounts,
  getCashAccountBalance,
  createCashTransaction,
  getCashTransactions,
  
  // Bank Accounts
  createBankAccount,
  getBankAccounts,
  updateBankAccountBalance,
  
  // Income
  createIncomeCategory,
  getIncomeCategories,
  createIncome,
  getIncomes,
  getIncomeStats,
  
  // Expenses
  createExpenseCategory,
  getExpenseCategories,
  createExpense,
  getExpenses,
  approveExpense,
  getExpenseStats,
  
  // Reconciliation
  createReconciliation,
  getReconciliations,
  addReconciliationItem,
  markReconciled,
  
  // Reports
  getCashFlowReport
}
