const router = require('express').Router()
const controller = require('./documents.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Document Types
router.post('/types', requirePermission('hr.create'), controller.createDocumentType)
router.get('/types', requirePermission('hr.view'), controller.getDocumentTypes)
router.put('/types/:id', requirePermission('hr.update'), controller.updateDocumentType)

// Employee Documents
router.post('/upload', requirePermission('hr.create'), controller.uploadEmployeeDocument)
router.get('/employees/:employeeId', requirePermission('hr.view'), controller.getEmployeeDocuments)
router.post('/:id/verify', requirePermission('hr.approve'), controller.verifyDocument)
router.put('/:id', requirePermission('hr.update'), controller.updateEmployeeDocument)
router.delete('/:id', requirePermission('hr.delete'), controller.deleteEmployeeDocument)

// Tracking & Reports
router.get('/expiring', requirePermission('hr.view'), controller.getExpiringDocuments)
router.get('/expired', requirePermission('hr.view'), controller.getExpiredDocuments)
router.get('/pending-verifications', requirePermission('hr.view'), controller.getPendingVerifications)
router.get('/compliance-report', requirePermission('hr.view'), controller.getDocumentComplianceReport)

module.exports = router
