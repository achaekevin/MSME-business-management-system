const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')
const { prisma } = require('../../config/database')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const { reportGenerationQueue } = require('../../queues')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext)

// ── Inline report data (fast JSON responses for frontend dashboards) ─────────

router.get('/sales', requirePermission(PERMISSIONS.REPORTS_VIEW), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const businessId = req.businessId

  const where = {
    businessId,
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {})
  }

  const [stats, bySeries] = await Promise.all([
    prisma.saleOrder.aggregate({ where, _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.saleOrder.groupBy({
      by: ['status'], where, _sum: { total: true }, _count: true
    })
  ])

  success(res, {
    totalRevenue: stats._sum.total || 0,
    totalCollected: stats._sum.amountPaid || 0,
    totalOrders: stats._count,
    byStatus: bySeries
  })
}))

router.get('/profit-loss', requirePermission(PERMISSIONS.REPORTS_VIEW), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const businessId = req.businessId

  const dateFilter = {}
  if (startDate) dateFilter.gte = new Date(startDate)
  if (endDate) dateFilter.lte = new Date(endDate)
  const where = { businessId, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) }

  const [salesAgg, expensesAgg] = await Promise.all([
    prisma.saleOrder.aggregate({ where: { ...where, status: { not: 'voided' } }, _sum: { total: true } }),
    prisma.expense.aggregate({ where: { ...where, ...(startDate || endDate ? { date: dateFilter } : {}) }, _sum: { amount: true } })
  ])

  const revenue = Number(salesAgg._sum.total || 0)
  const expenses = Number(expensesAgg._sum.amount || 0)

  success(res, { revenue, expenses, grossProfit: revenue - expenses, netProfit: revenue - expenses })
}))

router.get('/balance-sheet', requirePermission(PERMISSIONS.REPORTS_VIEW), asyncHandler(async (req, res) => {
  const businessId = req.businessId

  const accounts = await prisma.account.findMany({
    where: { businessId },
    include: {
      journalLines: { select: { debit: true, credit: true } }
    }
  })

  const sheet = accounts.map((acc) => {
    const totalDebit = acc.journalLines.reduce((s, l) => s + Number(l.debit), 0)
    const totalCredit = acc.journalLines.reduce((s, l) => s + Number(l.credit), 0)
    const balance = ['asset', 'expense'].includes(acc.type) ? totalDebit - totalCredit : totalCredit - totalDebit
    return { id: acc.id, code: acc.code, name: acc.name, type: acc.type, balance }
  })

  const assets = sheet.filter((a) => a.type === 'asset').reduce((s, a) => s + a.balance, 0)
  const liabilities = sheet.filter((a) => a.type === 'liability').reduce((s, a) => s + a.balance, 0)
  const equity = sheet.filter((a) => a.type === 'equity').reduce((s, a) => s + a.balance, 0)

  success(res, { accounts: sheet, totals: { assets, liabilities, equity, balance: assets - liabilities - equity } })
}))

router.get('/trial-balance', requirePermission(PERMISSIONS.REPORTS_VIEW), asyncHandler(async (req, res) => {
  const businessId = req.businessId

  const lines = await prisma.journalLine.findMany({
    where: { entry: { businessId } },
    include: { account: { select: { id: true, code: true, name: true, type: true } } }
  })

  const byAccount = {}
  for (const l of lines) {
    const key = l.accountId
    if (!byAccount[key]) byAccount[key] = { ...l.account, debit: 0, credit: 0 }
    byAccount[key].debit += Number(l.debit)
    byAccount[key].credit += Number(l.credit)
  }

  const rows = Object.values(byAccount)
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0)

  success(res, { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 })
}))

// ── Async report export (queued — returns jobId, user notified when ready) ───

router.post('/export', requirePermission(PERMISSIONS.REPORTS_EXPORT), asyncHandler(async (req, res) => {
  const { reportType = 'sales', format = 'pdf', filters = {} } = req.body

  const job = await reportGenerationQueue.add('generate-report', {
    businessId: req.businessId,
    userId: req.userId,
    reportType, format, filters
  })

  success(res, { jobId: job.id, message: 'Report generation started. You will be notified when it is ready.' })
}))

module.exports = router
