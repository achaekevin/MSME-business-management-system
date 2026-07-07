const repo = require('./customers.repository')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { invalidateTenantCache, cacheGet, cacheSet, cacheKey } = require('../../config/redis')
const { EVENTS } = require('../../constants')

async function listCustomers(businessId, query) {
  const { page, limit, skip, take, orderBy } = parsePagination(query)
  const [items, total] = await repo.findMany(businessId, {
    skip, take, orderBy, search: query.search, type: query.type, groupId: query.groupId
  })
  return { items, total, page, limit }
}

async function getCustomer(businessId, id) {
  const key = cacheKey(businessId, 'customer', id)
  const cached = await cacheGet(key)
  if (cached) return cached

  const customer = await repo.findById(businessId, id)
  if (!customer) throw ApiError.notFound('Customer not found')

  await cacheSet(key, customer, 120)
  return customer
}

async function createCustomer(businessId, data, req) {
  const customer = await repo.create(businessId, data)
  await invalidateTenantCache(businessId, 'customer')
  req?.audit?.('customer.created', 'Customer', customer.id, { name: customer.name })
  return customer
}

async function updateCustomer(businessId, id, data, req) {
  const existing = await repo.findById(businessId, id)
  if (!existing) throw ApiError.notFound('Customer not found')

  await repo.update(businessId, id, data)
  await invalidateTenantCache(businessId, 'customer')
  req?.audit?.('customer.updated', 'Customer', id, { changes: data })

  return repo.findById(businessId, id)
}

async function deleteCustomer(businessId, id, req) {
  const existing = await repo.findById(businessId, id)
  if (!existing) throw ApiError.notFound('Customer not found')

  if (Number(existing.balance) !== 0) {
    throw ApiError.badRequest('Cannot delete a customer with an outstanding balance. Settle the balance first.')
  }

  await repo.remove(businessId, id)
  await invalidateTenantCache(businessId, 'customer')
  req?.audit?.('customer.deleted', 'Customer', id)
  return { deleted: true }
}

async function getStatement(businessId, customerId, query) {
  const customer = await repo.findById(businessId, customerId)
  if (!customer) throw ApiError.notFound('Customer not found')

  const { page, limit, skip, take } = parsePagination(query)
  const entries = await repo.getLedger(businessId, customerId, { skip, take })

  return { customer, entries, page, limit }
}

async function listGroups(businessId) {
  return repo.getGroups(businessId)
}

async function createGroup(businessId, data) {
  return repo.createGroup(businessId, data)
}

module.exports = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getStatement,
  listGroups,
  createGroup
}
