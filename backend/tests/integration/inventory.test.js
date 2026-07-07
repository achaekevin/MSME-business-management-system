const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')

describe('Inventory API', () => {
  let token, business, branch, product, warehouse

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
    branch = auth.branch

    warehouse = await prisma.warehouse.create({
      data: { businessId: business.id, name: 'Inventory Test Warehouse', isActive: true }
    })

    const unit = await prisma.unit.create({ data: { businessId: business.id, name: 'Box', abbreviation: 'bx' } })
    product = await prisma.product.create({
      data: {
        businessId: business.id, name: 'Inventory Test Product',
        sku: `INV-TST-${Date.now()}`,
        sellingPrice: 1000, costPrice: 700,
        trackInventory: true, reorderPoint: 5, unitId: unit.id
      }
    })
  })

  afterAll(async () => {
    await cleanupBusiness(business?.id)
  })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('GET /api/inventory/dashboard', () => {
    it('returns inventory dashboard stats', async () => {
      const res = await request(app).get('/api/inventory/dashboard').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('totalProducts')
      expect(res.body.data).toHaveProperty('recentTransactions')
    })
  })

  describe('POST /api/inventory/adjustments', () => {
    it('creates stock via "in" adjustment', async () => {
      const res = await request(app)
        .post('/api/inventory/adjustments')
        .set(auth())
        .send({ productId: product.id, warehouseId: warehouse.id, quantity: 100, type: 'in', reason: 'Initial stock' })

      expect(res.status).toBe(200)
      expect(res.body.data.stock.quantity).toBeGreaterThanOrEqual(100)
    })

    it('deducts stock via "out" adjustment', async () => {
      const res = await request(app)
        .post('/api/inventory/adjustments')
        .set(auth())
        .send({ productId: product.id, warehouseId: warehouse.id, quantity: 20, type: 'out', reason: 'Damaged goods' })

      expect(res.status).toBe(200)
    })

    it('rejects "out" when insufficient stock', async () => {
      const res = await request(app)
        .post('/api/inventory/adjustments')
        .set(auth())
        .send({ productId: product.id, warehouseId: warehouse.id, quantity: 99999, type: 'out', reason: 'Test' })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/insufficient/i)
    })

    it('sets stock to exact value via "set" adjustment', async () => {
      const res = await request(app)
        .post('/api/inventory/adjustments')
        .set(auth())
        .send({ productId: product.id, warehouseId: warehouse.id, quantity: 50, type: 'set', reason: 'Stocktake correction' })

      expect(res.status).toBe(200)
      expect(Number(res.body.data.stock.quantity)).toBe(50)
    })
  })

  describe('POST /api/inventory/transfers', () => {
    it('transfers stock between two warehouses', async () => {
      const warehouse2 = await prisma.warehouse.create({
        data: { businessId: business.id, name: 'Transfer Destination', isActive: true }
      })

      // Ensure source has stock
      await request(app).post('/api/inventory/adjustments').set(auth())
        .send({ productId: product.id, warehouseId: warehouse.id, quantity: 30, type: 'set', reason: 'Setup' })

      const res = await request(app)
        .post('/api/inventory/transfers')
        .set(auth())
        .send({
          fromWarehouseId: warehouse.id,
          toWarehouseId: warehouse2.id,
          items: [{ productId: product.id, quantity: 10 }],
          notes: 'Test transfer'
        })

      expect(res.status).toBe(201)
      expect(res.body.data.status).toBe('completed')
    })

    it('rejects transfer to the same warehouse', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set(auth())
        .send({
          fromWarehouseId: warehouse.id,
          toWarehouseId: warehouse.id,
          items: [{ productId: product.id, quantity: 5 }]
        })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/inventory/stock', () => {
    it('lists all stock levels with low-stock flags', async () => {
      const res = await request(app).get('/api/inventory/stock').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.data).toBeInstanceOf(Array)
      res.body.data.data.forEach((s) => {
        expect(s).toHaveProperty('isLow')
      })
    })
  })

  describe('GET /api/inventory/transactions', () => {
    it('lists inventory transaction history', async () => {
      const res = await request(app).get('/api/inventory/transactions').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.data).toBeInstanceOf(Array)
    })
  })
})
