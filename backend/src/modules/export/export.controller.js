/**
 * Data Export Controller
 */

const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')
const { exportData, getExportStats, EXPORT_TYPES, EXPORT_FORMATS } = require('./export.service')

/**
 * @desc    Export data
 * @route   POST /api/export
 * @access  Private
 */
exports.exportData = asyncHandler(async (req, res) => {
  const { type, format = 'csv', startDate, endDate, limit } = req.body
  const businessId = req.user.businessId

  if (!type || !Object.values(EXPORT_TYPES).includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid export type',
      data: { validTypes: Object.values(EXPORT_TYPES) }
    })
  }

  if (!Object.values(EXPORT_FORMATS).includes(format)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid export format',
      data: { validFormats: Object.values(EXPORT_FORMATS) }
    })
  }

  const filters = { startDate, endDate, limit }
  const result = await exportData(businessId, type, format, filters)

  // Set appropriate headers for file download
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `${type}_export_${timestamp}.${format === 'csv' ? 'csv' : 'json'}`

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    if (type === 'all') {
      // For "all" type, return JSON with multiple CSV files
      return res.json({
        success: true,
        data: result,
        message: 'Data exported successfully'
      })
    } else {
      return res.send(result.data)
    }
  } else if (format === 'json') {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send(result.data)
  } else {
    // Excel format - return JSON for frontend to process
    return success(res, result, 'Data exported successfully')
  }
})

/**
 * @desc    Get export statistics
 * @route   GET /api/export/stats
 * @access  Private
 */
exports.getExportStats = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId

  const stats = await getExportStats(businessId)

  success(res, stats, 'Export statistics retrieved successfully')
})

/**
 * @desc    Get available export types
 * @route   GET /api/export/types
 * @access  Private
 */
exports.getExportTypes = asyncHandler(async (req, res) => {
  const types = Object.values(EXPORT_TYPES).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }))

  const formats = Object.values(EXPORT_FORMATS).map(format => ({
    value: format,
    label: format.toUpperCase()
  }))

  success(res, { types, formats }, 'Export configuration retrieved successfully')
})
