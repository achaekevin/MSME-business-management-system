const asyncHandler = require('../../helpers/asyncHandler')
const { success, paginated, created } = require('../../helpers/response')
const service = require('./security.service')

// Login History
const getLoginHistory = asyncHandler(async (req, res) => {
  const result = await service.getLoginHistory(req.userId, req.query)
  if (req.query.page) {
    paginated(res, result.items, result.total, result.page, result.limit)
  } else {
    success(res, result)
  }
})

const getUserLoginHistory = asyncHandler(async (req, res) => {
  const result = await service.getLoginHistory(req.params.userId, req.query)
  if (req.query.page) {
    paginated(res, result.items, result.total, result.page, result.limit)
  } else {
    success(res, result)
  }
})

// Device Management
const getMyDevices = asyncHandler(async (req, res) => {
  success(res, await service.getUserDevices(req.userId))
})

const getUserDevices = asyncHandler(async (req, res) => {
  success(res, await service.getUserDevices(req.params.userId))
})

const revokeDevice = asyncHandler(async (req, res) => {
  await service.revokeDevice(req.userId, req.params.deviceId, req)
  success(res, null, 'Device revoked successfully')
})

const trustDevice = asyncHandler(async (req, res) => {
  success(res, await service.trustDevice(req.userId, req.params.deviceId, req), 'Device trusted')
})

// IP Restrictions
const getIpRestrictions = asyncHandler(async (req, res) => {
  success(res, await service.getIpRestrictions(req.businessId))
})

const addIpRestriction = asyncHandler(async (req, res) => {
  created(res, await service.addIpRestriction(req.businessId, req.body, req), 'IP restriction added')
})

const updateIpRestriction = asyncHandler(async (req, res) => {
  success(res, await service.updateIpRestriction(req.businessId, req.params.id, req.body, req), 'IP restriction updated')
})

const deleteIpRestriction = asyncHandler(async (req, res) => {
  await service.deleteIpRestriction(req.businessId, req.params.id, req)
  success(res, null, 'IP restriction deleted')
})

// Activity Logs
const getMyActivity = asyncHandler(async (req, res) => {
  const result = await service.getUserActivity(req.userId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const getUserActivity = asyncHandler(async (req, res) => {
  const result = await service.getUserActivity(req.params.userId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const exportActivity = asyncHandler(async (req, res) => {
  const csv = await service.exportActivity(req.businessId, req.query)
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=activity-log.csv')
  res.send(csv)
})

// Security Settings
const getSecuritySettings = asyncHandler(async (req, res) => {
  success(res, await service.getSecuritySettings(req.businessId))
})

const updateSecuritySettings = asyncHandler(async (req, res) => {
  success(res, await service.updateSecuritySettings(req.businessId, req.body, req), 'Security settings updated')
})

// Failed Logins
const getFailedLogins = asyncHandler(async (req, res) => {
  const result = await service.getFailedLogins(req.businessId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const unlockUser = asyncHandler(async (req, res) => {
  success(res, await service.unlockUser(req.businessId, req.params.userId, req), 'User unlocked successfully')
})

module.exports = {
  getLoginHistory,
  getUserLoginHistory,
  getMyDevices,
  getUserDevices,
  revokeDevice,
  trustDevice,
  getIpRestrictions,
  addIpRestriction,
  updateIpRestriction,
  deleteIpRestriction,
  getMyActivity,
  getUserActivity,
  exportActivity,
  getSecuritySettings,
  updateSecuritySettings,
  getFailedLogins,
  unlockUser
}
