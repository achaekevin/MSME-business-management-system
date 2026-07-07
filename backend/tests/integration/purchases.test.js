const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')

describe('Purchases API', () => {
  let token, business, branch, supplier, product, warehouse

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
    branch = auth.branch

    supplier = await prisma.supplier.create({
      data: { businessId: business.id, name: 'Test Supplier Co', paymentTerms: 30 }
    })
    warehouse = await prisma.warehouse.create({
      data: { businessId: business.id, name: 'PO Test Warehouse', isActive: true }
    })
    const unit = await prisma.unit.create({ data: { businessId: business.id, name: 'Unit', abbreviation: 'u' } })
    product = await prisma.product.create({
      data: {
        businessId: business.id, name: 'PO Test Item',
        sku: `PO-SKU-${Date.now()}`, sellingPrice: 500, costPrice: 300,
        trackInventory: true, reorderPoint: 5, unitId: unit.id
      }
    })
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  it('POST /api/purchases creates a purchase order', async () => {
    const res = await request(app).post('/api/purchases').set(auth()).send({
      supplierId: supplier.id, branchId: branch.id,
      items: [{ productId: product.id, quantity: 50, unitPrice: 300 }]
    })
    expect(res.status).toBe(201)
    expect(res.body.data.orderNumber).toMatch(/^PO-/)
    expect(Number(res.body.data.total)).toBe(15000)
  })

  it('POST /api/purchases/:id/receive credits inventory', async () => {
    const poRes = await request(app).post('/api/purchases').set(auth()).send({
      supplierId: supplier.id, branchId: branch.id,
      items: [{ productId: product.id, quantity: 20, unitPrice: 300 }]
    })
    const poId = poRes.body.data.id

    const stockBefore = await prisma.inventoryStock.findFirst({ where: { productId: product.id } })
    const before = stockBefore ? Number(stockBefore.quantity) : 0

    const res = await request(app).post(`/api/purchases/${poId}/receive`).set(auth()).send({ notes: 'All good' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('received')

    const stockAfter = await prisma.inventoryStock.findFirst({ where: { productId: product.id } })
    expect(Number(stockAfter.quantity)).toBe(before + 20)
  })

  it('Cannot receive an already-received PO', async () => {
    const poRes = await request(app).post('/api/purchases').set(auth()).send({
      supplierId: supplier.id, branchId: branch.id,
      items: [{ productId: product.id, quantity: 5, unitPrice: 300 }]
    })
    const poId = poRes.body.data.id
    await request(app).post(`/api/purchases/${poId}/receive`).set(auth()).send({})
    const res = await request(app).post(`/api/purchases/${poId}/receive`).set(auth()).send({})
    expect(res.status).toBe(409)
  })
})
