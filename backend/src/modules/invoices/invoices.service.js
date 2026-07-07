const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { emitToBusiness } = require('../../config/socket')
const emailQueue = require('../../queues/email.queue')

async function listInvoices(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const where = {
    businessId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {})
  }
  const [items, total] = await Promise.all([
    prisma.invoice.findMany({ where, skip, take, orderBy, include: { customer: { select: { id: true, name: true } }, items: { include: { product: { select: { id: true, name: true } } } } } }),
    prisma.invoice.count({ where })
  ])
  return { items, total, page, limit }
}

async function getInvoice(businessId, id) {
  const inv = await prisma.invoice.findFirst({ where: { id, businessId }, include: { customer: true, items: { include: { product: true } }, payments: true, saleOrder: true } })
  if (!inv) throw ApiError.notFound('Invoice not found')
  return inv
}

async function createInvoice(businessId, data, req) {
  const { customerId, dueDate, items, notes } = data
  const customer = await prisma.customer.findFirst({ where: { id: customerId, businessId } })
  if (!customer) throw ApiError.notFound('Customer not found')

  let subtotal = 0, taxAmount = 0, discountAmount = 0
  const enriched = items.map((i) => {
    const base = i.unitPrice * i.quantity
    const disc = i.discount || 0
    const tax = (base - disc) * ((i.tax || 0) / 100)
    const total = base - disc + tax
    subtotal += base; taxAmount += tax; discountAmount += disc
    return { ...i, total }
  })
  const total = subtotal - discountAmount + taxAmount

  const count = await prisma.invoice.count({ where: { businessId } })
  const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`

  const invoice = await prisma.invoice.create({
    data: {
      businessId, customerId, invoiceNumber, subtotal, discountAmount, taxAmount,
      total, balance: total, amountPaid: 0, status: 'draft',
      dueDate: new Date(dueDate), notes,
      items: { create: enriched }
    },
    include: { customer: true, items: { include: { product: true } } }
  })

  req?.audit?.('invoice.created', 'Invoice', invoice.id, { invoiceNumber, total })
  return invoice
}

async function sendInvoice(businessId, id, req) {
  const inv = await getInvoice(businessId, id)
  if (!['draft', 'sent'].includes(inv.status)) throw ApiError.badRequest('Only draft or sent invoices can be re-sent')

  await prisma.invoice.update({ where: { id }, data: { status: 'sent', sentAt: new Date() } })
  await emailQueue.add('send-invoice', { email: inv.customer.email, name: inv.customer.name, invoiceNumber: inv.invoiceNumber, total: inv.total })
  req?.audit?.('invoice.sent', 'Invoice', id)
  return getInvoice(businessId, id)
}

async function recordPayment(businessId, invoiceId, data, userId, req) {
  const inv = await getInvoice(businessId, invoiceId)
  if (['paid', 'cancelled'].includes(inv.status)) throw ApiError.badRequest('Invoice is already paid or cancelled')
  if (data.amount > Number(inv.balance)) throw ApiError.badRequest(`Payment exceeds outstanding balance of ${inv.balance}`)

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        businessId, referenceType: 'invoice', invoiceId,
        customerId: inv.customerId, amount: data.amount,
        method: data.method, reference: data.reference,
        notes: data.notes, createdById: userId
      }
    })

    const newPaid = Number(inv.amountPaid) + data.amount
    const newBalance = Number(inv.total) - newPaid
    const newStatus = newBalance <= 0 ? 'paid' : 'partial'

    await tx.invoice.update({ where: { id: invoiceId }, data: { amountPaid: newPaid, balance: newBalance, status: newStatus } })

    // Update customer ledger
    const cust = await tx.customer.findUnique({ where: { id: inv.customerId }, select: { balance: true } })
    const newCustBalance = Number(cust.balance) - data.amount
    await tx.customer.update({ where: { id: inv.customerId }, data: { balance: newCustBalance } })
    await tx.customerLedger.create({ data: { customerId: inv.customerId, type: 'payment', referenceId: payment.id, debit: 0, credit: data.amount, balance: newCustBalance, description: `Payment for ${inv.invoiceNumber}` } })

    return { payment, status: newStatus, balance: newBalance }
  })

  if (result.status === 'paid') {
    emitToBusiness(businessId, 'invoice:paid', { invoiceId, invoiceNumber: inv.invoiceNumber })
  }

  req?.audit?.('invoice.payment', 'Invoice', invoiceId, { amount: data.amount, method: data.method })
  return result
}

async function cancelInvoice(businessId, id, req) {
  const inv = await getInvoice(businessId, id)
  if (inv.status === 'paid') throw ApiError.badRequest('Cannot cancel a paid invoice. Void the sale instead.')
  await prisma.invoice.update({ where: { id }, data: { status: 'cancelled' } })
  req?.audit?.('invoice.cancelled', 'Invoice', id)
  return { cancelled: true }
}

module.exports = { listInvoices, getInvoice, createInvoice, sendInvoice, recordPayment, cancelInvoice }
