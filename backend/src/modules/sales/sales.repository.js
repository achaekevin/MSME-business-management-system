const { prisma } = require('../../config/database')
const { buildSearchClause } = require('../../helpers/pagination')

function findMany(businessId, { skip, take, orderBy, search, status, customerId, branchId, startDate, endDate }) {
  const where = {
    businessId,
    ...(status ? { status } : {}),
    ...(customerId ? { customerId } : {}),
    ...(branchId ? { branchId } : {}),
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {}),
    ...(search ? buildSearchClause(search, ['orderNumber']) : {})
  }

  return Promise.all([
    prisma.saleOrder.findMany({
      where, skip, take, orderBy,
      include: {
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        createdBy: { select: { id: true, name: true } }
      }
    }),
    prisma.saleOrder.count({ where })
  ])
}

function findById(businessId, id) {
  return prisma.saleOrder.findFirst({
    where: { id, businessId },
    include: {
      customer: true,
      branch: true,
      items: { include: { product: true } },
      createdBy: { select: { id: true, name: true } },
      invoice: true,
      payments: true,
      returns: true
    }
  })
}

function findNextOrderNumber(businessId) {
  return prisma.saleOrder.count({ where: { businessId } }).then((count) => {
    const pad = String(count + 1).padStart(5, '0')
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `SL-${date}-${pad}`
  })
}

function create(data) {
  return prisma.saleOrder.create({
    data,
    include: {
      customer: true,
      items: { include: { product: true } }
    }
  })
}

function updateStatus(businessId, id, status) {
  return prisma.saleOrder.updateMany({ where: { id, businessId }, data: { status } })
}

function void_(businessId, id) {
  return prisma.saleOrder.updateMany({ where: { id, businessId }, data: { status: 'voided' } })
}

function createReturn(saleOrderId, data) {
  return prisma.saleReturn.create({ data: { ...data, saleOrderId } })
}

function getQuotations(businessId, { skip, take, orderBy }) {
  return Promise.all([
    prisma.quotation.findMany({ where: { businessId }, skip, take, orderBy, include: { customer: { select: { id: true, name: true } } } }),
    prisma.quotation.count({ where: { businessId } })
  ])
}

function findQuotationById(businessId, id) {
  return prisma.quotation.findFirst({ where: { id, businessId }, include: { customer: true, items: { include: { product: true } } } })
}

function createQuotation(businessId, data) {
  return prisma.quotation.create({ data: { ...data, businessId }, include: { customer: true, items: { include: { product: true } } } })
}

function updateQuotationStatus(businessId, id, status) {
  return prisma.quotation.updateMany({ where: { id, businessId }, data: { status } })
}

module.exports = {
  findMany, findById, findNextOrderNumber, create, updateStatus, void_, createReturn,
  getQuotations, findQuotationById, createQuotation, updateQuotationStatus
}
