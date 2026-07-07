const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')

describe('Sales API', () => {
  let token, business, branch, product, warehouse

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
    branch = auth.branch

    // Create a warehouse
    warehouse = await prisma.warehouse.create({
      data: { businessId: business.id, name: 'Test Warehouse', isActive: true }
    })

    // Create a unit and category
    const unit = await prisma.unit.create({ data: { businessId: business.id, name: 'Piece', abbreviation: 'pc' } })
    const category = await prisma.category.create({ data: { businessId: business.id, name: 'Electronics' } })

    // Create a product with stock
    product = await prisma.product.create({
      data: {
        businessId: business.id, name: 'Test Laptop', sku: `TST-${Date.now()}`,
        sellingPrice: 50000, costPrice: 35000, trackInventory: true, reorderPoint: 5,
        categoryId: category.id, unitId: unit.id
      }
    })

    // Give it stock
    await prisma.inventoryStock.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 20 }
    })
  })

  afterAll(async () => {
    await cleanupBusiness(business?.id)
  })

  const authHeader = () => ({ Authorization: `Bearer ${token}` })

  describe('POST /api/sales', () => {
    it('creates a sale, deducts inventory, returns correct totals', async () => {
      const stockBefore = await prisma.inventoryStock.findFirst({ where: { productId: product.id } })

      const res = await request(app)
        .post('/api/sales')
        .set(authHeader())
        .send({
          branchId: branch.id,
          items: [{ productId: product.id, quantity: 2, unitPrice: 50000, discount: 0, tax: 0 }],
          amountPaid: 100000
        })

      expect(res.status).toBe(201)
      expect(res.body.data.status).toBe('paid')
      expect(Number(res.body.data.total)).toBe(100000)
      expect(Number(res.body.data.balance)).toBe(0)

      // Verify inventory was deducted
      const stockAfter = await prisma.inventoryStock.findFirst({ where: { productId: product.id } })
      expect(Number(stockAfter.quantity)).toBe(Number(stockBefore.quantity) - 2)

      // Verify inventory transaction was recorded
      const txn = await prisma.inventoryTransaction.findFirst({
        where: { productId: product.id, type: 'out', referenceId: res.body.data.id }
      })
      expect(txn).not.toBeNull()
      expect(Number(txn.quantity)).toBe(2)
    })

    it('creates a partial sale when amountPaid < total', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set(authHeader())
        .send({
          branchId: branch.id,
          items: [{ productId: product.id, quantity: 1, unitPrice: 50000, discount: 0, tax: 0 }],
          amountPaid: 25000
        })

      expect(res.status).toBe(201)
      expect(res.body.data.status).toBe('partial')
      expect(Number(res.body.data.balance)).toBe(25000)
    })

    it('rejects a sale with insufficient stock', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set(authHeader())
        .send({
          branchId: branch.id,
          items: [{ productId: product.id, quantity: 9999, unitPrice: 50000, discount: 0, tax: 0 }],
          amountPaid: 0
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/insufficient stock/i)
    })

    it('rejects a sale with empty items array', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set(authHeader())
        .send({ branchId: branch.id, items: [] })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/sales/:id/void', () => {
    it('voids a sale and restores inventory', async () => {
      const createRes = await request(app)
        .post('/api/sales')
        .set(authHeader())
        .send({
          branchId: branch.id,
          items: [{ productId: product.id, quantity: 1, unitPrice: 50000, discount: 0, tax: 0 }],
          amountPaid: 50000
        })

      const saleId = createRes.body.data.id
      const stockBeforeVoid = await prisma.inventoryStock.findFirst({ where: { productId: product.id } })

      const voidRes = await request(app)
        .post(`/api/sales/${saleId}/void`)
        .set(authHeader())
        .send({ reason: 'Customer returned item — test void' })

      expect(voidRes.status).toBe(200)
      expect(voidRes.body.data.status).toBe('voided')

      const stockAfterVoid = await prisma.inventoryStock.findFirst({ where: { productId: product.id } })
      expect(Number(stockAfterVoid.quantity)).toBe(Number(stockBeforeVoid.quantity) + 1)
    })

    it('cannot void an already voided sale', async () => {
      const createRes = await request(app)
        .post('/api/sales')
        .set(authHeader())
        .send({
          branchId: branch.id,
          items: [{ productId: product.id, quantity: 1, unitPrice: 50000, discount: 0, tax: 0 }],
          amountPaid: 0
        })

      const saleId = createRes.body.data.id
      await request(app).post(`/api/sales/${saleId}/void`).set(authHeader()).send({ reason: 'First void' })
      const res = await request(app).post(`/api/sales/${saleId}/void`).set(authHeader()).send({ reason: 'Second void' })

      expect(res.status).toBe(409)
    })
  })
})
