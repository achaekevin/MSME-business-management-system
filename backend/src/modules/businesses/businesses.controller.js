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

// Branding
const getBranding = asyncHandler(async (req, res) => {
  success(res, await service.getBranding(req.businessId))
})

const updateBranding = asyncHandler(async (req, res) => {
  success(res, await service.updateBranding(req.businessId, req.body, req), 'Branding updated')
})

// Tax settings
const getTaxSettings = asyncHandler(async (req, res) => {
  success(res, await service.getTaxSettings(req.businessId))
})

const updateTaxSettings = asyncHandler(async (req, res) => {
  success(res, await service.updateTaxSettings(req.businessId, req.body, req), 'Tax settings updated')
})

// Business hours
const getBusinessHours = asyncHandler(async (req, res) => {
  success(res, await service.getBusinessHours(req.businessId))
})

const updateBusinessHours = asyncHandler(async (req, res) => {
  success(res, await service.updateBusinessHours(req.businessId, req.body, req), 'Business hours updated')
})

// Holidays
const listHolidays = asyncHandler(async (req, res) => {
  success(res, await service.listHolidays(req.businessId, req.query))
})

const createHoliday = asyncHandler(async (req, res) => {
  success(res, await service.createHoliday(req.businessId, req.body, req), 'Holiday created', 201)
})

const getHoliday = asyncHandler(async (req, res) => {
  success(res, await service.getHoliday(req.businessId, req.params.id))
})

const updateHoliday = asyncHandler(async (req, res) => {
  success(res, await service.updateHoliday(req.businessId, req.params.id, req.body, req), 'Holiday updated')
})

const deleteHoliday = asyncHandler(async (req, res) => {
  await service.deleteHoliday(req.businessId, req.params.id, req)
  success(res, null, 'Holiday deleted')
})

module.exports = { 
  dashboard, 
  getProfile, 
  updateProfile, 
  uploadLogo, 
  getSettings, 
  updateSettings,
  getBranding,
  updateBranding,
  getTaxSettings,
  updateTaxSettings,
  getBusinessHours,
  updateBusinessHours,
  listHolidays,
  createHoliday,
  getHoliday,
  updateHoliday,
  deleteHoliday
}
