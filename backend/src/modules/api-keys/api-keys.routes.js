const express = require('express')
const router = express.Router()
const controller = require('./api-keys.controller')
const { authenticate } = require('../../middleware/auth')
const { requirePermission } = require('../../middleware/permission.middleware')

// All routes require authentication and admin permission
router.use(authenticate)
router.use(requirePermission('settings:write'))

router.post('/', controller.createApiKey)
router.get('/', controller.getApiKeys)
router.get('/:id', controller.getApiKey)
router.put('/:id', controller.updateApiKey)
router.delete('/:id', controller.revokeApiKey)
router.post('/:id/regenerate', controller.regenerateApiKey)

module.exports = router
