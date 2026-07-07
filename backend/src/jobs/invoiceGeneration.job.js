const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const { prisma } = require('../config/database')
const { uploadBuffer } = require('../storage/storage.service')
const { notificationsQueue } = require('../queues')
const logger = require('../config/logger')
const dayjs = require('dayjs')

/**
 * Generates a PDF or Excel invoice (or batch) in the background.
 * Job data: { businessId, invoiceId, format?, userId }
 *
 * Supports two modes:
 *   - Single invoice: { invoiceId } — generates PDF for one invoice
 *   - Batch:         { invoiceIds: [...] } — generates a single combined Excel
 */
async function processInvoiceGenerationJob(job) {
  const { businessId, invoiceId, invoiceIds, format = 'pdf', userId } = job.data

  if (invoiceIds && invoiceIds.length > 0) {
    return generateBatchInvoiceExcel(businessId, invoiceIds, userId)
  }

  if (!invoiceId) {
    throw new Error('Invoice generation job requires invoiceId or invoiceIds')
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, sku: true } } } },
      business: { select: { name: true, email: true, phone: true, logo: true, taxNumber: true } }
    }
  })

  if (!invoice) throw new Error(`Invoice ${invoiceId} not found for business ${businessId}`)

  const buffer = format === 'excel'
    ? await buildInvoiceExcel(invoice)
    : await buildInvoicePdf(invoice)

  const ext = format === 'excel' ? 'xlsx' : 'pdf'
  const objectName = `invoices/${businessId}/${invoice.invoiceNumber}.${ext}`
  const url = await uploadBuffer(objectName, buffer, format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf')

  // Update the invoice with the generated file URL
  await prisma.invoice.update({ where: { id: invoiceId }, data: { fileUrl: url } })

  // Notify the requesting user
  if (userId) {
    await notificationsQueue.add('invoice-pdf-ready', {
      businessId, userId,
      title: `Invoice ${invoice.invoiceNumber} ready`,
      message: `Your invoice has been generated. Click to download.`,
      type: 'success',
      link: url
    })
  }

  logger.info(`Invoice generated: ${objectName}`)
  return { invoiceId, url }
}

async function buildInvoicePdf(invoice) {
  const biz = invoice.business
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text(biz.name, { align: 'left' })
    doc.fontSize(10).font('Helvetica').fillColor('#555')
    if (biz.email) doc.text(biz.email)
    if (biz.phone) doc.text(biz.phone)
    if (biz.taxNumber) doc.text(`Tax No: ${biz.taxNumber}`)
    doc.fillColor('black')

    doc.moveUp(4).fontSize(22).font('Helvetica-Bold').fillColor('#1a1a2e')
      .text('INVOICE', { align: 'right' })
    doc.fontSize(10).font('Helvetica').fillColor('#555')
      .text(`#${invoice.invoiceNumber}`, { align: 'right' })
    doc.fillColor('black')

    // Divider
    const y = doc.y + 10
    doc.moveTo(50, y).lineTo(545, y).stroke('#e0e0e0')
    doc.moveDown(1)

    // Bill To / Dates
    doc.fontSize(10).font('Helvetica-Bold').text('BILL TO')
    doc.font('Helvetica').text(invoice.customer?.name || '—')
    if (invoice.customer?.email) doc.text(invoice.customer.email)

    doc.moveUp(3).text(`Date: ${dayjs(invoice.issueDate).format('MMM D, YYYY')}`, { align: 'right' })
    doc.text(`Due: ${dayjs(invoice.dueDate).format('MMM D, YYYY')}`, { align: 'right' })
    doc.text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' })
    doc.moveDown()

    // Items table header
    const tableTop = doc.y + 10
    doc.rect(50, tableTop, 495, 22).fill('#1a1a2e')
    doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
    doc.text('ITEM', 60, tableTop + 6)
    doc.text('QTY', 310, tableTop + 6)
    doc.text('UNIT PRICE', 360, tableTop + 6)
    doc.text('AMOUNT', 460, tableTop + 6)
    doc.fillColor('black').font('Helvetica').fontSize(9)

    let rowY = tableTop + 28
    let alternateRow = false
    for (const item of invoice.items) {
      const itemName = item.description || item.product?.name || '—'
      if (alternateRow) doc.rect(50, rowY - 4, 495, 20).fill('#f9f9f9')
      doc.fillColor('black')
        .text(itemName, 60, rowY, { width: 240 })
        .text(String(item.quantity), 310, rowY)
        .text(Number(item.unitPrice).toFixed(2), 360, rowY)
        .text(Number(item.subtotal).toFixed(2), 460, rowY)
      rowY += 22
      alternateRow = !alternateRow
    }

    // Totals
    doc.moveDown(0.5)
    const totY = doc.y + 10
    doc.moveTo(350, totY).lineTo(545, totY).stroke('#e0e0e0')
    doc.moveDown(0.5)

    const subtotal = Number(invoice.subtotal || 0)
    const tax = Number(invoice.taxAmount || 0)
    const discount = Number(invoice.discountAmount || 0)
    const total = Number(invoice.total || 0)
    const paid = Number(invoice.amountPaid || 0)
    const balance = Number(invoice.balance || 0)

    function totRow(label, val, bold = false) {
      if (bold) doc.font('Helvetica-Bold')
      else doc.font('Helvetica')
      doc.text(label, 350, doc.y).text(val, 460, doc.y - 12)
      doc.moveDown(0.3)
    }

    totRow('Subtotal:', subtotal.toFixed(2))
    if (discount) totRow('Discount:', `-${discount.toFixed(2)}`)
    if (tax) totRow('Tax:', tax.toFixed(2))
    totRow('TOTAL:', total.toFixed(2), true)
    totRow('Amount Paid:', paid.toFixed(2))
    totRow('Balance Due:', balance.toFixed(2), true)

    // Footer
    if (invoice.notes) {
      doc.moveDown().fontSize(9).font('Helvetica').fillColor('#555')
        .text(`Notes: ${invoice.notes}`)
    }
    if (invoice.terms) {
      doc.moveDown(0.3).text(`Terms: ${invoice.terms}`)
    }

    doc.end()
  })
}

async function buildInvoiceExcel(invoice) {
  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet('Invoice')

  sheet.columns = [
    { header: 'Item', key: 'item', width: 40 },
    { header: 'Qty', key: 'qty', width: 10 },
    { header: 'Unit Price', key: 'price', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 }
  ]

  for (const item of invoice.items) {
    sheet.addRow({
      item: item.description || item.product?.name || '—',
      qty: Number(item.quantity),
      price: Number(item.unitPrice),
      amount: Number(item.subtotal)
    })
  }

  sheet.addRow({})
  sheet.addRow({ item: 'Total', amount: Number(invoice.total) })
  sheet.addRow({ item: 'Amount Paid', amount: Number(invoice.amountPaid) })
  sheet.addRow({ item: 'Balance Due', amount: Number(invoice.balance) })

  return wb.xlsx.writeBuffer()
}

async function generateBatchInvoiceExcel(businessId, invoiceIds, userId) {
  const invoices = await prisma.invoice.findMany({
    where: { businessId, id: { in: invoiceIds } },
    include: { customer: { select: { name: true } } }
  })

  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet('Invoices')

  sheet.columns = [
    { header: 'Invoice #', key: 'number', width: 20 },
    { header: 'Customer', key: 'customer', width: 30 },
    { header: 'Issue Date', key: 'issue', width: 15 },
    { header: 'Due Date', key: 'due', width: 15 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Paid', key: 'paid', width: 15 },
    { header: 'Balance', key: 'balance', width: 15 },
    { header: 'Status', key: 'status', width: 12 }
  ]

  sheet.getRow(1).font = { bold: true }

  for (const inv of invoices) {
    sheet.addRow({
      number: inv.invoiceNumber,
      customer: inv.customer?.name || '—',
      issue: dayjs(inv.issueDate).format('YYYY-MM-DD'),
      due: dayjs(inv.dueDate).format('YYYY-MM-DD'),
      total: Number(inv.total),
      paid: Number(inv.amountPaid),
      balance: Number(inv.balance),
      status: inv.status
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  const objectName = `invoices/${businessId}/batch-${Date.now()}.xlsx`
  const url = await uploadBuffer(objectName, buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

  if (userId) {
    await notificationsQueue.add('batch-invoice-ready', {
      businessId, userId,
      title: 'Invoice export ready',
      message: `${invoices.length} invoices exported. Click to download.`,
      type: 'success',
      link: url
    })
  }

  logger.info(`Batch invoice export: ${objectName}`)
  return { count: invoices.length, url }
}

module.exports = processInvoiceGenerationJob
