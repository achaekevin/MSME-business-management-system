const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')
const service = require('./dashboard.service')

/**
 * Get role-based dashboard for current user
 */
const getRoleDashboard = asyncHandler(async (req, res) => {
  const { businessId, userId, user } = req
  
  const dashboardData = await service.getRoleDashboard(businessId, userId, user.role)
  
  success(res, dashboardData, 'Dashboard loaded successfully')
})

module.exports = {
  getRoleDashboard
}
