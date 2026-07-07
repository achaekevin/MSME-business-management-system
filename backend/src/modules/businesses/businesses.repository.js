const { prisma } = require('../../config/database')

function findById(businessId) {
  return prisma.business.findUnique({
    where: { id: businessId },
    include: { subscription: true, settings: true, _count: { select: { branches: true, users: true, products: true } } }
  })
}

function update(businessId, data) {
  return prisma.business.update({ where: { id: businessId }, data })
}

function getSettings(businessId) {
  return prisma.businessSetting.findUnique({ where: { businessId } })
}

function createSettings(businessId) {
  return prisma.businessSetting.create({ data: { businessId } })
}

function upsertSettings(businessId, data) {
  return prisma.businessSetting.upsert({
    where: { businessId },
    create: { businessId, ...data },
    update: data
  })
}

// Dashboard aggregations
function countSales(businessId, dateFilter) {
  return prisma.saleOrder.aggregate({
    where: { businessId, status: { not: 'voided' }, createdAt: dateFilter },
    _sum: { total: true }
  })
}

function countSaleOrders(businessId, dateFilter) {
  return prisma.saleOrder.count({
    where: { businessId, status: { not: 'voided' }, createdAt: dateFilter }
  })
}

function sumExpenses(businessId, dateFilter) {
  return prisma.expense.aggregate({
    where: { businessId, createdAt: dateFilter },
    _sum: { amount: true }
  })
}

function countNewCustomers(businessId, dateFilter) {
  return prisma.customer.count({
    where: { businessId, createdAt: dateFilter }
  })
}

function getOutstandingInvoices(businessId) {
  return prisma.invoice.aggregate({
    where: { businessId, status: { in: ['sent', 'partial', 'overdue'] } },
    _sum: { balance: true },
    _count: true
  })
}

function countLowStock(businessId) {
  return prisma.inventoryStock.count({
    where: { product: { businessId }, quantity: { lte: 5 } }
  })
}

function countActiveCustomers(businessId) {
  return prisma.customer.count({ where: { businessId, isActive: true } })
}

function countActiveProducts(businessId) {
  return prisma.product.count({ where: { businessId, isActive: true } })
}

module.exports = {
  findById, update, getSettings, createSettings, upsertSettings,
  countSales, countSaleOrders, sumExpenses, countNewCustomers,
  getOutstandingInvoices, countLowStock, countActiveCustomers, countActiveProducts
}
