/**
 * Data Export Service
 * Provides comprehensive data export functionality in multiple formats
 */

const { prisma } = require('../../config/database')
const logger = require('../../config/logger')
const { Parser } = require('json2csv')

const EXPORT_TYPES = {
  SALES: 'sales',
  INVOICES: 'invoices',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  EMPLOYEES: 'employees',
  EXPENSES: 'expenses',
  PAYMENTS: 'payments',
  PURCHASE_ORDERS: 'purchase_orders',
  INVENTORY: 'inventory',
  ALL: 'all'
}

const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'excel'
}

/**
 * Get data based on type
 */
async function fetchDataByType(businessId, type, filters = {}) {
  const { startDate, endDate, limit = 1000 } = filters
  const where = { businessId }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  let data = []

  switch (type) {
    case EXPORT_TYPES.SALES:
      data = await prisma.sale.findMany({
        where,
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true } }
            }
          },
          createdBy: { select: { name: true, email: true } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
      break

    case EXPORT_TYPES.INVOICES:
      data = await prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: true,
          createdBy: { select: { name: true, email: true } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
      break

    case EXPORT_TYPES.CUSTOMERS:
      data = await prisma.customer.findMany({
        where: { businessId },
        include: {
          _count: {
            select: { sales: true, invoices: true }
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
      break

    case EXPORT_TYPES.PRODUCTS:
      data = await prisma.product.findMany({
        where: { businessId },
        include: {
          category: { select: { name: true } },
          _count: {
            select: { saleItems: true }
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
      break

    case EXPORT_TYPES.EMPLOYEES:
      data = await prisma.user.findMany({
        where: {
          businesses: {
            some: { id: businessId }
          }
        },
        include: {
          role: { select: { name: true } },
          department: { select: { name: true } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
      break

    case EXPORT_TYPES.EXPENSES:
      data = await prisma.expense.findMany({
        where,
        include: {
          category: { select: { name: true } },
          createdBy: { select: { name: true, email: true } }
        },
        take: limit,
        orderBy: { date: 'desc' }
      })
      break

    case EXPORT_TYPES.PAYMENTS:
      data = await prisma.payment.findMany({
        where,
        include: {
          invoice: { select: { invoiceNumber: true } },
          customer: { select: { name: true } },
          createdBy: { select: { name: true } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
      break

    case EXPORT_TYPES.PURCHASE_ORDERS:
      data = await prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { name: true, email: true } },
          items: true,
          createdBy: { select: { name: true } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
      break

    case EXPORT_TYPES.INVENTORY:
      data = await prisma.product.findMany({
        where: { businessId },
        select: {
          sku: true,
          name: true,
          quantity: true,
          reorderLevel: true,
          costPrice: true,
          sellingPrice: true,
          category: { select: { name: true } },
          updatedAt: true
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      })
      break

    default:
      throw new Error(`Unknown export type: ${type}`)
  }

  return data
}

/**
 * Flatten nested objects for CSV export
 */
function flattenObject(obj, prefix = '') {
  const flattened = {}

  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      flattened[prefix + key] = ''
    } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
      Object.assign(flattened, flattenObject(obj[key], `${prefix}${key}_`))
    } else if (Array.isArray(obj[key])) {
      flattened[prefix + key] = JSON.stringify(obj[key])
    } else if (obj[key] instanceof Date) {
      flattened[prefix + key] = obj[key].toISOString()
    } else {
      flattened[prefix + key] = obj[key]
    }
  }

  return flattened
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return ''
  }

  // Flatten nested objects
  const flattenedData = data.map(item => flattenObject(item))

  const parser = new Parser()
  return parser.parse(flattenedData)
}

/**
 * Export data in specified format
 */
async function exportData(businessId, type, format = EXPORT_FORMATS.CSV, filters = {}) {
  try {
    logger.info(`Exporting ${type} data for business ${businessId} in ${format} format`)

    let data
    let exportData

    if (type === EXPORT_TYPES.ALL) {
      // Export all data types
      const allData = {}
      for (const exportType of Object.values(EXPORT_TYPES)) {
        if (exportType !== EXPORT_TYPES.ALL) {
          allData[exportType] = await fetchDataByType(businessId, exportType, filters)
        }
      }
      data = allData
    } else {
      data = await fetchDataByType(businessId, type, filters)
    }

    switch (format) {
      case EXPORT_FORMATS.CSV:
        if (type === EXPORT_TYPES.ALL) {
          // For "all" type, return object with CSV for each type
          exportData = {}
          for (const [key, value] of Object.entries(data)) {
            exportData[key] = convertToCSV(value)
          }
        } else {
          exportData = convertToCSV(data)
        }
        break

      case EXPORT_FORMATS.JSON:
        exportData = JSON.stringify(data, null, 2)
        break

      case EXPORT_FORMATS.EXCEL:
        // For Excel, we'll return JSON and let the frontend handle Excel generation
        // using a library like xlsx or exceljs
        exportData = data
        break

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }

    // Log the export activity
    await prisma.activityLog.create({
      data: {
        businessId,
        type: 'data.exported',
        description: `Exported ${type} data in ${format} format`,
        metadata: JSON.stringify({
          exportType: type,
          format,
          recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
          filters
        })
      }
    }).catch(err => logger.warn('Failed to log export activity:', err))

    logger.info(`Successfully exported ${type} data for business ${businessId}`)

    return {
      data: exportData,
      type,
      format,
      recordCount: Array.isArray(data) ? data.length : Object.keys(data).reduce((sum, key) => sum + data[key].length, 0),
      exportedAt: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Export failed:', error)
    throw error
  }
}

/**
 * Get export statistics
 */
async function getExportStats(businessId) {
  const stats = {}

  // Count records for each export type
  for (const type of Object.values(EXPORT_TYPES)) {
    if (type === EXPORT_TYPES.ALL) continue

    let count = 0
    try {
      switch (type) {
        case EXPORT_TYPES.SALES:
          count = await prisma.sale.count({ where: { businessId } })
          break
        case EXPORT_TYPES.INVOICES:
          count = await prisma.invoice.count({ where: { businessId } })
          break
        case EXPORT_TYPES.CUSTOMERS:
          count = await prisma.customer.count({ where: { businessId } })
          break
        case EXPORT_TYPES.PRODUCTS:
          count = await prisma.product.count({ where: { businessId } })
          break
        case EXPORT_TYPES.EMPLOYEES:
          count = await prisma.user.count({
            where: { businesses: { some: { id: businessId } } }
          })
          break
        case EXPORT_TYPES.EXPENSES:
          count = await prisma.expense.count({ where: { businessId } })
          break
        case EXPORT_TYPES.PAYMENTS:
          count = await prisma.payment.count({ where: { businessId } })
          break
        case EXPORT_TYPES.PURCHASE_ORDERS:
          count = await prisma.purchaseOrder.count({ where: { businessId } })
          break
        case EXPORT_TYPES.INVENTORY:
          count = await prisma.product.count({ where: { businessId } })
          break
      }
      stats[type] = count
    } catch (error) {
      logger.warn(`Failed to count ${type}:`, error)
      stats[type] = 0
    }
  }

  return stats
}

module.exports = {
  EXPORT_TYPES,
  EXPORT_FORMATS,
  exportData,
  getExportStats
}
