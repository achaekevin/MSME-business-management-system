const QRCode = require('qrcode')
const repo = require('./products.repository')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { invalidateTenantCache, cacheGet, cacheSet, cacheKey } = require('../../config/redis')
const { uploadBuffer } = require('../../storage/storage.service')

async function listProducts(businessId, query) {
  const { page, limit, skip, take, orderBy } = parsePagination(query)
  const [rawItems, total] = await repo.findMany(businessId, {
    skip, take, orderBy, search: query.search, categoryId: query.categoryId
  })

  let items = rawItems.map((p) => ({ ...p, currentStock: repo.totalStock(p) }))
  if (query.lowStock) items = items.filter((p) => p.currentStock <= p.reorderPoint)

  return { items, total, page, limit }
}

async function getProduct(businessId, id) {
  const key = cacheKey(businessId, 'product', id)
  const cached = await cacheGet(key)
  if (cached) return cached

  const product = await repo.findById(businessId, id)
  if (!product) throw ApiError.notFound('Product not found')

  const result = { ...product, currentStock: repo.totalStock(product) }
  await cacheSet(key, result, 120)
  return result
}

async function findByCode(businessId, code) {
  const product = await repo.findBySkuOrBarcode(businessId, code)
  if (!product) throw ApiError.notFound('No product found with this SKU/barcode')
  return product
}

async function createProduct(businessId, data, req) {
  const existing = await repo.findBySkuOrBarcode(businessId, data.sku)
  if (existing) throw ApiError.conflict('A product with this SKU already exists')

  const product = await repo.create(businessId, data)

  // Generate a QR code encoding the product ID for quick scanning in POS/inventory
  const qrBuffer = await QRCode.toBuffer(JSON.stringify({ productId: product.id, sku: product.sku }), { width: 300 })
  const qrUrl = await uploadBuffer(`products/${businessId}/${product.id}-qr.png`, qrBuffer, 'image/png')
  await repo.update(businessId, product.id, { qrCode: qrUrl })

  await invalidateTenantCache(businessId, 'product')
  req?.audit?.('product.created', 'Product', product.id, { name: product.name, sku: product.sku })

  return repo.findById(businessId, product.id)
}

async function updateProduct(businessId, id, data, req) {
  const existing = await repo.findById(businessId, id)
  if (!existing) throw ApiError.notFound('Product not found')

  await repo.update(businessId, id, data)
  await invalidateTenantCache(businessId, 'product')
  req?.audit?.('product.updated', 'Product', id, { changes: data })

  return repo.findById(businessId, id)
}

async function deleteProduct(businessId, id, req) {
  const existing = await repo.findById(businessId, id)
  if (!existing) throw ApiError.notFound('Product not found')

  await repo.remove(businessId, id)
  await invalidateTenantCache(businessId, 'product')
  req?.audit?.('product.deleted', 'Product', id)
  return { deleted: true }
}

async function listCategories(businessId) {
  return repo.getCategories(businessId)
}

async function createCategory(businessId, data) {
  return repo.createCategory(businessId, data)
}

async function listUnits(businessId) {
  return repo.getUnits(businessId)
}

async function createUnit(businessId, data) {
  return repo.createUnit(businessId, data)
}

async function addVariant(businessId, productId, data) {
  const product = await repo.findById(businessId, productId)
  if (!product) throw ApiError.notFound('Product not found')
  return repo.createVariant(productId, data)
}

module.exports = {
  listProducts, getProduct, findByCode, createProduct, updateProduct, deleteProduct,
  listCategories, createCategory, listUnits, createUnit, addVariant
}
