const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated } = require('../../helpers/response')
const service = require('./inventory.service')

const dashboard = asyncHandler(async (req, res) => {
  success(res, await service.getDashboard(req.businessId))
})

const stockLevels = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.getStockLevels(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const transactions = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.getTransactions(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const adjust = asyncHandler(async (req, res) => {
  const result = await service.adjustStock(req.businessId, req.body, req.userId, req)
  success(res, result, 'Stock adjusted successfully')
})

const transfer = asyncHandler(async (req, res) => {
  const result = await service.createTransfer(req.businessId, req.body, req.userId, req)
  created(res, result, 'Transfer completed')
})

const listWarehouses = asyncHandler(async (req, res) => {
  success(res, await service.listWarehouses(req.businessId))
})

const createWarehouse = asyncHandler(async (req, res) => {
  created(res, await service.createWarehouse(req.businessId, req.body), 'Warehouse created')
})

module.exports = { dashboard, stockLevels, transactions, adjust, transfer, listWarehouses, createWarehouse }
