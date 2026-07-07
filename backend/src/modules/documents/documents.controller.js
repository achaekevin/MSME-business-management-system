const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./documents.service')

const list = asyncHandler(async (req, res) => {
  const result = await service.listDocuments(req.businessId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const getOne = asyncHandler(async (req, res) => {
  success(res, await service.getDocument(req.businessId, req.params.id))
})

const getSignedUrl = asyncHandler(async (req, res) => {
  success(res, await service.getSignedUrl(req.businessId, req.params.id))
})

const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw require('../../helpers/response').ApiError.badRequest('No file uploaded')
  created(res, await service.uploadDocument(req.businessId, req.file, req.body, req.userId, req), 'Document uploaded')
})

const remove = asyncHandler(async (req, res) => {
  await service.deleteDocument(req.businessId, req.params.id, req)
  noContent(res)
})

const types = asyncHandler(async (_req, res) => {
  success(res, await service.getDocumentTypes())
})

module.exports = { list, getOne, getSignedUrl, upload, remove, types }
