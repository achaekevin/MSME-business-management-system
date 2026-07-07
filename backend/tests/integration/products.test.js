const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')

describe('Products API', () => {
  let token, business, category, unit

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business

    category = await prisma.category.create({ data: { businessId: business.id, name: 'Test Category' } })
    unit = await prisma.unit.create({ data: { businessId: business.id, name: 'Kilogram', abbreviation: 'kg' } })
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('POST /api/products', () => {
    it('creates a product with QR code generation', async () => {
      const res = await request(app).post('/api/products').set(auth()).send({
        name: 'Premium Coffee Beans',
        sku: `COFFEE-${Date.now()}`,
        categoryId: category.id,
        unitId: unit.id,
        costPrice: 1200,
        sellingPrice: 1800,
        trackInventory: true,
        reorderPoint: 20
      })
      expect(res.status).toBe(201)
      expect(res.body.data.name).toBe('Premium Coffee Beans')
      expect(res.body.data.businessId).toBe(business.id)
      // QR code may or may not be generated depending on MinIO availability
    })

    it('rejects duplicate SKU within same business', async () => {
      const sku = `DUP-SKU-${Date.now()}`
      await request(app).post('/api/products').set(auth()).send({ name: 'First', sku, categoryId: category.id, unitId: unit.id, costPrice: 100, sellingPrice: 150, trackInventory: true })
      const res = await request(app).post('/api/products').set(auth()).send({ name: 'Second', sku, categoryId: category.id, unitId: unit.id, costPrice: 100, sellingPrice: 150, trackInventory: true })
      expect(res.status).toBe(409)
    })

    it('rejects negative selling price', async () => {
      const res = await request(app).post('/api/products').set(auth()).send({
        name: 'Bad Price', sku: `NEG-${Date.now()}`,
        costPrice: -100, sellingPrice: -50, trackInventory: true
      })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/products', () => {
    it('returns paginated product list', async () => {
      const res = await request(app).get('/api/products').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.data).toBeInstanceOf(Array)
      expect(res.body.data).toHaveProperty('total')
    })

    it('filters by category', async () => {
      const res = await request(app).get(`/api/products?categoryId=${category.id}`).set(auth())
      expect(res.status).toBe(200)
      res.body.data.data.forEach((p) => expect(p.categoryId).toBe(category.id))
    })

    it('searches by name/sku', async () => {
      const sku = `SEARCH-${Date.now()}`
      await request(app).post('/api/products').set(auth()).send({ name: 'Searchable Product', sku, categoryId: category.id, unitId: unit.id, costPrice: 100, sellingPrice: 150, trackInventory: false })
      const res = await request(app).get(`/api/products?search=${sku}`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.data.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/products/lookup/:code', () => {
    it('looks up a product by SKU', async () => {
      const sku = `LOOKUP-${Date.now()}`
      await request(app).post('/api/products').set(auth()).send({ name: 'Lookup Test', sku, categoryId: category.id, unitId: unit.id, costPrice: 100, sellingPrice: 150, trackInventory: false })
      const res = await request(app).get(`/api/products/lookup/${sku}`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.sku).toBe(sku)
    })

    it('returns 404 for unknown code', async () => {
      const res = await request(app).get('/api/products/lookup/NONEXISTENT-CODE-XYZ').set(auth())
      expect(res.status).toBe(404)
    })
  })

  describe('Product Categories', () => {
    it('lists categories', async () => {
      const res = await request(app).get('/api/products/categories').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toBeInstanceOf(Array)
    })

    it('creates a category', async () => {
      const res = await request(app).post('/api/products/categories').set(auth()).send({ name: 'New Category' })
      expect(res.status).toBe(201)
      expect(res.body.data.businessId).toBe(business.id)
    })
  })

  describe('Product CRUD', () => {
    let productId

    beforeAll(async () => {
      const res = await request(app).post('/api/products').set(auth()).send({
        name: 'CRUD Test Product', sku: `CRUD-${Date.now()}`,
        categoryId: category.id, unitId: unit.id,
        costPrice: 500, sellingPrice: 750, trackInventory: true, reorderPoint: 5
      })
      productId = res.body.data.id
    })

    it('gets a single product', async () => {
      const res = await request(app).get(`/api/products/${productId}`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(productId)
      expect(res.body.data).toHaveProperty('currentStock')
    })

    it('updates product price', async () => {
      const res = await request(app).put(`/api/products/${productId}`).set(auth()).send({ sellingPrice: 900 })
      expect(res.status).toBe(200)
      expect(Number(res.body.data.sellingPrice)).toBe(900)
    })

    it('deletes a product', async () => {
      const res = await request(app).delete(`/api/products/${productId}`).set(auth())
      expect(res.status).toBe(204)
    })
  })
})
