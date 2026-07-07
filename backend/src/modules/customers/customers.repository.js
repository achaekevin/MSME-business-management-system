const { prisma } = require('../../config/database')
const { buildSearchClause } = require('../../helpers/pagination')

/**
 * Repository layer: the ONLY place raw Prisma queries for Customer live.
 * Every method takes businessId explicitly and filters on it — this is the
 * defense-in-depth tenant isolation guarantee, independent of middleware.
 */

function findMany(businessId, { skip, take, orderBy, search, type, groupId }) {
  const where = {
    businessId,
    ...(type ? { type } : {}),
    ...(groupId ? { groupId } : {}),
    ...(search ? buildSearchClause(search, ['name', 'email', 'phone']) : {})
  }

  return Promise.all([
    prisma.customer.findMany({ where, skip, take, orderBy, include: { group: true } }),
    prisma.customer.count({ where })
  ])
}

function findById(businessId, id) {
  return prisma.customer.findFirst({ where: { id, businessId }, include: { group: true } })
}

function create(businessId, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.customer.create({ data: { ...rest, businessId } })
}

function update(businessId, id, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.customer.updateMany({ where: { id, businessId }, data: rest })
}

function remove(businessId, id) {
  return prisma.customer.deleteMany({ where: { id, businessId } })
}

function getLedger(businessId, customerId, { skip, take }) {
  return prisma.customerLedger.findMany({
    where: { customer: { id: customerId, businessId } },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  })
}

function getGroups(businessId) {
  return prisma.customerGroup.findMany({ where: { businessId }, orderBy: { name: 'asc' } })
}

function createGroup(businessId, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.customerGroup.create({ data: { ...rest, businessId } })
}

function adjustBalance(businessId, customerId, delta) {
  return prisma.customer.updateMany({
    where: { id: customerId, businessId },
    data: { balance: { increment: delta } }
  })
}

module.exports = { findMany, findById, create, update, remove, getLedger, getGroups, createGroup, adjustBalance }
