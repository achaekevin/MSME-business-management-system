const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')
const service = require('./businesses.service')

const dashboard = asyncHandler(async (req, res) => {
  success(res, await service.getDashboardStats(req.businessId))
})

const getProfile = asyncHandler(async (req, res) => {
  success(res, await service.getProfile(req.businessId))
})

const updateProfile = asyncHandler(async (req, res) => {
  success(res, await service.updateProfile(req.businessId, req.body, req), 'Profile updated')
})

const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw require('../../helpers/response').ApiError.badRequest('No file uploaded')
  success(res, await service.uploadLogo(req.businessId, req.file, req), 'Logo updated')
})

const getSettings = asyncHandler(async (req, res) => {
  success(res, await service.getSettings(req.businessId))
})

const updateSettings = asyncHandler(async (req, res) => {
  success(res, await service.updateSettings(req.businessId, req.body, req), 'Settings updated')
})

module.exports = { dashboard, getProfile, updateProfile, uploadLogo, getSettings, updateSettings }
