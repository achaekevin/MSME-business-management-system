const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, noContent } = require('../../helpers/response')
const service = require('./branches.service')

const list = asyncHandler(async (req, res) => {
  success(res, await service.listBranches(req.businessId))
})

const getOne = asyncHandler(async (req, res) => {
  success(res, await service.getBranch(req.businessId, req.params.id))
})

const create = asyncHandler(async (req, res) => {
  created(res, await service.createBranch(req.businessId, req.body, req), 'Branch created')
})

const update = asyncHandler(async (req, res) => {
  success(res, await service.updateBranch(req.businessId, req.params.id, req.body, req), 'Branch updated')
})

const remove = asyncHandler(async (req, res) => {
  await service.deleteBranch(req.businessId, req.params.id, req)
  noContent(res)
})

const toggle = asyncHandler(async (req, res) => {
  const { isActive } = req.body
  success(res, await service.setBranchActive(req.businessId, req.params.id, isActive, req))
})

module.exports = { list, getOne, create, update, remove, toggle }
