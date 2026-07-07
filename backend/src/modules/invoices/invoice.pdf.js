const PDFDocument = require('pdfkit')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { formatCurrency, formatDate } = require('./formatting')

/**
 * Generates a PDF buffer for an invoice.
 * Can be called from the invoices controller for on-demand download,
 * or from the invoice-generation BullMQ job for background processing.
 */
async function generateInvoicePdf(businessId, invoiceId) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, sku: true } } } }
    }
  })
  if (!invoice) throw ApiError.notFound('Invoice not found')

  const business = await prisma.business.findUnique({ where: { id: businessId } })

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── Header ─────────────────────────────────────────────────────────────
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#111827').text(business?.name || 'Business', 50, 50)
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
    if (business?.email) doc.text(business.email)
    if (business?.phone) doc.text(business.phone)

    // Invoice label (right side)
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#3b82f6').text('INVOICE', 400, 50, { align: 'right' })
    doc.fontSize(10).font('Helvetica').fillColor('#374151')
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 400, 90, { align: 'right' })
    doc.text(`Date: ${formatDate(invoice.createdAt)}`, 400, 105, { align: 'right' })
    doc.text(`Due: ${formatDate(invoice.dueDate)}`, 400, 120, { align: 'right' })

    // Status badge
    const statusColors = { paid: '#10b981', overdue: '#ef4444', sent: '#3b82f6', partial: '#f59e0b', draft: '#6b7280' }
    const statusColor = statusColors[invoice.status] || '#6b7280'
    doc.fontSize(10).fillColor(statusColor).text(invoice.status.toUpperCase(), 400, 135, { align: 'right' })

    // ── Bill To ────────────────────────────────────────────────────────────
    doc.moveTo(50, 160).lineTo(545, 160).strokeColor('#e5e7eb').stroke()
    doc.moveDown()
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#6b7280').text('BILL TO', 50, 175)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text(invoice.customer.name, 50, 188)
    doc.fontSize(10).font('Helvetica').fillColor('#374151')
    if (invoice.customer.email) doc.text(invoice.customer.email)
    if (invoice.customer.phone) doc.text(invoice.customer.phone)

    // ── Items table ────────────────────────────────────────────────────────
    const tableTop = 260
    doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor('#e5e7eb').stroke()

    // Headers
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#6b7280')
    doc.text('ITEM', 50, tableTop + 8)
    doc.text('QTY', 300, tableTop + 8, { width: 60, align: 'right' })
    doc.text('UNIT PRICE', 360, tableTop + 8, { width: 80, align: 'right' })
    doc.text('DISCOUNT', 440, tableTop + 8, { width: 60, align: 'right' })  // narrower
    doc.text('TOTAL', 460, tableTop + 8, { width: 85, align: 'right' })

    doc.moveTo(50, tableTop + 22).lineTo(545, tableTop + 22).strokeColor('#e5e7eb').stroke()

    // Rows
    let y = tableTop + 32
    doc.font('Helvetica').fillColor('#111827')
    for (const item of invoice.items) {
      if (y > 700) {
        doc.addPage()
        y = 50
      }
      doc.fontSize(10).text(item.product?.name || '—', 50, y, { width: 240 })
      doc.fontSize(10).text(String(Number(item.quantity)), 300, y, { width: 60, align: 'right' })
      doc.text(formatCurrency(item.unitPrice), 360, y, { width: 80, align: 'right' })
      doc.text(Number(item.discount) > 0 ? `-${formatCurrency(item.discount)}` : '—', 440, y, { width: 60, align: 'right' })
      doc.text(formatCurrency(item.total), 460, y, { width: 85, align: 'right' })
      y += 22
    }

    // ── Totals ─────────────────────────────────────────────────────────────
    y += 10
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke()
    y += 12

    const totalsX = 360

    function totalsRow(label, value, bold = false) {
      doc.fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? '#111827' : '#374151')
      doc.text(label, totalsX, y, { width: 100 })
      doc.text(formatCurrency(value), 460, y, { width: 85, align: 'right' })
      y += 18
    }

    totalsRow('Subtotal', invoice.subtotal)
    if (Number(invoice.discountAmount) > 0) totalsRow('Discount', -Number(invoice.discountAmount))
    if (Number(invoice.taxAmount) > 0) totalsRow('Tax', invoice.taxAmount)
    doc.moveTo(totalsX, y).lineTo(545, y).strokeColor('#e5e7eb').stroke()
    y += 6
    totalsRow('Total', invoice.total, true)

    if (Number(invoice.amountPaid) > 0) {
      totalsRow('Amount paid', invoice.amountPaid)
      totalsRow('Balance due', invoice.balance, true)
    }

    // ── Notes & footer ─────────────────────────────────────────────────────
    if (invoice.notes) {
      y += 20
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#6b7280').text('NOTES', 50, y)
      doc.fontSize(10).font('Helvetica').fillColor('#374151').text(invoice.notes, 50, y + 14, { width: 500 })
    }

    const pageHeight = doc.page.height - 60
    doc.fontSize(9).fillColor('#9ca3af').font('Helvetica')
      .text('Thank you for your business!', 50, pageHeight, { align: 'center' })
      .text(`Generated by MSME BMS · ${new Date().toLocaleDateString()}`, 50, pageHeight + 14, { align: 'center' })

    doc.end()
  })
}

module.exports = { generateInvoicePdf }
