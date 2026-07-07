const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./products.service')

const list = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listProducts(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const getOne = asyncHandler(async (req, res) => {
  const product = await service.getProduct(req.businessId, req.params.id)
  success(res, product)
})

const lookup = asyncHandler(async (req, res) => {
  const product = await service.findByCode(req.businessId, req.params.code)
  success(res, product)
})

const create = asyncHandler(async (req, res) => {
  const product = await service.createProduct(req.businessId, req.body, req)
  created(res, product, 'Product created successfully')
})

const update = asyncHandler(async (req, res) => {
  const product = await service.updateProduct(req.businessId, req.params.id, req.body, req)
  success(res, product, 'Product updated successfully')
})

const remove = asyncHandler(async (req, res) => {
  await service.deleteProduct(req.businessId, req.params.id, req)
  noContent(res)
})

const listCategories = asyncHandler(async (req, res) => {
  success(res, await service.listCategories(req.businessId))
})

const createCategory = asyncHandler(async (req, res) => {
  created(res, await service.createCategory(req.businessId, req.body), 'Category created')
})

const listUnits = asyncHandler(async (req, res) => {
  success(res, await service.listUnits(req.businessId))
})

const createUnit = asyncHandler(async (req, res) => {
  created(res, await service.createUnit(req.businessId, req.body), 'Unit created')
})

const addVariant = asyncHandler(async (req, res) => {
  created(res, await service.addVariant(req.businessId, req.params.id, req.body), 'Variant added')
})

module.exports = { list, getOne, lookup, create, update, remove, listCategories, createCategory, listUnits, createUnit, addVariant }
