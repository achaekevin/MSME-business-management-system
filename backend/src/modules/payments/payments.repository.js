const { prisma } = require('../../config/database')

function findMany(businessId, { skip, take, orderBy, method, referenceType, customerId, startDate, endDate }) {
  const where = {
    businessId,
    ...(method ? { method } : {}),
    ...(referenceType ? { referenceType } : {}),
    ...(customerId ? { customerId } : {}),
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {})
  }
  return Promise.all([
    prisma.payment.findMany({
      where, skip, take, orderBy,
      include: {
        invoice: { select: { id: true, invoiceNumber: true } },
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } })
  ])
}

function findById(businessId, id) {
  return prisma.payment.findFirst({
    where: { id, businessId },
    include: {
      invoice: true,
      customer: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } }
    }
  })
}

function createPayment(data) {
  return prisma.payment.create({ data })
}

function deletePayment(id) {
  return prisma.payment.delete({ where: { id } })
}

function updateInvoiceOnDelete(tx, invoiceId, decrementAmount) {
  return tx.invoice.findUnique({ where: { id: invoiceId } }).then((inv) => {
    if (!inv) return
    const newPaid = Math.max(0, Number(inv.amountPaid) - decrementAmount)
    const newBalance = Number(inv.total) - newPaid
    const newStatus = newBalance >= Number(inv.total) ? 'sent' : 'partial'
    return tx.invoice.update({
      where: { id: invoiceId },
      data: { amountPaid: newPaid, balance: newBalance, status: newStatus }
    })
  })
}

function incrementCustomerBalance(tx, customerId, amount) {
  return tx.customer.update({
    where: { id: customerId },
    data: { balance: { increment: amount } }
  })
}

function deleteTx(tx, id) {
  return tx.payment.delete({ where: { id } })
}

function groupByMethod(businessId, dateFilter) {
  return prisma.payment.groupBy({
    by: ['method'],
    where: { businessId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
    _sum: { amount: true },
    _count: true
  })
}

function groupByReferenceType(businessId, dateFilter) {
  return prisma.payment.groupBy({
    by: ['referenceType'],
    where: { businessId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
    _sum: { amount: true },
    _count: true
  })
}

function aggregateTotal(businessId, dateFilter) {
  return prisma.payment.aggregate({
    where: { businessId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
    _sum: { amount: true }
  })
}

module.exports = {
  findMany, findById, createPayment, deletePayment,
  updateInvoiceOnDelete, incrementCustomerBalance, deleteTx,
  groupByMethod, groupByReferenceType, aggregateTotal
}
