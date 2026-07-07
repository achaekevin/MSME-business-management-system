const repo = require('./suppliers.repository')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { invalidateTenantCache, cacheGet, cacheSet, cacheKey } = require('../../config/redis')

// ── List ─────────────────────────────────────────────────────────────────────
async function listSuppliers(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total] = await repo.findMany(businessId, {
    skip, take, orderBy, search: query.search, isActive: query.isActive
  })
  return { items, total, page, limit }
}

// ── Get one ───────────────────────────────────────────────────────────────────
async function getSupplier(businessId, id) {
  const key = cacheKey(businessId, 'supplier', id)
  const cached = await cacheGet(key)
  if (cached) return cached

  const supplier = await repo.findById(businessId, id)
  if (!supplier) throw ApiError.notFound('Supplier not found')

  await cacheSet(key, supplier, 120)
  return supplier
}

// ── Create ────────────────────────────────────────────────────────────────────
async function createSupplier(businessId, data, req) {
  if (data.email) {
    const exists = await repo.findByEmail(businessId, data.email)
    if (exists) throw ApiError.conflict('A supplier with this email already exists')
  }
  const supplier = await repo.create(businessId, data)
  await invalidateTenantCache(businessId, 'supplier')
  req?.audit?.('supplier.created', 'Supplier', supplier.id, { name: supplier.name })
  return supplier
}

// ── Update ────────────────────────────────────────────────────────────────────
async function updateSupplier(businessId, id, data, req) {
  const existing = await repo.findById(businessId, id)
  if (!existing) throw ApiError.notFound('Supplier not found')

  const updated = await repo.update(id, data)
  await invalidateTenantCache(businessId, 'supplier')
  req?.audit?.('supplier.updated', 'Supplier', id, { changes: data })
  return updated
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteSupplier(businessId, id, req) {
  const supplier = await repo.findById(businessId, id)
  if (!supplier) throw ApiError.notFound('Supplier not found')
  if (Number(supplier.balance) !== 0) {
    throw ApiError.badRequest('Cannot delete a supplier with an outstanding balance')
  }
  const poCount = await repo.countPurchaseOrders(id)
  if (poCount > 0) {
    throw ApiError.badRequest('Cannot delete a supplier with purchase history. Deactivate instead.')
  }
  await repo.remove(id)
  await invalidateTenantCache(businessId, 'supplier')
  req?.audit?.('supplier.deleted', 'Supplier', id)
  return { deleted: true }
}

// ── Statement ─────────────────────────────────────────────────────────────────
async function getStatement(businessId, supplierId, query) {
  const supplier = await getSupplier(businessId, supplierId)
  const { skip, take, page, limit } = parsePagination(query)

  const [entries, total] = await repo.getLedger(supplierId, {
    skip, take, startDate: query.startDate, endDate: query.endDate
  })

  return { supplier, entries, total, page, limit }
}

// ── Purchase history ──────────────────────────────────────────────────────────
async function getPurchaseHistory(businessId, supplierId, query) {
  const supplier = await getSupplier(businessId, supplierId)
  const { skip, take, page, limit, orderBy } = parsePagination(query)

  const [items, total] = await repo.getPurchases(businessId, supplierId, { skip, take, orderBy })

  return { supplier, items, total, page, limit }
}

// ── Record payment to supplier ────────────────────────────────────────────────
async function recordPayment(businessId, supplierId, data, userId, req) {
  const supplier = await getSupplier(businessId, supplierId)
  if (Number(supplier.balance) <= 0) throw ApiError.badRequest('This supplier has no outstanding balance')
  if (data.amount > Number(supplier.balance)) throw ApiError.badRequest(`Payment exceeds balance of ${supplier.balance}`)

  const newBalance = Number(supplier.balance) - data.amount

  await prisma.$transaction(async (tx) => {
    await repo.recordPaymentTx(tx, {
      businessId, supplierId,
      amount: data.amount, method: data.method,
      reference: data.reference, notes: data.notes,
      userId, newBalance
    })
  })

  await invalidateTenantCache(businessId, 'supplier')
  req?.audit?.('supplier.payment', 'Supplier', supplierId, { amount: data.amount, method: data.method })
  return getSupplier(businessId, supplierId)
}

module.exports = {
  listSuppliers, getSupplier, createSupplier, updateSupplier,
  deleteSupplier, getStatement, getPurchaseHistory, recordPayment
}
