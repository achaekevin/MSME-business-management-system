const { prisma } = require('../../config/database')
const { buildSearchClause } = require('../../helpers/pagination')

function findDocuments(businessId, { skip, take, orderBy, type, search }) {
  const where = {
    businessId,
    ...(type ? { type } : {}),
    ...(search ? buildSearchClause(search, ['name', 'type']) : {})
  }
  return Promise.all([
    prisma.document.findMany({
      where, skip, take, orderBy,
      include: { uploadedBy: { select: { id: true, name: true } } }
    }),
    prisma.document.count({ where })
  ])
}

function findDocumentById(businessId, id) {
  return prisma.document.findFirst({
    where: { id, businessId },
    include: { uploadedBy: { select: { id: true, name: true } } }
  })
}

function findByName(businessId, name) {
  return prisma.document.findFirst({
    where: { businessId, name },
    orderBy: { version: 'desc' }
  })
}

function createDocument(businessId, name, type, url, mimeType, size, version, userId) {
  return prisma.document.create({
    data: { businessId, name, type, url, mimeType, size, version, uploadedById: userId },
    include: { uploadedBy: { select: { id: true, name: true } } }
  })
}

function deleteDocument(id) {
  return prisma.document.delete({ where: { id } })
}

module.exports = { findDocuments, findDocumentById, findByName, createDocument, deleteDocument }
