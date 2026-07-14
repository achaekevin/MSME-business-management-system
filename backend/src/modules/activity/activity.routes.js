/**
 * Activity Feed Routes
 */

const express = require('express')
const router = express.Router()
const controller = require('./activity.controller')
const { authenticate } = require('../../middleware/auth.middleware')

// All routes require authentication
router.use(authenticate)

// Get recent activities
router.get('/', controller.getRecentActivities)

// Get activity statistics
router.get('/stats', controller.getActivityStats)

// Get activity types
router.get('/types', controller.getActivityTypes)

module.exports = router
