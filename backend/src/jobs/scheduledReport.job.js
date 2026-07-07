const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const { prisma } = require('../config/database')
const { uploadBuffer } = require('../storage/storage.service')
const { notificationsQueue } = require('../queues')
const logger = require('../config/logger')
const dayjs = require('dayjs')

/**
 * Generates scheduled reports (sales, inventory, finance) in the background
 * and notifies the requesting user with a download link.
 *
 * Job data: {
 *   businessId, userId,
 *   reportType: 'sales' | 'inventory' | 'customers' | 'expenses' | 'payroll' | 'finance',
 *   format:     'pdf' | 'excel',
 *   filters:    { startDate?, endDate?, ... }
 * }
 */
async function processScheduledReportJob(job) {
  // Special dispatch job: fan out per-business backup jobs
  if (job.name === 'trigger-nightly-backups' || job.data?._type === 'nightly_backup_trigger') {
    const { triggerNightlyBackups } = require('../queues/scheduler')
    return triggerNightlyBackups()
  }

  const { businessId, userId, reportType, format = 'excel', filters = {} } = job.data

  logger.info(`Generating scheduled ${reportType} report for business ${businessId}`)

  const data = await fetchData(reportType, businessId, filters)
  const buffer = format === 'excel'
    ? await generateExcel(reportType, data)
    : await generatePdf(reportType, data, businessId, filters)

  const ext = format === 'excel' ? 'xlsx' : 'pdf'
  const objectName = `reports/${businessId}/${reportType}-${dayjs().format('YYYY-MM-DD-HHmmss')}.${ext}`
  const url = await uploadBuffer(objectName, buffer)

  // Store in Document library if model exists
  await prisma.document.create({
    data: {
      businessId,
      name: `${reportType.replace(/_/g, ' ')} — ${dayjs().format('MMMM D, YYYY')}`,
      type: 'report',
      url,
      mimeType: format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf',
      size: buffer.length,
      version: 1,
      uploadedById: userId || null
    }
  }).catch(() => { /* document model may not have a userId yet, safe to skip */ })

  // Notify user
  if (userId) {
    await notificationsQueue.add('scheduled-report-ready', {
      businessId, userId,
      title: `${reportType} report ready`,
      message: `Your scheduled report has been generated. Click to download.`,
      type: 'success',
      link: url
    })
  }

  logger.info(`Scheduled report generated: ${objectName}`)
  return { url, reportType, rows: data.length }
}

// ── Report Data Fetchers ──────────────────────────────────────────────────────

async function fetchData(reportType, businessId, filters) {
  const dateFilter = buildDateFilter(filters)

  switch (reportType) {
    case 'sales':
      return prisma.saleOrder.findMany({
        where: { businessId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }).then((rows) => rows.map((r) => ({
        'Order #': r.orderNumber,
        'Customer': r.customer?.name || '—',
        'Date': dayjs(r.createdAt).format('YYYY-MM-DD'),
        'Status': r.status,
        'Subtotal': Number(r.subtotal),
        'Tax': Number(r.taxAmount || 0),
        'Discount': Number(r.discountAmount || 0),
        'Total': Number(r.total)
      })))

    case 'inventory':
      return prisma.product.findMany({
        where: { businessId },
        include: { inventoryStocks: { select: { quantity: true, branchId: true } } }
      }).then((rows) => rows.map((p) => {
        const qty = p.inventoryStocks.reduce((s, st) => s + Number(st.quantity), 0)
        return {
          'SKU': p.sku,
          'Product': p.name,
          'Category': p.category || '—',
          'Cost Price': Number(p.costPrice),
          'Selling Price': Number(p.sellingPrice),
          'Current Stock': qty,
          'Reorder Point': p.reorderPoint,
          'Status': qty <= p.reorderPoint ? 'LOW STOCK' : 'OK'
        }
      }))

    case 'customers':
      return prisma.customer.findMany({
        where: { businessId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        orderBy: { totalPurchases: 'desc' }
      }).then((rows) => rows.map((c) => ({
        'Name': c.name,
        'Email': c.email || '—',
        'Phone': c.phone || '—',
        'Total Purchases': Number(c.totalPurchases || 0),
        'Balance Owed': Number(c.balance || 0),
        'Joined': dayjs(c.createdAt).format('YYYY-MM-DD'),
        'Status': c.isActive ? 'Active' : 'Inactive'
      })))

    case 'expenses':
      return prisma.expense.findMany({
        where: { businessId, ...(dateFilter ? { date: dateFilter } : {}) },
        include: { createdBy: { select: { name: true } } },
        orderBy: { date: 'desc' }
      }).then((rows) => rows.map((e) => ({
        'Date': dayjs(e.date).format('YYYY-MM-DD'),
        'Category': e.category,
        'Description': e.description,
        'Amount': Number(e.amount),
        'Payment': e.paymentMethod,
        'Reference': e.reference || '—',
        'Status': e.status,
        'Recorded By': e.createdBy?.name || '—'
      })))

    case 'payroll':
      return prisma.payrollRun.findMany({
        where: { businessId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        include: {
          payslips: {
            include: { employee: { select: { name: true, employeeNumber: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      }).then((runs) => {
        const rows = []
        for (const run of runs) {
          for (const payslip of run.payslips) {
            rows.push({
              'Period': run.period,
              'Employee #': payslip.employee?.employeeNumber || '—',
              'Employee': payslip.employee?.name || '—',
              'Gross Salary': Number(payslip.grossSalary),
              'Deductions': Number(payslip.deductions),
              'Net Salary': Number(payslip.netSalary),
              'Status': run.status
            })
          }
        }
        return rows
      })

    case 'finance': {
      const [sales, expenses, payments] = await Promise.all([
        prisma.saleOrder.aggregate({
          where: { businessId, status: { not: 'voided' }, ...(dateFilter ? { createdAt: dateFilter } : {}) },
          _sum: { total: true }, _count: true
        }),
        prisma.expense.aggregate({
          where: { businessId, ...(dateFilter ? { date: dateFilter } : {}) },
          _sum: { amount: true }, _count: true
        }),
        prisma.payment.aggregate({
          where: { businessId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
          _sum: { amount: true }, _count: true
        })
      ])

      const revenue = Number(sales._sum.total || 0)
      const totalExpenses = Number(expenses._sum.amount || 0)
      return [{
        Metric: 'Total Revenue',        Value: revenue },
      { Metric: 'Total Orders',         Value: sales._count },
      { Metric: 'Total Expenses',       Value: totalExpenses },
      { Metric: 'Expense Transactions', Value: expenses._count },
      { Metric: 'Total Payments In',    Value: Number(payments._sum.amount || 0) },
      { Metric: 'Payment Transactions', Value: payments._count },
      { Metric: 'Net Profit',           Value: revenue - totalExpenses }
      ]
    }

    default:
      return []
  }
}

// ── File Builders ─────────────────────────────────────────────────────────────

async function generateExcel(reportType, data) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'MSME Business Suite'
  wb.created = new Date()

  const sheet = wb.addWorksheet(reportType.replace(/_/g, ' ').toUpperCase())

  if (data.length === 0) {
    sheet.addRow(['No data for selected period'])
    return wb.xlsx.writeBuffer()
  }

  sheet.columns = Object.keys(data[0]).map((key) => ({
    header: key, key, width: Math.max(key.length + 4, 16)
  }))

  // Header row style
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } }

  for (const row of data) sheet.addRow(row)

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length }
  }

  // Freeze header
  sheet.views = [{ state: 'frozen', ySplit: 1 }]

  return wb.xlsx.writeBuffer()
}

async function generatePdf(reportType, data, businessId, filters) {
  const business = await prisma.business.findUnique({
    where: { id: businessId }, select: { name: true }
  })

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text(`${business?.name || 'Business'} — ${reportType.toUpperCase()} REPORT`, { align: 'center' })
    doc.fontSize(9).font('Helvetica').fillColor('#666')
      .text(`Generated: ${dayjs().format('MMMM D, YYYY HH:mm')}`, { align: 'center' })

    if (filters.startDate || filters.endDate) {
      doc.text(`Period: ${filters.startDate || '...'} to ${filters.endDate || '...'}`, { align: 'center' })
    }

    doc.fillColor('black').moveDown()

    if (data.length === 0) {
      doc.text('No data for the selected period.', { align: 'center' })
      doc.end()
      return
    }

    const columns = Object.keys(data[0])
    const colWidth = Math.min(140, Math.floor(751 / columns.length))
    const tableLeft = 40
    let y = doc.y

    // Header
    doc.rect(tableLeft, y, colWidth * columns.length, 18).fill('#1a1a2e')
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
    columns.forEach((col, i) => {
      doc.text(col, tableLeft + i * colWidth + 2, y + 4, { width: colWidth - 4, ellipsis: true })
    })
    y += 20
    doc.fillColor('black').font('Helvetica').fontSize(7)

    let alt = false
    for (const row of data) {
      if (y > 540) {
        doc.addPage({ layout: 'landscape' })
        y = 40
      }
      if (alt) doc.rect(tableLeft, y - 2, colWidth * columns.length, 14).fill('#f5f5f5')
      doc.fillColor('black')
      columns.forEach((col, i) => {
        const val = row[col]
        doc.text(String(val ?? ''), tableLeft + i * colWidth + 2, y, { width: colWidth - 4, ellipsis: true })
      })
      y += 14
      alt = !alt
    }

    doc.end()
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDateFilter(filters) {
  if (!filters.startDate && !filters.endDate) return null
  return {
    ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
    ...(filters.endDate ? { lte: new Date(filters.endDate) } : {})
  }
}

module.exports = processScheduledReportJob
