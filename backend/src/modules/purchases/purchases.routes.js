const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated } = require('../../helpers/response')
const service = require('./purchases.service')
const { z } = require('zod')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

const poItemSchema = z.object({ productId: z.string().uuid(), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().min(0) })
const createPOSchema = z.object({
  supplierId: z.string().uuid(),
  branchId: z.string().uuid(),
  items: z.array(poItemSchema).min(1),
  discountAmount: z.coerce.number().min(0).default(0),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  businessId: z.string().optional()
})

router.get('/', requirePermission(PERMISSIONS.PURCHASES_VIEW), asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listPurchases(req.businessId, req.query)
  paginated(res, items, total, page, limit)
}))

router.get('/:id', requirePermission(PERMISSIONS.PURCHASES_VIEW), asyncHandler(async (req, res) => {
  success(res, await service.getPurchase(req.businessId, req.params.id))
}))

router.post('/', requirePermission(PERMISSIONS.PURCHASES_CREATE), validate(createPOSchema), asyncHandler(async (req, res) => {
  created(res, await service.createPurchase(req.businessId, req.body, req.userId, req), 'Purchase order created')
}))

router.post('/:id/receive', requirePermission(PERMISSIONS.PURCHASES_EDIT), asyncHandler(async (req, res) => {
  success(res, await service.receivePurchase(req.businessId, req.params.id, req.body, req.userId, req), 'Goods received and stock updated')
}))

module.exports = router
