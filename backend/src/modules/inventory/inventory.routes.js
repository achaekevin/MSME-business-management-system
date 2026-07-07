const express = require('express')
const router = express.Router()
const controller = require('./inventory.controller')
const { z } = require('zod')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

const adjustSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  type: z.enum(['in', 'out', 'set']),
  reason: z.string().optional(),
  businessId: z.string().optional()
})

const transferSchema = z.object({
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.coerce.number().positive() })).min(1),
  notes: z.string().optional()
})

const warehouseSchema = z.object({
  name: z.string().min(1),
  branchId: z.string().uuid().optional(),
  address: z.string().optional(),
  businessId: z.string().optional()
})

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock levels, adjustments, transfers, movements
 */

router.get('/dashboard', requirePermission(PERMISSIONS.INVENTORY_VIEW), controller.dashboard)
router.get('/stock', requirePermission(PERMISSIONS.INVENTORY_VIEW), controller.stockLevels)
router.get('/transactions', requirePermission(PERMISSIONS.INVENTORY_VIEW), controller.transactions)
router.get('/warehouses', requirePermission(PERMISSIONS.INVENTORY_VIEW), controller.listWarehouses)
router.post('/warehouses', requirePermission(PERMISSIONS.INVENTORY_ADJUST), validate(warehouseSchema), controller.createWarehouse)
router.post('/adjustments', requirePermission(PERMISSIONS.INVENTORY_ADJUST), validate(adjustSchema), controller.adjust)
router.post('/transfers', requirePermission(PERMISSIONS.INVENTORY_TRANSFER), validate(transferSchema), controller.transfer)

module.exports = router
