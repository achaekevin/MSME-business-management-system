const { prisma } = require('../../config/database')
const { buildSearchClause } = require('../../helpers/pagination')

function findMany(businessId, { skip, take, orderBy, search, category, startDate, endDate, paymentMethod }) {
  const where = {
    businessId,
    ...(category ? { category } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(search ? buildSearchClause(search, ['description', 'category', 'reference']) : {}),
    ...(startDate || endDate ? {
      date: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {})
  }
  return Promise.all([
    prisma.expense.findMany({
      where, skip, take, orderBy,
      include: {
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } }
      }
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } })
  ])
}

function findById(businessId, id) {
  return prisma.expense.findFirst({
    where: { id, businessId },
    include: {
      createdBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } }
    }
  })
}

function create(businessId, data) {
  const { businessId: _b, ...rest } = data
  return prisma.expense.create({
    data: { ...rest, businessId, date: new Date(rest.date) },
    include: { createdBy: { select: { id: true, name: true } } }
  })
}

function update(id, data) {
  const { businessId: _b, ...rest } = data
  if (rest.date) rest.date = new Date(rest.date)
  return prisma.expense.update({ where: { id }, data: rest })
}

function remove(id) {
  return prisma.expense.delete({ where: { id } })
}

function approve(id, approverId) {
  return prisma.expense.update({
    where: { id },
    data: { status: 'approved', approvedById: approverId, approvedAt: new Date() }
  })
}

function reject(id, reason) {
  return prisma.expense.update({
    where: { id },
    data: { status: 'rejected', rejectionReason: reason }
  })
}

function groupByCategory(businessId, dateFilter) {
  return prisma.expense.groupBy({
    by: ['category'],
    where: { businessId, ...(dateFilter ? { date: dateFilter } : {}) },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } }
  })
}

function groupByMonth(businessId, startDate) {
  return prisma.expense.findMany({
    where: { businessId, date: { gte: startDate } },
    select: { date: true, amount: true, category: true }
  })
}

function getDistinctCategories(businessId) {
  return prisma.expense.findMany({
    where: { businessId },
    select: { category: true },
    distinct: ['category']
  })
}

module.exports = {
  findMany, findById, create, update, remove,
  approve, reject, groupByCategory, groupByMonth, getDistinctCategories
}
