const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { emitToBusiness } = require('../../config/socket')
const { inventoryAlertsQueue } = require('../../queues')

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateStock(tx, businessId, productId, warehouseId, variantId = null) {
  let stock = await tx.inventoryStock.findFirst({
    where: { productId, warehouseId, variantId: variantId || undefined }
  })
  if (!stock) {
    stock = await tx.inventoryStock.create({
      data: { productId, warehouseId, quantity: 0, variantId }
    })
  }
  return stock
}

// ── Stock Adjustments ────────────────────────────────────────────────────────

async function adjustStock(businessId, data, userId, req) {
  const { productId, warehouseId, quantity, type, reason } = data

  const product = await prisma.product.findFirst({ where: { id: productId, businessId } })
  if (!product) throw ApiError.notFound('Product not found')

  const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, businessId } })
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  const result = await prisma.$transaction(async (tx) => {
    const stock = await getOrCreateStock(tx, businessId, productId, warehouseId)
    const previousStock = Number(stock.quantity)

    let newStock
    if (type === 'set') {
      newStock = quantity
    } else if (type === 'in') {
      newStock = previousStock + quantity
    } else if (type === 'out') {
      if (previousStock < quantity) throw ApiError.badRequest(`Insufficient stock. Available: ${previousStock}`)
      newStock = previousStock - quantity
    } else {
      throw ApiError.badRequest('Adjustment type must be "in", "out", or "set"')
    }

    await tx.inventoryStock.update({ where: { id: stock.id }, data: { quantity: newStock } })

    const txn = await tx.inventoryTransaction.create({
      data: {
        businessId, productId, warehouseId,
        type: type === 'set' ? 'adjustment' : type,
        quantity, previousStock, newStock,
        reason, referenceType: 'adjustment',
        performedById: userId
      }
    })

    // Check reorder point after stock change
    if (newStock <= product.reorderPoint) {
      await inventoryAlertsQueue.add('check-low-stock', { businessId, productId }, { delay: 0 })
    }

    return { stock: { ...stock, quantity: newStock }, transaction: txn }
  })

  emitToBusiness(businessId, 'inventory:update', {
    productId, newStock: result.stock.quantity
  })

  req?.audit?.('inventory.adjusted', 'Product', productId, { type, quantity, reason })
  return result
}

// ── Stock Transfers ──────────────────────────────────────────────────────────

async function createTransfer(businessId, data, userId, req) {
  const { fromWarehouseId, toWarehouseId, items, notes } = data

  if (fromWarehouseId === toWarehouseId) throw ApiError.badRequest('Source and destination warehouses must be different')

  const [from, to] = await Promise.all([
    prisma.warehouse.findFirst({ where: { id: fromWarehouseId, businessId } }),
    prisma.warehouse.findFirst({ where: { id: toWarehouseId, businessId } })
  ])
  if (!from) throw ApiError.notFound('Source warehouse not found')
  if (!to) throw ApiError.notFound('Destination warehouse not found')

  // Validate stock availability before starting transaction
  for (const item of items) {
    const stock = await prisma.inventoryStock.findFirst({ where: { productId: item.productId, warehouseId: fromWarehouseId } })
    const available = stock ? Number(stock.quantity) : 0
    if (available < item.quantity) {
      const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true } })
      throw ApiError.badRequest(`Insufficient stock for "${product?.name}". Available: ${available}`)
    }
  }

  const count = await prisma.stockTransfer.count({ where: { businessId } })
  const transferNumber = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`

  const transfer = await prisma.$transaction(async (tx) => {
    const t = await tx.stockTransfer.create({
      data: {
        businessId, transferNumber, fromWarehouseId, toWarehouseId,
        status: 'completed', notes,
        items: { create: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }
      }
    })

    for (const item of items) {
      const fromStock = await getOrCreateStock(tx, businessId, item.productId, fromWarehouseId)
      const toStock = await getOrCreateStock(tx, businessId, item.productId, toWarehouseId)
      const prevFrom = Number(fromStock.quantity)
      const prevTo = Number(toStock.quantity)

      await tx.inventoryStock.update({ where: { id: fromStock.id }, data: { quantity: { decrement: item.quantity } } })
      await tx.inventoryStock.update({ where: { id: toStock.id }, data: { quantity: { increment: item.quantity } } })

      await tx.inventoryTransaction.createMany({
        data: [
          { businessId, productId: item.productId, warehouseId: fromWarehouseId, type: 'transfer_out', quantity: item.quantity, previousStock: prevFrom, newStock: prevFrom - item.quantity, referenceType: 'transfer', referenceId: t.id, performedById: userId },
          { businessId, productId: item.productId, warehouseId: toWarehouseId, type: 'transfer_in', quantity: item.quantity, previousStock: prevTo, newStock: prevTo + item.quantity, referenceType: 'transfer', referenceId: t.id, performedById: userId }
        ]
      })
    }

    return t
  })

  req?.audit?.('inventory.transfer', 'StockTransfer', transfer.id, { from: fromWarehouseId, to: toWarehouseId })
  return transfer
}

// ── Read operations ───────────────────────────────────────────────────────────

async function getStockLevels(businessId, query) {
  const { skip, take, page, limit } = parsePagination(query)

  const [items, total] = await Promise.all([
    prisma.inventoryStock.findMany({
      where: { product: { businessId } },
      skip, take,
      include: { product: { select: { id: true, name: true, sku: true, reorderPoint: true } }, warehouse: true }
    }),
    prisma.inventoryStock.count({ where: { product: { businessId } } })
  ])

  return { items: items.map((s) => ({ ...s, isLow: Number(s.quantity) <= s.product.reorderPoint })), total, page, limit }
}

async function getTransactions(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const where = { businessId, ...(query.productId ? { productId: query.productId } : {}) }

  const [items, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where, skip, take, orderBy,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        performedBy: { select: { id: true, name: true } }
      }
    }),
    prisma.inventoryTransaction.count({ where })
  ])

  return { items, total, page, limit }
}

async function getDashboard(businessId) {
  const [totalProducts, lowStockCount, totalStockValue, recentTransactions] = await Promise.all([
    prisma.product.count({ where: { businessId, isActive: true } }),
    prisma.product.count({
      where: {
        businessId, isActive: true, trackInventory: true,
        inventoryStocks: { some: { quantity: { lte: prisma.product.fields.reorderPoint } } }
      }
    }).catch(() => 0),
    prisma.inventoryStock.aggregate({
      where: { product: { businessId } },
      _sum: { quantity: true }
    }),
    prisma.inventoryTransaction.findMany({
      where: { businessId }, orderBy: { createdAt: 'desc' }, take: 10,
      include: { product: { select: { id: true, name: true } } }
    })
  ])

  return { totalProducts, lowStockCount, totalUnits: totalStockValue._sum.quantity || 0, recentTransactions }
}

async function listWarehouses(businessId) {
  return prisma.warehouse.findMany({ where: { businessId }, orderBy: { name: 'asc' } })
}

async function createWarehouse(businessId, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.warehouse.create({ data: { ...rest, businessId } })
}

module.exports = {
  adjustStock, createTransfer, getStockLevels, getTransactions,
  getDashboard, listWarehouses, createWarehouse
}
