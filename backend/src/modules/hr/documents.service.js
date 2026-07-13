const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

async function createDocumentType(businessId, data) {
  return await prisma.documentType.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getDocumentTypes(businessId, isActive) {
  const where = { businessId }
  if (isActive !== undefined) where.isActive = isActive

  return await prisma.documentType.findMany({
    where,
    orderBy: { name: 'asc' }
  })
}

async function updateDocumentType(id, data) {
  return await prisma.documentType.update({
    where: { id },
    data
  })
}

// ============================================================================
// EMPLOYEE DOCUMENTS
// ============================================================================

async function uploadEmployeeDocument(employeeId, data) {
  return await prisma.employeeDocumentRecord.create({
    data: {
      employeeId,
      ...data
    }
  })
}

async function getEmployeeDocuments(employeeId, filters = {}) {
  const where = { employeeId }
  
  if (filters.documentTypeId) where.documentTypeId = filters.documentTypeId
  if (filters.isVerified !== undefined) where.isVerified = filters.isVerified

  return await prisma.employeeDocumentRecord.findMany({
    where,
    orderBy: { uploadedAt: 'desc' }
  })
}

async function verifyDocument(documentId, verifiedBy) {
  return await prisma.employeeDocumentRecord.update({
    where: { id: documentId },
    data: {
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date()
    }
  })
}

async function updateEmployeeDocument(documentId, data) {
  return await prisma.employeeDocumentRecord.update({
    where: { id: documentId },
    data
  })
}

async function deleteEmployeeDocument(documentId) {
  return await prisma.employeeDocumentRecord.delete({
    where: { id: documentId }
  })
}

// ============================================================================
// DOCUMENT TRACKING & REPORTS
// ============================================================================

async function getExpiringDocuments(businessId, daysAhead = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const documents = await prisma.employeeDocumentRecord.findMany({
    where: {
      employee: { businessId },
      expiryDate: {
        gte: new Date(),
        lte: futureDate
      }
    },
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          email: true,
          department: { select: { name: true } }
        }
      }
    },
    orderBy: { expiryDate: 'asc' }
  })

  return documents
}

async function getExpiredDocuments(businessId) {
  const documents = await prisma.employeeDocumentRecord.findMany({
    where: {
      employee: { businessId },
      expiryDate: {
        lt: new Date()
      }
    },
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          email: true,
          department: { select: { name: true } }
        }
      }
    },
    orderBy: { expiryDate: 'desc' }
  })

  return documents
}

async function getPendingVerifications(businessId) {
  const documents = await prisma.employeeDocumentRecord.findMany({
    where: {
      employee: { businessId },
      isVerified: false
    },
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          department: { select: { name: true } }
        }
      }
    },
    orderBy: { uploadedAt: 'desc' }
  })

  return documents
}

async function getDocumentComplianceReport(businessId) {
  // Get all required document types
  const requiredTypes = await prisma.documentType.findMany({
    where: {
      businessId,
      required: true,
      isActive: true
    }
  })

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: {
      businessId,
      status: 'active'
    },
    include: {
      documentRecords: {
        where: {
          isVerified: true
        }
      }
    }
  })

  const compliance = employees.map(employee => {
    const missingDocuments = requiredTypes.filter(type => {
      return !employee.documentRecords.some(doc => doc.documentTypeId === type.id)
    })

    const expiredDocuments = employee.documentRecords.filter(doc => {
      return doc.expiryDate && doc.expiryDate < new Date()
    })

    const expiringDocuments = employee.documentRecords.filter(doc => {
      if (!doc.expiryDate) return false
      const daysUntilExpiry = Math.ceil((doc.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30
    })

    const isCompliant = missingDocuments.length === 0 && expiredDocuments.length === 0

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNumber: employee.employeeNumber,
      isCompliant,
      totalDocuments: employee.documentRecords.length,
      missingDocuments: missingDocuments.map(d => d.name),
      expiredDocuments: expiredDocuments.length,
      expiringDocuments: expiringDocuments.length
    }
  })

  const summary = {
    totalEmployees: employees.length,
    compliant: compliance.filter(c => c.isCompliant).length,
    nonCompliant: compliance.filter(c => !c.isCompliant).length,
    complianceRate: employees.length > 0 
      ? ((compliance.filter(c => c.isCompliant).length / employees.length) * 100).toFixed(2)
      : 0
  }

  return {
    summary,
    compliance
  }
}

module.exports = {
  // Document Types
  createDocumentType,
  getDocumentTypes,
  updateDocumentType,

  // Employee Documents
  uploadEmployeeDocument,
  getEmployeeDocuments,
  verifyDocument,
  updateEmployeeDocument,
  deleteEmployeeDocument,

  // Tracking & Reports
  getExpiringDocuments,
  getExpiredDocuments,
  getPendingVerifications,
  getDocumentComplianceReport
}
