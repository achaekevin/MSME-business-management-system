const assetsService = require('./assets.service')
const { asyncHandler } = require('../../helpers/asyncHandler')
const { successResponse } = require('../../helpers/response')

// Fixed Assets
exports.createFixedAsset = asyncHandler(async (req, res) => {
  const asset = await assetsService.createFixedAsset(req.businessId, req.body)
  successResponse(res, asset, 'Fixed asset created', 201)
})

exports.getFixedAssets = asyncHandler(async (req, res) => {
  const assets = await assetsService.getFixedAssets(req.businessId, req.query)
  successResponse(res, assets)
})

exports.getFixedAssetDetails = asyncHandler(async (req, res) => {
  const asset = await assetsService.getFixedAssetDetails(req.params.id)
  successResponse(res, asset)
})

exports.updateFixedAsset = asyncHandler(async (req, res) => {
  const asset = await assetsService.updateFixedAsset(req.params.id, req.body)
  successResponse(res, asset, 'Fixed asset updated')
})

exports.disposeAsset = asyncHandler(async (req, res) => {
  const asset = await assetsService.disposeAsset(req.params.id, req.body)
  successResponse(res, asset, 'Asset marked as disposed')
})

// Depreciation
exports.calculateDepreciation = asyncHandler(async (req, res) => {
  const { periodStart, periodEnd } = req.query
  const depreciation = await assetsService.calculateDepreciation(req.params.id, periodStart, periodEnd)
  successResponse(res, depreciation)
})

exports.createDepreciationEntry = asyncHandler(async (req, res) => {
  const { periodStart, periodEnd } = req.body
  const entry = await assetsService.createDepreciationEntry(req.params.id, periodStart, periodEnd)
  successResponse(res, entry, 'Depreciation entry created', 201)
})

exports.getDepreciationSchedule = asyncHandler(async (req, res) => {
  const schedule = await assetsService.getDepreciationSchedule(req.params.id)
  successResponse(res, schedule)
})

exports.runMonthlyDepreciation = asyncHandler(async (req, res) => {
  const { periodStart, periodEnd } = req.body
  const result = await assetsService.runMonthlyDepreciation(req.businessId, periodStart, periodEnd)
  successResponse(res, result, 'Monthly depreciation processed')
})
