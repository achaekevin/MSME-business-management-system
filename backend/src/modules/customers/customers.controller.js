const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./customers.service')

const list = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listCustomers(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const getOne = asyncHandler(async (req, res) => {
  const customer = await service.getCustomer(req.businessId, req.params.id)
  success(res, customer)
})

const create = asyncHandler(async (req, res) => {
  const customer = await service.createCustomer(req.businessId, req.body, req)
  created(res, customer, 'Customer created successfully')
})

const update = asyncHandler(async (req, res) => {
  const customer = await service.updateCustomer(req.businessId, req.params.id, req.body, req)
  success(res, customer, 'Customer updated successfully')
})

const remove = asyncHandler(async (req, res) => {
  await service.deleteCustomer(req.businessId, req.params.id, req)
  noContent(res)
})

const statement = asyncHandler(async (req, res) => {
  const result = await service.getStatement(req.businessId, req.params.id, req.query)
  success(res, result)
})

const listGroups = asyncHandler(async (req, res) => {
  const groups = await service.listGroups(req.businessId)
  success(res, groups)
})

const createGroup = asyncHandler(async (req, res) => {
  const group = await service.createGroup(req.businessId, req.body)
  created(res, group, 'Customer group created')
})

module.exports = { list, getOne, create, update, remove, statement, listGroups, createGroup }
