const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')

describe('Suppliers API', () => {
  let token, business

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('POST /api/suppliers', () => {
    it('creates a supplier', async () => {
      const res = await request(app).post('/api/suppliers').set(auth()).send({
        name: 'Test Supplier Ltd', email: `supplier-${Date.now()}@test.com`,
        phone: '+254712345678', paymentTerms: 30
      })
      expect(res.status).toBe(201)
      expect(res.body.data.name).toBe('Test Supplier Ltd')
      expect(res.body.data.businessId).toBe(business.id)
    })

    it('rejects short supplier name', async () => {
      const res = await request(app).post('/api/suppliers').set(auth()).send({ name: 'X', paymentTerms: 0 })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/suppliers', () => {
    it('returns paginated list', async () => {
      const res = await request(app).get('/api/suppliers').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.data).toBeInstanceOf(Array)
    })
  })

  describe('Supplier CRUD', () => {
    let supplierId

    beforeAll(async () => {
      const res = await request(app).post('/api/suppliers').set(auth()).send({
        name: `CRUD Supplier ${Date.now()}`, paymentTerms: 15
      })
      supplierId = res.body.data.id
    })

    it('gets a single supplier', async () => {
      const res = await request(app).get(`/api/suppliers/${supplierId}`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(supplierId)
    })

    it('updates supplier payment terms', async () => {
      const res = await request(app).put(`/api/suppliers/${supplierId}`).set(auth()).send({ paymentTerms: 45 })
      expect(res.status).toBe(200)
      expect(res.body.data.paymentTerms).toBe(45)
    })

    it('gets supplier statement', async () => {
      const res = await request(app).get(`/api/suppliers/${supplierId}/statement`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('supplier')
      expect(res.body.data).toHaveProperty('entries')
    })

    it('deletes a supplier with zero balance', async () => {
      const res = await request(app).delete(`/api/suppliers/${supplierId}`).set(auth())
      expect(res.status).toBe(204)
    })
  })
})
