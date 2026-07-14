/**
 * Notification Preferences Controller
 */

const asyncHandler = require('../../helpers/asyncHandler')
const ApiResponse = require('../../helpers/ApiResponse')
const preferencesService = require('./preferences.service')

/**
 * @desc    Get user notification preferences
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
exports.getPreferences = asyncHandler(async (req, res) => {
  const preferences = await preferencesService.getUserPreferences(req.user.id)

  res.json(
    ApiResponse.success(preferences, 'Preferences retrieved successfully')
  )
})

/**
 * @desc    Update notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
exports.updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await preferencesService.updatePreferences(
    req.user.id,
    req.body
  )

  res.json(
    ApiResponse.success(preferences, 'Preferences updated successfully')
  )
})

/**
 * @desc    Reset preferences to defaults
 * @route   POST /api/notifications/preferences/reset
 * @access  Private
 */
exports.resetPreferences = asyncHandler(async (req, res) => {
  const preferences = await preferencesService.resetPreferences(req.user.id)

  res.json(
    ApiResponse.success(preferences, 'Preferences reset to defaults')
  )
})

/**
 * @desc    Get default preferences
 * @route   GET /api/notifications/preferences/defaults
 * @access  Private
 */
exports.getDefaults = asyncHandler(async (req, res) => {
  res.json(
    ApiResponse.success(
      preferencesService.DEFAULT_PREFERENCES,
      'Default preferences retrieved'
    )
  )
})
