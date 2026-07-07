const { prisma } = require('../../config/database')
const { buildSearchClause } = require('../../helpers/pagination')

function findMany(businessId, { skip, take, orderBy, search, categoryId }) {
  const where = {
    businessId,
    ...(categoryId ? { categoryId } : {}),
    ...(search ? buildSearchClause(search, ['name', 'sku', 'barcode']) : {})
  }

  return Promise.all([
    prisma.product.findMany({
      where, skip, take, orderBy,
      include: { category: true, unit: true, inventoryStocks: true }
    }),
    prisma.product.count({ where })
  ])
}

function findById(businessId, id) {
  return prisma.product.findFirst({
    where: { id, businessId },
    include: { category: true, unit: true, variants: true, inventoryStocks: { include: { warehouse: true } } }
  })
}

function findBySkuOrBarcode(businessId, code) {
  return prisma.product.findFirst({ where: { businessId, OR: [{ sku: code }, { barcode: code }] } })
}

function create(businessId, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.product.create({ data: { ...rest, businessId } })
}

function update(businessId, id, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.product.updateMany({ where: { id, businessId }, data: rest })
}

function remove(businessId, id) {
  return prisma.product.deleteMany({ where: { id, businessId } })
}

function getCategories(businessId) {
  return prisma.category.findMany({ where: { businessId }, orderBy: { name: 'asc' } })
}

function createCategory(businessId, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.category.create({ data: { ...rest, businessId } })
}

function getUnits(businessId) {
  return prisma.unit.findMany({ where: { businessId }, orderBy: { name: 'asc' } })
}

function createUnit(businessId, data) {
  const { businessId: _ignored, ...rest } = data
  return prisma.unit.create({ data: { ...rest, businessId } })
}

function createVariant(productId, data) {
  return prisma.productVariant.create({ data: { ...data, productId } })
}

function totalStock(product) {
  return (product.inventoryStocks || []).reduce((sum, s) => sum + Number(s.quantity), 0)
}

module.exports = {
  findMany, findById, findBySkuOrBarcode, create, update, remove,
  getCategories, createCategory, getUnits, createUnit, createVariant, totalStock
}
