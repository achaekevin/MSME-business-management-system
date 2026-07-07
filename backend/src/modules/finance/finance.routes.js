const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { z } = require('zod')
const { validate } = require('../../middleware/validation.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: Bank accounts, receivables, payables, and cash flow
 */

// ── Finance Dashboard ─────────────────────────────────────────────────────────
router.get('/dashboard', requirePermission(PERMISSIONS.FINANCE_VIEW), asyncHandler(async (req, res) => {
  const businessId = req.businessId

  const [
    cashBalance, totalReceivable, totalPayable,
    overdueInvoices, recentPayments, bankAccounts
  ] = await Promise.all([
    prisma.bankAccount.aggregate({ where: { businessId, isActive: true }, _sum: { balance: true } }),
    prisma.invoice.aggregate({ where: { businessId, status: { in: ['sent', 'partial', 'overdue'] } }, _sum: { balance: true } }),
    prisma.supplier.aggregate({ where: { businessId, isActive: true, balance: { gt: 0 } }, _sum: { balance: true } }),
    prisma.invoice.count({ where: { businessId, status: 'overdue' } }),
    prisma.payment.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 10, include: { customer: { select: { id: true, name: true } } } }),
    prisma.bankAccount.findMany({ where: { businessId, isActive: true } })
  ])

  success(res, {
    cashBalance: Number(cashBalance._sum.balance || 0),
    totalReceivable: Number(totalReceivable._sum.balance || 0),
    totalPayable: Number(totalPayable._sum.balance || 0),
    overdueInvoices,
    recentPayments,
    bankAccounts
  })
}))

// ── Bank Accounts ─────────────────────────────────────────────────────────────
const bankAccountSchema = z.object({
  name: z.string().min(1),
  accountNumber: z.string().min(1),
  bankName: z.string().min(1),
  balance: z.coerce.number().default(0),
  currency: z.string().length(3).default('USD')
})

router.get('/bank-accounts', requirePermission(PERMISSIONS.FINANCE_VIEW), asyncHandler(async (req, res) => {
  success(res, await prisma.bankAccount.findMany({ where: { businessId: req.businessId }, orderBy: { name: 'asc' } }))
}))

router.post('/bank-accounts', requirePermission(PERMISSIONS.FINANCE_CREATE), validate(bankAccountSchema), asyncHandler(async (req, res) => {
  const { businessId: _b, ...rest } = req.body
  const account = await prisma.bankAccount.create({ data: { ...rest, businessId: req.businessId } })
  req.audit?.('bank_account.created', 'BankAccount', account.id, { name: account.name })
  created(res, account, 'Bank account added')
}))

router.put('/bank-accounts/:id', requirePermission(PERMISSIONS.FINANCE_CREATE), asyncHandler(async (req, res) => {
  const account = await prisma.bankAccount.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
  if (!account) throw ApiError.notFound('Bank account not found')
  const updated = await prisma.bankAccount.update({ where: { id: req.params.id }, data: req.body })
  success(res, updated, 'Bank account updated')
}))

router.delete('/bank-accounts/:id', requirePermission(PERMISSIONS.FINANCE_CREATE), asyncHandler(async (req, res) => {
  const account = await prisma.bankAccount.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
  if (!account) throw ApiError.notFound('Bank account not found')
  await prisma.bankAccount.update({ where: { id: req.params.id }, data: { isActive: false } })
  noContent(res)
}))

// ── Accounts Receivable ───────────────────────────────────────────────────────
router.get('/receivables', requirePermission(PERMISSIONS.FINANCE_VIEW), asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const where = { businessId: req.businessId, status: { in: ['sent', 'partial', 'overdue'] } }

  const now = new Date()
  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where, skip, take, orderBy: { dueDate: 'asc' },
      include: { customer: { select: { id: true, name: true, phone: true } } }
    }),
    prisma.invoice.count({ where })
  ])

  const enriched = items.map((inv) => ({
    ...inv,
    isOverdue: inv.dueDate < now && inv.status !== 'paid',
    daysOverdue: inv.dueDate < now ? Math.floor((now - inv.dueDate) / 86400000) : 0
  }))

  // Auto-mark overdue
  const overdueIds = enriched.filter((i) => i.isOverdue && i.status !== 'overdue').map((i) => i.id)
  if (overdueIds.length > 0) {
    await prisma.invoice.updateMany({ where: { id: { in: overdueIds } }, data: { status: 'overdue' } })
  }

  paginated(res, enriched, total, page, limit)
}))

// ── Accounts Payable ──────────────────────────────────────────────────────────
router.get('/payables', requirePermission(PERMISSIONS.FINANCE_VIEW), asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const where = { businessId: req.businessId, balance: { gt: 0 } }

  const [items, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { ...where, status: { in: ['sent', 'partial', 'received'] } },
      skip, take, orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { id: true, name: true, phone: true } } }
    }),
    prisma.purchaseOrder.count({ where: { ...where, status: { in: ['sent', 'partial', 'received'] } } })
  ])

  paginated(res, items, total, page, limit)
}))

// ── Cash Flow ─────────────────────────────────────────────────────────────────
router.get('/cash-flow', requirePermission(PERMISSIONS.FINANCE_VIEW), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const businessId = req.businessId

  const dateFilter = {}
  if (startDate) dateFilter.gte = new Date(startDate)
  if (endDate) dateFilter.lte = new Date(endDate)
  const hasDate = Object.keys(dateFilter).length > 0

  const [inflows, outflows] = await Promise.all([
    prisma.payment.findMany({
      where: { businessId, referenceType: 'invoice', ...(hasDate ? { createdAt: dateFilter } : {}) },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.expense.findMany({
      where: { businessId, ...(hasDate ? { date: dateFilter } : {}) },
      orderBy: { date: 'desc' }
    })
  ])

  const totalInflow = inflows.reduce((s, p) => s + Number(p.amount), 0)
  const totalOutflow = outflows.reduce((s, e) => s + Number(e.amount), 0)

  success(res, {
    inflows, outflows,
    totalInflow, totalOutflow,
    netCashFlow: totalInflow - totalOutflow
  })
}))

// ── Income Summary ────────────────────────────────────────────────────────────
router.get('/income', requirePermission(PERMISSIONS.FINANCE_VIEW), asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const dateFilter = {}
  if (req.query.startDate) dateFilter.gte = new Date(req.query.startDate)
  if (req.query.endDate) dateFilter.lte = new Date(req.query.endDate)

  const where = {
    businessId: req.businessId,
    status: { not: 'voided' },
    ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
  }

  const [items, total, aggregate] = await Promise.all([
    prisma.saleOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { customer: { select: { id: true, name: true } } } }),
    prisma.saleOrder.count({ where }),
    prisma.saleOrder.aggregate({ where, _sum: { total: true, amountPaid: true } })
  ])

  paginated(res, items, total, page, limit)
}))

module.exports = router
