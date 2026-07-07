const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { invalidateTenantCache } = require('../../config/redis')

async function listPurchases(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const where = { businessId, ...(query.status ? { status: query.status } : {}), ...(query.supplierId ? { supplierId: query.supplierId } : {}) }

  const [items, total] = await Promise.all([
    prisma.purchaseOrder.findMany({ where, skip, take, orderBy, include: { supplier: { select: { id: true, name: true } }, items: { include: { product: { select: { id: true, name: true, sku: true } } } } } }),
    prisma.purchaseOrder.count({ where })
  ])
  return { items, total, page, limit }
}

async function getPurchase(businessId, id) {
  const po = await prisma.purchaseOrder.findFirst({ where: { id, businessId }, include: { supplier: true, branch: true, items: { include: { product: true } }, goodsReceived: true, payments: true } })
  if (!po) throw ApiError.notFound('Purchase order not found')
  return po
}

async function createPurchase(businessId, data, userId, req) {
  const { supplierId, branchId, items, discountAmount = 0, expectedDate, notes } = data

  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, businessId } })
  if (!supplier) throw ApiError.notFound('Supplier not found')

  let subtotal = 0, taxAmount = 0
  const enriched = items.map((i) => {
    const total = i.unitPrice * i.quantity
    subtotal += total
    return { ...i, total }
  })
  const total = subtotal - discountAmount + taxAmount

  const count = await prisma.purchaseOrder.count({ where: { businessId } })
  const orderNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(5, '0')}`

  const po = await prisma.purchaseOrder.create({
    data: {
      businessId, branchId, orderNumber, supplierId, subtotal, discountAmount, taxAmount, total,
      amountPaid: 0, balance: total, status: 'draft', createdById: userId,
      expectedDate: expectedDate ? new Date(expectedDate) : undefined, notes,
      items: { create: enriched }
    },
    include: { supplier: true, items: { include: { product: true } } }
  })

  req?.audit?.('purchase.created', 'PurchaseOrder', po.id, { orderNumber, supplierId, total })
  return po
}

async function receivePurchase(businessId, id, data, userId, req) {
  const po = await prisma.purchaseOrder.findFirst({ where: { id, businessId }, include: { items: { include: { product: true } } } })
  if (!po) throw ApiError.notFound('Purchase order not found')
  if (['received', 'cancelled'].includes(po.status)) throw ApiError.conflict(`Cannot receive a ${po.status} purchase order`)

  const defaultWarehouse = await prisma.warehouse.findFirst({ where: { businessId } })
  if (!defaultWarehouse) throw ApiError.badRequest('No warehouse configured. Create a warehouse first.')

  await prisma.$transaction(async (tx) => {
    const count = await tx.goodsReceivedNote.count({ where: { purchaseOrderId: id } })
    const grnNumber = `GRN-${String(count + 1).padStart(4, '0')}`
    await tx.goodsReceivedNote.create({ data: { purchaseOrderId: id, grnNumber, receivedById: userId, notes: data.notes } })

    for (const item of po.items) {
      const stock = await tx.inventoryStock.findFirst({ where: { productId: item.productId, warehouseId: defaultWarehouse.id } })

      if (stock) {
        const prev = Number(stock.quantity)
        const newQty = prev + Number(item.quantity)
        await tx.inventoryStock.update({ where: { id: stock.id }, data: { quantity: newQty } })
        await tx.inventoryTransaction.create({ data: { businessId, productId: item.productId, warehouseId: defaultWarehouse.id, type: 'in', quantity: Number(item.quantity), previousStock: prev, newStock: newQty, referenceType: 'purchase', referenceId: id, performedById: userId } })
      } else {
        await tx.inventoryStock.create({ data: { productId: item.productId, warehouseId: defaultWarehouse.id, quantity: item.quantity } })
        await tx.inventoryTransaction.create({ data: { businessId, productId: item.productId, warehouseId: defaultWarehouse.id, type: 'in', quantity: Number(item.quantity), previousStock: 0, newStock: Number(item.quantity), referenceType: 'purchase', referenceId: id, performedById: userId } })
      }

      // Update product cost price with latest purchase price
      await tx.product.update({ where: { id: item.productId }, data: { costPrice: item.unitPrice } })
    }

    await tx.purchaseOrder.update({ where: { id }, data: { status: 'received' } })

    // Update supplier balance
    await tx.supplier.update({ where: { id: po.supplierId }, data: { balance: { increment: po.balance }, totalPurchases: { increment: po.total } } })
  })

  await invalidateTenantCache(businessId, 'dashboard')
  req?.audit?.('purchase.received', 'PurchaseOrder', id)
  return prisma.purchaseOrder.findUnique({ where: { id }, include: { supplier: true, items: { include: { product: true } }, goodsReceived: true } })
}

module.exports = { listPurchases, getPurchase, createPurchase, receivePurchase }
