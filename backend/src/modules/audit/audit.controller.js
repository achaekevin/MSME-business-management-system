const asyncHandler = require('../../helpers/asyncHandler')
const { success, paginated } = require('../../helpers/response')
const service = require('./audit.service')

const list = asyncHandler(async (req, res) => {
  const result = await service.listAuditLogs(req.businessId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const summary = asyncHandler(async (req, res) => {
  success(res, await service.getAuditSummary(req.businessId))
})

const entities = asyncHandler(async (req, res) => {
  success(res, await service.getDistinctEntities(req.businessId))
})

const entityHistory = asyncHandler(async (req, res) => {
  success(res, await service.getEntityHistory(req.businessId, req.params.entity, req.params.entityId))
})

module.exports = { list, summary, entities, entityHistory }
