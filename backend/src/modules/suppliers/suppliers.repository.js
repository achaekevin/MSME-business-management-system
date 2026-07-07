const { prisma } = require('../../config/database')
const { buildSearchClause } = require('../../helpers/pagination')

/**
 * Repository layer: the ONLY place raw Prisma queries for Supplier live.
 * Every method takes businessId explicitly and filters on it — defense-in-depth
 * tenant isolation, independent of middleware.
 */

function findMany(businessId, { skip, take, orderBy, search, isActive }) {
  const where = {
    businessId,
    ...(isActive !== undefined ? { isActive: isActive === 'true' || isActive === true } : {}),
    ...(search ? buildSearchClause(search, ['name', 'email', 'phone', 'taxNumber']) : {})
  }

  return Promise.all([
    prisma.supplier.findMany({ where, skip, take, orderBy }),
    prisma.supplier.count({ where })
  ])
}

function findById(businessId, id) {
  return prisma.supplier.findFirst({ where: { id, businessId } })
}

function findByEmail(businessId, email) {
  return prisma.supplier.findFirst({ where: { businessId, email } })
}

function create(businessId, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.supplier.create({ data: { ...rest, businessId } })
}

function update(id, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.supplier.update({ where: { id }, data: rest })
}

function remove(id) {
  return prisma.supplier.delete({ where: { id } })
}

function countPurchaseOrders(supplierId) {
  return prisma.purchaseOrder.count({ where: { supplierId } })
}

function getLedger(supplierId, { skip, take, startDate, endDate }) {
  const where = {
    supplierId,
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {})
  }

  return Promise.all([
    prisma.supplierLedger.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.supplierLedger.count({ where })
  ])
}

function getPurchases(businessId, supplierId, { skip, take, orderBy }) {
  const where = { supplierId, businessId }
  return Promise.all([
    prisma.purchaseOrder.findMany({
      where, skip, take, orderBy,
      include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } } }
    }),
    prisma.purchaseOrder.count({ where })
  ])
}

function recordPaymentTx(tx, { businessId, supplierId, amount, method, reference, notes, userId, newBalance }) {
  return Promise.all([
    tx.payment.create({
      data: {
        businessId, referenceType: 'purchase',
        amount, method, reference, notes,
        createdById: userId
      }
    }),
    tx.supplier.update({ where: { id: supplierId }, data: { balance: newBalance } }),
    tx.supplierLedger.create({
      data: {
        supplierId, type: 'payment',
        debit: amount, credit: 0,
        balance: newBalance,
        description: `Payment — ${method}${reference ? ' ref: ' + reference : ''}`
      }
    })
  ])
}

module.exports = {
  findMany, findById, findByEmail, create, update, remove,
  countPurchaseOrders, getLedger, getPurchases, recordPaymentTx
}
