const express = require('express')
const router = express.Router()
const controller = require('./documents.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { uploadAny } = require('../../middleware/upload.middleware')

router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Business document storage with versioning and signed URLs
 */

router.get('/types', controller.types)
router.get('/', controller.list)
router.get('/:id', controller.getOne)
router.get('/:id/signed-url', controller.getSignedUrl)
router.post('/', uploadAny.single('file'), controller.upload)
router.delete('/:id', controller.remove)

module.exports = router
