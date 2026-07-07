const repo = require('./documents.repository')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { uploadBuffer, deleteObject, getPresignedUrl } = require('../../storage/storage.service')
const { DOCUMENT_TYPES } = require('./documents.validators')

async function listDocuments(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total] = await repo.findDocuments(businessId, {
    skip, take, orderBy,
    type: query.type,
    search: query.search
  })
  return { items, total, page, limit }
}

async function getDocument(businessId, id) {
  const doc = await repo.findDocumentById(businessId, id)
  if (!doc) throw ApiError.notFound('Document not found')
  return doc
}

async function uploadDocument(businessId, file, data, userId, req) {
  const objectName = `documents/${businessId}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
  const url = await uploadBuffer(objectName, file.buffer, file.mimetype)

  const name = data.name || file.originalname
  const existing = await repo.findByName(businessId, name)
  const version = existing ? existing.version + 1 : 1

  const doc = await repo.createDocument(
    businessId, name,
    data.type || 'other',
    url, file.mimetype, file.size, version, userId
  )

  req?.audit?.('document.uploaded', 'Document', doc.id, { name: doc.name, type: doc.type, version })
  return doc
}

async function getSignedUrl(businessId, id) {
  const doc = await getDocument(businessId, id)
  // Extract object name from URL: strip protocol + host + bucket prefix
  const objectName = doc.url.split('/').slice(3).join('/')
  const signedUrl = await getPresignedUrl(objectName, 3600)
  return { url: signedUrl, expiresIn: 3600 }
}

async function deleteDocument(businessId, id, req) {
  const doc = await getDocument(businessId, id)
  try {
    const objectName = doc.url.split('/').slice(3).join('/')
    await deleteObject(objectName)
  } catch { /* Storage object may already be gone — clean up DB anyway */ }

  await repo.deleteDocument(id)
  req?.audit?.('document.deleted', 'Document', id, { name: doc.name })
  return { deleted: true }
}

async function getDocumentTypes() {
  return DOCUMENT_TYPES
}

module.exports = { listDocuments, getDocument, uploadDocument, getSignedUrl, deleteDocument, getDocumentTypes }
