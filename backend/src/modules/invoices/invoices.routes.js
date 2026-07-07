const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./invoices.service')
const { z } = require('zod')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

const itemSchema = z.object({ productId: z.string().uuid(), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().min(0), discount: z.coerce.number().min(0).default(0), tax: z.coerce.number().min(0).default(0) })
const createSchema = z.object({ customerId: z.string().uuid(), dueDate: z.string().min(1), items: z.array(itemSchema).min(1), notes: z.string().optional(), businessId: z.string().optional() })
const paymentSchema = z.object({ amount: z.coerce.number().positive(), method: z.enum(['cash','bank_transfer','card','mobile_money','cheque','credit']), reference: z.string().optional(), notes: z.string().optional() })

router.get('/', requirePermission(PERMISSIONS.INVOICES_VIEW), asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listInvoices(req.businessId, req.query)
  paginated(res, items, total, page, limit)
}))

router.get('/:id', requirePermission(PERMISSIONS.INVOICES_VIEW), asyncHandler(async (req, res) => {
  success(res, await service.getInvoice(req.businessId, req.params.id))
}))

router.post('/', requirePermission(PERMISSIONS.INVOICES_CREATE), validate(createSchema), asyncHandler(async (req, res) => {
  created(res, await service.createInvoice(req.businessId, req.body, req), 'Invoice created')
}))

router.post('/:id/send', requirePermission(PERMISSIONS.INVOICES_SEND), asyncHandler(async (req, res) => {
  success(res, await service.sendInvoice(req.businessId, req.params.id, req), 'Invoice sent')
}))

router.post('/:id/payments', requirePermission(PERMISSIONS.FINANCE_CREATE), validate(paymentSchema), asyncHandler(async (req, res) => {
  success(res, await service.recordPayment(req.businessId, req.params.id, req.body, req.userId, req), 'Payment recorded')
}))

router.post('/:id/cancel', requirePermission(PERMISSIONS.INVOICES_CREATE), asyncHandler(async (req, res) => {
  success(res, await service.cancelInvoice(req.businessId, req.params.id, req), 'Invoice cancelled')
}))

module.exports = router

// PDF download endpoint (added after initial route setup)
const { generateInvoicePdf } = require('./invoice.pdf')
router.get('/:id/pdf', requirePermission(PERMISSIONS.INVOICES_VIEW), asyncHandler(async (req, res) => {
  const invoice = await service.getInvoice(req.businessId, req.params.id)
  const buffer = await generateInvoicePdf(req.businessId, req.params.id)
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    'Content-Length': buffer.length
  })
  res.send(buffer)
}))
