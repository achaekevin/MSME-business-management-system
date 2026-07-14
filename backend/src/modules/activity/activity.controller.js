/**
 * Activity Feed Controller
 */

const activityService = require('./activity.service')
const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')

/**
 * Get recent activities
 */
exports.getRecentActivities = asyncHandler(async (req, res) => {
  const { type, limit } = req.query
  
  const activities = await activityService.getRecentActivities(
    req.user.businessId,
    { type, userId: req.query.userId, limit: parseInt(limit) || 20 }
  )

  success(res, activities)
})

/**
 * Get activity statistics
 */
exports.getActivityStats = asyncHandler(async (req, res) => {
  const { days } = req.query
  
  const stats = await activityService.getActivityStats(
    req.user.businessId,
    parseInt(days) || 7
  )

  success(res, stats)
})

/**
 * Get activity types
 */
exports.getActivityTypes = asyncHandler(async (req, res) => {
  success(res, Object.values(activityService.ACTIVITY_TYPES))
})
