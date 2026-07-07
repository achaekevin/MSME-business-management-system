const repo = require('./audit.repository')
const { parsePagination } = require('../../helpers/pagination')
const dayjs = require('dayjs')

async function listAuditLogs(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total] = await repo.findLogs(businessId, {
    skip, take, orderBy: orderBy || { createdAt: 'desc' },
    userId: query.userId,
    entity: query.entity,
    entityId: query.entityId,
    action: query.action,
    startDate: query.startDate,
    endDate: query.endDate
  })
  return { items, total, page, limit }
}

async function getEntityHistory(businessId, entity, entityId) {
  return repo.findEntityHistory(businessId, entity, entityId)
}

async function getAuditSummary(businessId) {
  const since = dayjs().subtract(30, 'day').toDate()
  const [total, byAction, byUser, recent] = await repo.getSummaryStats(businessId, since)

  const userIds = byUser.map((u) => u.userId).filter(Boolean)
  const users = await repo.findUsersByIds(userIds)
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  return {
    totalEvents: total,
    period: '30 days',
    topActions: byAction.map((a) => ({ action: a.action, count: a._count })),
    topUsers: byUser.map((u) => ({ userId: u.userId, name: userMap[u.userId] || 'Unknown', count: u._count })),
    recentEvents: recent
  }
}

async function getDistinctEntities(businessId) {
  const rows = await repo.findDistinctEntities(businessId)
  return rows.map((r) => r.entity)
}

module.exports = { listAuditLogs, getEntityHistory, getAuditSummary, getDistinctEntities }
