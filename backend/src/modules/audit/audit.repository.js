const { prisma } = require('../../config/database')
const { buildSearchClause } = require('../../helpers/pagination')

function findLogs(businessId, { skip, take, orderBy, userId, entity, entityId, action, startDate, endDate }) {
  const where = {
    businessId,
    ...(userId ? { userId } : {}),
    ...(entity ? { entity } : {}),
    ...(entityId ? { entityId } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {})
  }
  return Promise.all([
    prisma.auditLog.findMany({
      where, skip, take, orderBy,
      include: { user: { select: { id: true, name: true, email: true } } }
    }),
    prisma.auditLog.count({ where })
  ])
}

function findEntityHistory(businessId, entity, entityId) {
  return prisma.auditLog.findMany({
    where: { businessId, entity, entityId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  })
}

function getSummaryStats(businessId, since) {
  return Promise.all([
    prisma.auditLog.count({ where: { businessId, createdAt: { gte: since } } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { businessId, createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 10
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where: { businessId, createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 5
    }),
    prisma.auditLog.findMany({
      where: { businessId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ])
}

function findUsersByIds(ids) {
  return prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
}

function findDistinctEntities(businessId) {
  return prisma.auditLog.findMany({
    where: { businessId },
    select: { entity: true },
    distinct: ['entity'],
    orderBy: { entity: 'asc' }
  })
}

module.exports = { findLogs, findEntityHistory, getSummaryStats, findUsersByIds, findDistinctEntities }
