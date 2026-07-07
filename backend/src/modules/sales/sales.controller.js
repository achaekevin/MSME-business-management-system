const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./sales.service')

const list = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listSales(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const getOne = asyncHandler(async (req, res) => {
  success(res, await service.getSale(req.businessId, req.params.id))
})

const create = asyncHandler(async (req, res) => {
  const sale = await service.createSale(req.businessId, req.body, req.userId, req)
  created(res, sale, 'Sale created successfully')
})

const voidSale = asyncHandler(async (req, res) => {
  const sale = await service.voidSale(req.businessId, req.params.id, req.body.reason, req.userId, req)
  success(res, sale, 'Sale voided')
})

const createReturn = asyncHandler(async (req, res) => {
  const result = await service.createReturn(req.businessId, req.params.id, req.body, req)
  created(res, result, 'Return recorded')
})

const listQuotations = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listQuotations(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const createQuotation = asyncHandler(async (req, res) => {
  created(res, await service.createQuotation(req.businessId, req.body, req), 'Quotation created')
})

const convertQuotation = asyncHandler(async (req, res) => {
  const sale = await service.convertQuotationToSale(req.businessId, req.params.id, req.userId, req)
  created(res, sale, 'Quotation converted to sale')
})

module.exports = { list, getOne, create, voidSale, createReturn, listQuotations, createQuotation, convertQuotation }
