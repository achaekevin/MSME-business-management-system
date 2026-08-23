const QRCode = require('qrcode')
const repo = require('./products.repository')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { invalidateTenantCache, cacheGet, cacheSet, cacheKey } = require('../../config/redis')
const { uploadBuffer } = require('../../storage/storage.service')

const { prisma } = require('../../config/database')

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
  const cached = await cacheGet(key).catch(() => null)
  if (cached) return cached

  const product = await repo.findById(businessId, id)
  if (!product) throw ApiError.notFound('Product not found')

  const result = { ...product, currentStock: repo.totalStock(product) }
  await cacheSet(key, result, 120).catch(() => {})
  return result
}

async function findByCode(businessId, code) {
  const product = await repo.findBySkuOrBarcode(businessId, code)
  if (!product) throw ApiError.notFound('No product found with this SKU/barcode')
  return product
}

async function createProduct(businessId, data, req) {
  // Check if SKU already exists in this business
  if (data.sku) {
    const existingSku = await prisma.product.findFirst({
      where: { businessId, sku: data.sku }
    })
    if (existingSku) throw ApiError.conflict('A product with this SKU already exists')
  }

  // Check if Barcode already exists in this business (if provided)
  if (data.barcode && data.barcode.trim()) {
    const existingBarcode = await prisma.product.findFirst({
      where: { businessId, barcode: data.barcode.trim() }
    })
    if (existingBarcode) throw ApiError.conflict('A product with this barcode already exists')
  }

  const product = await repo.create(businessId, data)

  // Generate a QR code encoding the product ID for quick scanning in POS/inventory
  // Gracefully fallback to base64 DataURL if storage upload is unavailable
  try {
    let qrUrl = null
    try {
      const qrBuffer = await QRCode.toBuffer(JSON.stringify({ productId: product.id, sku: product.sku }), { width: 300 })
      qrUrl = await uploadBuffer(`products/${businessId}/${product.id}-qr.png`, qrBuffer, 'image/png')
    } catch (storageErr) {
      // MinIO / storage service offline or error - use base64 data URL
      qrUrl = await QRCode.toDataURL(JSON.stringify({ productId: product.id, sku: product.sku }), { width: 300 })
    }

    if (qrUrl) {
      await repo.update(businessId, product.id, { qrCode: qrUrl })
    }
  } catch (qrErr) {
    // If QR code generation fails entirely, do not fail product creation
  }

  await invalidateTenantCache(businessId, 'product').catch(() => {})
  req?.audit?.('product.created', 'Product', product.id, { name: product.name, sku: product.sku })

  return repo.findById(businessId, product.id)
}

async function updateProduct(businessId, id, data, req) {
  const existing = await repo.findById(businessId, id)
  if (!existing) throw ApiError.notFound('Product not found')

  if (data.sku && data.sku !== existing.sku) {
    const skuExists = await prisma.product.findFirst({
      where: { businessId, sku: data.sku, NOT: { id } }
    })
    if (skuExists) throw ApiError.conflict('A product with this SKU already exists')
  }

  if (data.barcode && data.barcode.trim() && data.barcode.trim() !== existing.barcode) {
    const barcodeExists = await prisma.product.findFirst({
      where: { businessId, barcode: data.barcode.trim(), NOT: { id } }
    })
    if (barcodeExists) throw ApiError.conflict('A product with this barcode already exists')
  }

  await repo.update(businessId, id, data)
  await invalidateTenantCache(businessId, 'product').catch(() => {})
  req?.audit?.('product.updated', 'Product', id, { changes: data })

  return repo.findById(businessId, id)
}

async function deleteProduct(businessId, id, req) {
  const existing = await repo.findById(businessId, id)
  if (!existing) throw ApiError.notFound('Product not found')

  const { prisma } = require('../../config/database')
  
  // Check if product has sales or invoice history
  const [salesCount, invoiceCount, purchaseCount] = await Promise.all([
    prisma.saleOrderItem.count({ where: { productId: id } }).catch(() => 0),
    prisma.invoiceItem.count({ where: { productId: id } }).catch(() => 0),
    prisma.purchaseOrderItem.count({ where: { productId: id } }).catch(() => 0)
  ])

  if (salesCount > 0 || invoiceCount > 0 || purchaseCount > 0) {
    // If linked to financial/order history, soft-deactivate so past records remain intact
    await prisma.product.updateMany({
      where: { id, businessId },
      data: { isActive: false }
    })
  } else {
    // Clean up dependent inventory stocks, variants, transactions, etc., then delete
    await prisma.$transaction([
      prisma.inventoryStock.deleteMany({ where: { productId: id } }),
      prisma.inventoryTransaction.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.stockTransferItem.deleteMany({ where: { productId: id } }),
      prisma.quotationItem.deleteMany({ where: { productId: id } }),
      prisma.product.deleteMany({ where: { id, businessId } })
    ])
  }

  await invalidateTenantCache(businessId, 'product').catch(() => {})
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
