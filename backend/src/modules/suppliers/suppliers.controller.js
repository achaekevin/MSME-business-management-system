const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./suppliers.service')

const list = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listSuppliers(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const getOne = asyncHandler(async (req, res) => {
  success(res, await service.getSupplier(req.businessId, req.params.id))
})

const statement = asyncHandler(async (req, res) => {
  success(res, await service.getStatement(req.businessId, req.params.id, req.query))
})

const purchases = asyncHandler(async (req, res) => {
  const result = await service.getPurchaseHistory(req.businessId, req.params.id, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const create = asyncHandler(async (req, res) => {
  created(res, await service.createSupplier(req.businessId, req.body, req), 'Supplier created successfully')
})

const update = asyncHandler(async (req, res) => {
  success(res, await service.updateSupplier(req.businessId, req.params.id, req.body, req), 'Supplier updated')
})

const remove = asyncHandler(async (req, res) => {
  await service.deleteSupplier(req.businessId, req.params.id, req)
  noContent(res)
})

const recordPayment = asyncHandler(async (req, res) => {
  success(res, await service.recordPayment(req.businessId, req.params.id, req.body, req.userId, req), 'Payment recorded')
})

module.exports = { list, getOne, statement, purchases, create, update, remove, recordPayment }
