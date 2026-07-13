const asyncHandler = require('../../helpers/asyncHandler')
const documentsService = require('./documents.service')
const { successResponse } = require('../../helpers/response')

// Document Types
exports.createDocumentType = asyncHandler(async (req, res) => {
  const type = await documentsService.createDocumentType(req.businessId, req.body)
  successResponse(res, type, 'Document type created', 201)
})

exports.getDocumentTypes = asyncHandler(async (req, res) => {
  const types = await documentsService.getDocumentTypes(req.businessId, req.query.isActive)
  successResponse(res, types)
})

exports.updateDocumentType = asyncHandler(async (req, res) => {
  const type = await documentsService.updateDocumentType(req.params.id, req.body)
  successResponse(res, type, 'Document type updated')
})

// Employee Documents
exports.uploadEmployeeDocument = asyncHandler(async (req, res) => {
  const document = await documentsService.uploadEmployeeDocument(req.body.employeeId, req.body)
  successResponse(res, document, 'Document uploaded', 201)
})

exports.getEmployeeDocuments = asyncHandler(async (req, res) => {
  const documents = await documentsService.getEmployeeDocuments(req.params.employeeId, req.query)
  successResponse(res, documents)
})

exports.verifyDocument = asyncHandler(async (req, res) => {
  const document = await documentsService.verifyDocument(req.params.id, req.userId)
  successResponse(res, document, 'Document verified')
})

exports.updateEmployeeDocument = asyncHandler(async (req, res) => {
  const document = await documentsService.updateEmployeeDocument(req.params.id, req.body)
  successResponse(res, document, 'Document updated')
})

exports.deleteEmployeeDocument = asyncHandler(async (req, res) => {
  await documentsService.deleteEmployeeDocument(req.params.id)
  successResponse(res, null, 'Document deleted')
})

// Tracking & Reports
exports.getExpiringDocuments = asyncHandler(async (req, res) => {
  const { daysAhead } = req.query
  const documents = await documentsService.getExpiringDocuments(
    req.businessId,
    daysAhead ? parseInt(daysAhead) : 30
  )
  successResponse(res, documents)
})

exports.getExpiredDocuments = asyncHandler(async (req, res) => {
  const documents = await documentsService.getExpiredDocuments(req.businessId)
  successResponse(res, documents)
})

exports.getPendingVerifications = asyncHandler(async (req, res) => {
  const documents = await documentsService.getPendingVerifications(req.businessId)
  successResponse(res, documents)
})

exports.getDocumentComplianceReport = asyncHandler(async (req, res) => {
  const report = await documentsService.getDocumentComplianceReport(req.businessId)
  successResponse(res, report)
})
