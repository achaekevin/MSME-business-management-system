const asyncHandler = require('../../helpers/asyncHandler')
const { success, created } = require('../../helpers/response')
const posService = require('./pos.service')

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const openShift = asyncHandler(async (req, res) => {
  const shift = await posService.openShift(
    req.businessId,
    req.branchId,
    req.body,
    req.userId
  )
  created(res, shift, 'Shift opened successfully')
})

const closeShift = asyncHandler(async (req, res) => {
  const shift = await posService.closeShift(
    req.businessId,
    req.params.shiftId,
    req.body,
    req.userId
  )
  success(res, shift, 'Shift closed successfully')
})

const getCurrentShift = asyncHandler(async (req, res) => {
  const shift = await posService.getCurrentShift(req.businessId, req.userId)
  success(res, shift)
})

const getShiftHistory = asyncHandler(async (req, res) => {
  const history = await posService.getShiftHistory(req.businessId, req.query)
  success(res, history)
})

// ─────────────────────────────────────────────────────────────────────────────
// SALES TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

const createPOSSale = asyncHandler(async (req, res) => {
  const sale = await posService.createPOSSale(
    req.businessId,
    req.branchId,
    req.body,
    req.userId,
    req
  )
  created(res, sale, 'Sale completed successfully')
})

const searchProducts = asyncHandler(async (req, res) => {
  const products = await posService.searchProducts(req.businessId, req.query)
  success(res, products)
})

const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await posService.getProductByBarcode(
    req.businessId,
    req.params.barcode
  )
  success(res, product)
})

const processPOSReturn = asyncHandler(async (req, res) => {
  const saleReturn = await posService.processPOSReturn(
    req.businessId,
    req.params.saleId,
    req.body,
    req.userId,
    req
  )
  created(res, saleReturn, 'Return processed successfully')
})

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const getPOSConfig = asyncHandler(async (req, res) => {
  const config = await posService.getPOSConfig(req.businessId, req.branchId)
  success(res, config)
})

const updatePOSConfig = asyncHandler(async (req, res) => {
  const config = await posService.updatePOSConfig(
    req.businessId,
    req.branchId,
    req.body
  )
  success(res, config, 'POS configuration updated successfully')
})

module.exports = {
  // Shift management
  openShift,
  closeShift,
  getCurrentShift,
  getShiftHistory,
  
  // Sales transactions
  createPOSSale,
  searchProducts,
  getProductByBarcode,
  processPOSReturn,
  
  // Configuration
  getPOSConfig,
  updatePOSConfig
}
