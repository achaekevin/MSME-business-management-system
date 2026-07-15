/**
 * Notification Preferences Controller
 */

const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')
const preferencesService = require('./preferences.service')

/**
 * @desc    Get user notification preferences
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
exports.getPreferences = asyncHandler(async (req, res) => {
  const preferences = await preferencesService.getUserPreferences(req.user.id)

  success(res, preferences, 'Preferences retrieved successfully')
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

  success(res, preferences, 'Preferences updated successfully')
})

/**
 * @desc    Reset preferences to defaults
 * @route   POST /api/notifications/preferences/reset
 * @access  Private
 */
exports.resetPreferences = asyncHandler(async (req, res) => {
  const preferences = await preferencesService.resetPreferences(req.user.id)

  success(res, preferences, 'Preferences reset to defaults')
})

/**
 * @desc    Get default preferences
 * @route   GET /api/notifications/preferences/defaults
 * @access  Private
 */
exports.getDefaults = asyncHandler(async (req, res) => {
  success(res, preferencesService.DEFAULT_PREFERENCES, 'Default preferences retrieved')
})
