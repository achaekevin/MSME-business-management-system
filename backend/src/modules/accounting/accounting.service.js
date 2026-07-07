const repo = require('./accounting.repository')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')

// ── Chart of Accounts ─────────────────────────────────────────────────────────

async function listAccounts(businessId) {
  const [accounts, lines] = await Promise.all([
    repo.findAllAccounts(businessId),
    repo.aggregateJournalLineBalances(businessId)
  ])

  const balanceMap = {}
  for (const l of lines) {
    balanceMap[l.accountId] = {
      debit: Number(l._sum.debit || 0),
      credit: Number(l._sum.credit || 0)
    }
  }

  return accounts.map((acc) => {
    const b = balanceMap[acc.id] || { debit: 0, credit: 0 }
    const balance = ['asset', 'expense'].includes(acc.type) ? b.debit - b.credit : b.credit - b.debit
    return { ...acc, balance }
  })
}

async function getAccount(businessId, id) {
  const account = await repo.findAccountById(businessId, id)
  if (!account) throw ApiError.notFound('Account not found')
  return account
}

async function createAccount(businessId, data, req) {
  const existing = await repo.findAccountByCode(businessId, data.code)
  if (existing) throw ApiError.conflict(`Account code "${data.code}" is already in use`)

  if (data.parentId) {
    const parent = await repo.findAccountById_parent(businessId, data.parentId)
    if (!parent) throw ApiError.badRequest('Parent account not found')
  }

  const account = await repo.createAccount(businessId, data)
  req?.audit?.('account.created', 'Account', account.id, { code: account.code, name: account.name })
  return account
}

async function updateAccount(businessId, id, data, req) {
  const existing = await repo.findAccountById(businessId, id)
  if (!existing) throw ApiError.notFound('Account not found')

  if (data.code && data.code !== existing.code) {
    const conflict = await repo.findAccountByCode(businessId, data.code, id)
    if (conflict) throw ApiError.conflict(`Account code "${data.code}" is already in use`)
  }

  const updated = await repo.updateAccount(id, data)
  req?.audit?.('account.updated', 'Account', id, { changes: data })
  return updated
}

// ── Journal Entries ───────────────────────────────────────────────────────────

async function listJournals(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total] = await repo.findJournals(businessId, {
    skip, take, orderBy,
    startDate: query.startDate,
    endDate: query.endDate,
    search: query.search
  })
  return { items, total, page, limit }
}

async function getJournal(businessId, id) {
  const entry = await repo.findJournalById(businessId, id)
  if (!entry) throw ApiError.notFound('Journal entry not found')
  return entry
}

async function createJournal(businessId, data, userId, req) {
  const { date, description, reference, lines } = data

  // Validate balanced entry
  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0)
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw ApiError.badRequest(
      `Journal entry is not balanced. Debits (${totalDebit.toFixed(2)}) ≠ Credits (${totalCredit.toFixed(2)})`
    )
  }
  if (lines.length < 2) throw ApiError.badRequest('A journal entry must have at least 2 lines')

  // Validate all accounts belong to this business
  const accountIds = [...new Set(lines.map((l) => l.accountId))]
  const accounts = await repo.findAccountsByIds(businessId, accountIds)
  if (accounts.length !== accountIds.length) {
    throw ApiError.badRequest('One or more accounts not found in this business')
  }

  const count = await repo.countJournals(businessId)
  const entryNumber = `JE-${String(count + 1).padStart(5, '0')}`

  const entry = await repo.createJournal(businessId, entryNumber, date, description, reference, userId, lines)
  req?.audit?.('journal.created', 'JournalEntry', entry.id, { entryNumber, totalDebit })
  return entry
}

// ── Financial Reports ─────────────────────────────────────────────────────────

async function getTrialBalance(businessId, query) {
  const lines = await repo.getJournalLinesForTrialBalance(businessId, query.asOf)

  const byAccount = {}
  for (const l of lines) {
    const key = l.accountId
    if (!byAccount[key]) byAccount[key] = { ...l.account, debit: 0, credit: 0 }
    byAccount[key].debit += Number(l.debit)
    byAccount[key].credit += Number(l.credit)
  }

  const rows = Object.values(byAccount).sort((a, b) => a.code.localeCompare(b.code))
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0)

  return {
    rows, totalDebit, totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    asOf: query.asOf || new Date().toISOString()
  }
}

async function getBalanceSheet(businessId, query) {
  const accounts = await listAccounts(businessId)

  const assets = accounts.filter((a) => a.type === 'asset' && !a.parentId)
  const liabilities = accounts.filter((a) => a.type === 'liability' && !a.parentId)
  const equity = accounts.filter((a) => a.type === 'equity' && !a.parentId)

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0)
  const totalEquity = equity.reduce((s, a) => s + a.balance, 0)

  const { netProfit } = await getProfitAndLoss(businessId, query)

  return {
    assets: { accounts: assets, total: totalAssets },
    liabilities: { accounts: liabilities, total: totalLiabilities },
    equity: { accounts: equity, retainedEarnings: netProfit, total: totalEquity + netProfit },
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + netProfit)) < 0.01
  }
}

async function getProfitAndLoss(businessId, query) {
  const lines = await repo.getJournalLinesForPL(businessId, query.startDate, query.endDate)

  const byAccount = {}
  for (const l of lines) {
    const key = l.accountId
    if (!byAccount[key]) byAccount[key] = { ...l.account, debit: 0, credit: 0 }
    byAccount[key].debit += Number(l.debit)
    byAccount[key].credit += Number(l.credit)
  }

  const rows = Object.values(byAccount)
  const income = rows.filter((r) => r.type === 'income').map((r) => ({ ...r, balance: r.credit - r.debit }))
  const expenses = rows.filter((r) => r.type === 'expense').map((r) => ({ ...r, balance: r.debit - r.credit }))

  const totalIncome = income.reduce((s, r) => s + r.balance, 0)
  const totalExpenses = expenses.reduce((s, r) => s + r.balance, 0)
  const netProfit = totalIncome - totalExpenses

  return { income, totalIncome, expenses, totalExpenses, netProfit, grossProfit: netProfit }
}

async function getGeneralLedger(businessId, accountId, query) {
  const account = await repo.findAccountById(businessId, accountId)
  if (!account) throw ApiError.notFound('Account not found')

  const { skip, take, page, limit } = parsePagination(query)
  const [lines, total] = await repo.getLedgerLines(accountId, businessId, {
    skip, take,
    startDate: query.startDate,
    endDate: query.endDate
  })

  // Compute running balance
  let runningBalance = 0
  const withBalance = lines.map((l) => {
    const debit = Number(l.debit)
    const credit = Number(l.credit)
    runningBalance += ['asset', 'expense'].includes(account.type)
      ? debit - credit
      : credit - debit
    return { ...l, runningBalance }
  })

  return { account, lines: withBalance, total, page, limit }
}

async function getTaxReport(businessId, query) {
  const [salesTax, purchaseTax] = await repo.getTaxData(businessId, query.startDate, query.endDate)

  const outputTax = Number(salesTax._sum.taxAmount || 0)
  const inputTax = Number(purchaseTax._sum.taxAmount || 0)
  const netVat = outputTax - inputTax

  return {
    outputTax, inputTax, netVat,
    salesTotal: Number(salesTax._sum.total || 0), salesCount: salesTax._count,
    purchasesTotal: Number(purchaseTax._sum.total || 0), purchasesCount: purchaseTax._count
  }
}

module.exports = {
  listAccounts, getAccount, createAccount, updateAccount,
  listJournals, getJournal, createJournal,
  getTrialBalance, getBalanceSheet, getProfitAndLoss, getGeneralLedger, getTaxReport
}
