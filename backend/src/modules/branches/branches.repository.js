const { prisma } = require('../../config/database')

function findMany(businessId) {
  return prisma.branch.findMany({
    where: { businessId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { users: true, employees: true } }
    },
    orderBy: [{ isHeadquarters: 'desc' }, { name: 'asc' }]
  })
}

function findById(businessId, id) {
  return prisma.branch.findFirst({
    where: { id, businessId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      users: { select: { id: true, name: true, email: true, role: { select: { name: true } } } }
    }
  })
}

function findByCode(businessId, code, excludeId) {
  return prisma.branch.findFirst({
    where: { businessId, code, ...(excludeId ? { id: { not: excludeId } } : {}) }
  })
}

function count(businessId) {
  return prisma.branch.count({ where: { businessId } })
}

function getSubscription(businessId) {
  return prisma.subscription.findUnique({ where: { businessId } })
}

function create(businessId, data) {
  const { businessId: _b, ...rest } = data
  return prisma.branch.create({ data: { ...rest, businessId } })
}

function update(id, data) {
  const { businessId: _b, isHeadquarters: _hq, ...rest } = data
  return prisma.branch.update({ where: { id }, data: rest })
}

function remove(id) {
  return prisma.branch.delete({ where: { id } })
}

function setActive(id, isActive) {
  return prisma.branch.update({ where: { id }, data: { isActive } })
}

function countUsers(branchId) {
  return prisma.user.count({ where: { branchId } })
}

module.exports = {
  findMany, findById, findByCode, count, getSubscription,
  create, update, remove, setActive, countUsers
}
