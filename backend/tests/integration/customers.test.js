const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')

describe('Customers API', () => {
  let token, business, branch

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
    branch = auth.branch
  })

  afterAll(async () => {
    await cleanupBusiness(business?.id)
  })

  const authHeader = () => ({ Authorization: `Bearer ${token}` })

  // ── Create ──────────────────────────────────────────────────────────────

  describe('POST /api/customers', () => {
    it('creates a customer with valid data', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set(authHeader())
        .send({ name: 'Acme Corp', email: 'acme@test.com', type: 'business', phone: '+254712345678' })

      expect(res.status).toBe(201)
      expect(res.body.data.name).toBe('Acme Corp')
      expect(res.body.data.businessId).toBe(business.id)
      expect(res.body.data).not.toHaveProperty('__meta')
    })

    it('rejects a customer with a name shorter than 2 chars', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set(authHeader())
        .send({ name: 'A', email: 'short@test.com', type: 'individual' })

      expect(res.status).toBe(400)
      expect(res.body.errors).toHaveProperty('name')
    })

    it('rejects an invalid email address', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set(authHeader())
        .send({ name: 'Valid Name', email: 'not-an-email', type: 'individual' })

      expect(res.status).toBe(400)
    })

    it('returns 401 without auth token', async () => {
      const res = await request(app).post('/api/customers').send({ name: 'No Auth', type: 'individual' })
      expect(res.status).toBe(401)
    })
  })

  // ── List ────────────────────────────────────────────────────────────────

  describe('GET /api/customers', () => {
    it('returns a paginated list', async () => {
      const res = await request(app).get('/api/customers').set(authHeader())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('total')
      expect(res.body.data).toHaveProperty('page')
      expect(Array.isArray(res.body.data.data)).toBe(true)
    })

    it('supports search param', async () => {
      // Create a searchable customer first
      await request(app).post('/api/customers').set(authHeader()).send({ name: 'SearchableCustomer XYZ', type: 'individual' })
      const res = await request(app).get('/api/customers?search=SearchableCustomer').set(authHeader())
      expect(res.status).toBe(200)
    })

    it('enforces tenant isolation — only returns this business customers', async () => {
      const res = await request(app).get('/api/customers').set(authHeader())
      const ids = res.body.data.data.map((c) => c.businessId)
      ids.forEach((id) => expect(id).toBe(business.id))
    })
  })

  // ── Get / Update / Delete ────────────────────────────────────────────────

  describe('GET/PUT/DELETE /api/customers/:id', () => {
    let customerId

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/customers')
        .set(authHeader())
        .send({ name: 'CRUD Test Customer', email: `crud-${Date.now()}@test.com`, type: 'individual' })
      customerId = res.body.data.id
    })

    it('gets a single customer', async () => {
      const res = await request(app).get(`/api/customers/${customerId}`).set(authHeader())
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(customerId)
    })

    it('updates customer name and phone', async () => {
      const res = await request(app)
        .put(`/api/customers/${customerId}`)
        .set(authHeader())
        .send({ name: 'Updated Name', phone: '+254799999999' })
      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Updated Name')
    })

    it('returns 404 for a non-existent customer', async () => {
      const res = await request(app)
        .get('/api/customers/00000000-0000-0000-0000-000000000000')
        .set(authHeader())
      expect(res.status).toBe(404)
    })

    it('deletes a customer with zero balance', async () => {
      const res = await request(app).delete(`/api/customers/${customerId}`).set(authHeader())
      expect(res.status).toBe(204)
    })

    it('returns 404 when deleting already-deleted customer', async () => {
      const res = await request(app).delete(`/api/customers/${customerId}`).set(authHeader())
      expect(res.status).toBe(404)
    })
  })
})
