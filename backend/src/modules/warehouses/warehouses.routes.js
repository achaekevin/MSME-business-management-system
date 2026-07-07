/**
 * Warehouses routes — delegates to the Inventory module service.
 * Warehouses are managed as part of inventory; this is a convenience
 * alias that keeps the URL structure RESTful.
 */
const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, noContent } = require('../../helpers/response')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { z } = require('zod')
const { validate } = require('../../middleware/validation.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

const warehouseSchema = z.object({
  name: z.string().min(1),
  branchId: z.string().uuid().optional().nullable(),
  address: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  businessId: z.string().optional()
})

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Warehouse and storage location management
 */

router.get('/', requirePermission(PERMISSIONS.INVENTORY_VIEW), asyncHandler(async (req, res) => {
  const warehouses = await prisma.warehouse.findMany({
    where: { businessId: req.businessId },
    include: {
      _count: { select: { stocks: true } },
      branch: { select: { id: true, name: true } }
    },
    orderBy: { name: 'asc' }
  })
  success(res, warehouses)
}))

router.get('/:id', requirePermission(PERMISSIONS.INVENTORY_VIEW), asyncHandler(async (req, res) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: req.params.id, businessId: req.businessId },
    include: {
      branch: { select: { id: true, name: true } },
      stocks: {
        include: { product: { select: { id: true, name: true, sku: true, reorderPoint: true } } },
        orderBy: { product: { name: 'asc' } }
      }
    }
  })
  if (!warehouse) throw ApiError.notFound('Warehouse not found')
  success(res, warehouse)
}))

router.post('/', requirePermission(PERMISSIONS.INVENTORY_ADJUST), validate(warehouseSchema), asyncHandler(async (req, res) => {
  const { businessId: _b, ...rest } = req.body
  const warehouse = await prisma.warehouse.create({ data: { ...rest, businessId: req.businessId } })
  req.audit?.('warehouse.created', 'Warehouse', warehouse.id, { name: warehouse.name })
  created(res, warehouse, 'Warehouse created')
}))

router.put('/:id', requirePermission(PERMISSIONS.INVENTORY_ADJUST), validate(warehouseSchema.partial()), asyncHandler(async (req, res) => {
  const wh = await prisma.warehouse.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
  if (!wh) throw ApiError.notFound('Warehouse not found')
  const { businessId: _b, ...rest } = req.body
  const updated = await prisma.warehouse.update({ where: { id: req.params.id }, data: rest })
  req.audit?.('warehouse.updated', 'Warehouse', req.params.id, { changes: req.body })
  success(res, updated, 'Warehouse updated')
}))

router.delete('/:id', requirePermission(PERMISSIONS.INVENTORY_ADJUST), asyncHandler(async (req, res) => {
  const wh = await prisma.warehouse.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
  if (!wh) throw ApiError.notFound('Warehouse not found')

  const stockCount = await prisma.inventoryStock.count({ where: { warehouseId: req.params.id } })
  if (stockCount > 0) throw ApiError.badRequest('Cannot delete a warehouse that holds stock. Transfer or clear stock first.')

  await prisma.warehouse.delete({ where: { id: req.params.id } })
  req.audit?.('warehouse.deleted', 'Warehouse', req.params.id)
  noContent(res)
}))

module.exports = router
