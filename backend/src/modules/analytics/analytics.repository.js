const { prisma } = require('../../config/database')
const dayjs = require('dayjs')

function getSalesInRange(businessId, start, end) {
  return prisma.saleOrder.aggregate({
    where: { businessId, status: { not: 'voided' }, createdAt: { gte: start, lte: end } },
    _sum: { total: true }
  })
}

function getExpensesInRange(businessId, start, end) {
  return prisma.expense.aggregate({
    where: { businessId, date: { gte: start, lte: end } },
    _sum: { amount: true }
  })
}

function getSaleOrdersInRange(businessId, start, end) {
  return prisma.saleOrder.findMany({
    where: { businessId, status: { not: 'voided' }, createdAt: { gte: start } },
    select: { createdAt: true, total: true }
  })
}

function getSaleOrdersCount(businessId, start, end) {
  return prisma.saleOrder.count({
    where: { businessId, status: { not: 'voided' }, createdAt: { gte: start, lte: end } }
  })
}

function getSaleOrdersAvg(businessId, start, end) {
  return prisma.saleOrder.aggregate({
    where: { businessId, status: { not: 'voided' }, createdAt: { gte: start, lte: end } },
    _avg: { total: true }
  })
}

function getCustomerCount(businessId, start, end) {
  return prisma.customer.count({
    where: { businessId, createdAt: { gte: start, ...(end ? { lte: end } : {}) } }
  })
}

function getOutstandingInvoices(businessId) {
  return prisma.invoice.aggregate({
    where: { businessId, status: { in: ['sent', 'partial', 'overdue'] } },
    _sum: { balance: true },
    _count: true
  })
}

function getSaleItems(businessId, start, limit) {
  return prisma.saleOrderItem.findMany({
    where: { saleOrder: { businessId, status: { not: 'voided' }, createdAt: { gte: start } } },
    include: { product: { select: { id: true, name: true, sku: true } } }
  })
}

function getSaleOrdersByCustomer(businessId, start) {
  return prisma.saleOrder.findMany({
    where: { businessId, status: { not: 'voided' }, customerId: { not: null }, createdAt: { gte: start } },
    include: { customer: { select: { id: true, name: true } } }
  })
}

function getInventoryStats(businessId) {
  return Promise.all([
    prisma.product.count({ where: { businessId, isActive: true, trackInventory: true } }),
    prisma.inventoryStock.count({ where: { product: { businessId, trackInventory: true }, quantity: { gt: 0, lte: 5 } } }),
    prisma.inventoryStock.count({ where: { product: { businessId, trackInventory: true }, quantity: { lte: 0 } } }),
    prisma.inventoryStock.findMany({
      where: { product: { businessId } },
      include: { product: { select: { costPrice: true } } }
    })
  ])
}

function getPaymentsInRange(businessId, referenceType, start, end) {
  return prisma.payment.aggregate({
    where: { businessId, referenceType, createdAt: { gte: start, lte: end } },
    _sum: { amount: true }
  })
}

module.exports = {
  getSalesInRange, getExpensesInRange, getSaleOrdersInRange, getSaleOrdersCount,
  getSaleOrdersAvg, getCustomerCount, getOutstandingInvoices, getSaleItems,
  getSaleOrdersByCustomer, getInventoryStats, getPaymentsInRange
}
