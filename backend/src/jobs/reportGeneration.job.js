const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const { prisma } = require('../config/database')
const { uploadBuffer } = require('../storage/storage.service')
const logger = require('../config/logger')

/**
 * Generates a report file (PDF or Excel) in the background and uploads it
 * to object storage, then notifies the requesting user with a download link.
 * Job data: { businessId, userId, reportType, format, filters }
 */
async function processReportGenerationJob(job) {
  const { businessId, userId, reportType, format, filters = {} } = job.data

  let buffer
  if (format === 'excel') {
    buffer = await generateExcelReport(reportType, businessId, filters)
  } else {
    buffer = await generatePdfReport(reportType, businessId, filters)
  }

  const filename = `reports/${businessId}/${reportType}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`
  const url = await uploadBuffer(filename, buffer)

  await prisma.notification.create({
    data: {
      businessId,
      userId,
      title: 'Your report is ready',
      message: `${reportType} report has finished generating`,
      type: 'success',
      link: url
    }
  })

  logger.info(`Report generated: ${filename}`)
  return { url }
}

async function generateExcelReport(reportType, businessId, filters) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(reportType)

  const data = await fetchReportData(reportType, businessId, filters)
  if (data.length > 0) {
    sheet.columns = Object.keys(data[0]).map((key) => ({ header: key, key, width: 20 }))
    sheet.addRows(data)
  }

  return workbook.xlsx.writeBuffer()
}

async function generatePdfReport(reportType, businessId, filters) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(18).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' })
    doc.moveDown()

    const data = await fetchReportData(reportType, businessId, filters)
    data.forEach((row) => {
      doc.fontSize(10).text(JSON.stringify(row))
      doc.moveDown(0.3)
    })

    doc.end()
  })
}

async function fetchReportData(reportType, businessId, filters) {
  const dateFilter = {}
  if (filters.startDate) dateFilter.gte = new Date(filters.startDate)
  if (filters.endDate) dateFilter.lte = new Date(filters.endDate)

  switch (reportType) {
    case 'sales':
      return prisma.saleOrder.findMany({
        where: { businessId, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) },
        select: { orderNumber: true, total: true, status: true, createdAt: true }
      })
    case 'inventory':
      return prisma.product.findMany({
        where: { businessId },
        select: { sku: true, name: true, costPrice: true, sellingPrice: true }
      })
    case 'customers':
      return prisma.customer.findMany({
        where: { businessId },
        select: { name: true, totalPurchases: true, balance: true }
      })
    default:
      return []
  }
}

module.exports = processReportGenerationJob
