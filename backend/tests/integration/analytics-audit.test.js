const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')

describe('Analytics API', () => {
  let token, business

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  it('GET /api/analytics/kpi returns KPI summary', async () => {
    const res = await request(app).get('/api/analytics/kpi').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('revenue')
    expect(res.body.data).toHaveProperty('newCustomers')
    expect(res.body.data).toHaveProperty('ordersCount')
    expect(res.body.data).toHaveProperty('averageOrderValue')
  })

  it('GET /api/analytics/revenue-trend returns monthly trend', async () => {
    const res = await request(app).get('/api/analytics/revenue-trend?months=3').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(3)
    res.body.data.forEach((point) => {
      expect(point).toHaveProperty('name')
      expect(point).toHaveProperty('revenue')
      expect(point).toHaveProperty('expenses')
      expect(point).toHaveProperty('profit')
    })
  })

  it('GET /api/analytics/sales-trend supports groupBy=day', async () => {
    const res = await request(app).get('/api/analytics/sales-trend?groupBy=day&days=7').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/analytics/top-products returns ranked products', async () => {
    const res = await request(app).get('/api/analytics/top-products?limit=5').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/analytics/top-customers returns ranked customers', async () => {
    const res = await request(app).get('/api/analytics/top-customers?limit=5').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/analytics/customer-growth returns monthly growth', async () => {
    const res = await request(app).get('/api/analytics/customer-growth?months=6').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(6)
  })

  it('GET /api/analytics/cash-flow returns cash flow breakdown', async () => {
    const res = await request(app).get('/api/analytics/cash-flow?months=3').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    res.body.data.forEach((m) => {
      expect(m).toHaveProperty('inflow')
      expect(m).toHaveProperty('outflow')
      expect(m).toHaveProperty('net')
    })
  })

  it('GET /api/analytics/inventory returns inventory analytics', async () => {
    const res = await request(app).get('/api/analytics/inventory').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('totalProducts')
    expect(res.body.data).toHaveProperty('lowStock')
    expect(res.body.data).toHaveProperty('totalValue')
  })
})

describe('Audit API', () => {
  let token, business

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business

    // Generate some audit trail by creating a customer
    await request(app).post('/api/customers').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Audit Test Customer', type: 'individual' })
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  it('GET /api/audit returns paginated audit logs', async () => {
    const res = await request(app).get('/api/audit').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data.data).toBeInstanceOf(Array)
    expect(res.body.data).toHaveProperty('total')
  })

  it('GET /api/audit/summary returns action summary', async () => {
    const res = await request(app).get('/api/audit/summary').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('totalActions')
    expect(res.body.data).toHaveProperty('topActions')
    expect(res.body.data).toHaveProperty('recentActivity')
  })

  it('GET /api/audit/entities returns distinct entity types', async () => {
    const res = await request(app).get('/api/audit/entities').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/audit filters by action', async () => {
    const res = await request(app).get('/api/audit?action=customer').set(auth())
    expect(res.status).toBe(200)
    res.body.data.data.forEach((log) => {
      expect(log.action).toContain('customer')
    })
  })

  it('GET /api/audit enforces tenant isolation', async () => {
    const res = await request(app).get('/api/audit').set(auth())
    res.body.data.data.forEach((log) => {
      expect(log.businessId).toBe(business.id)
    })
  })
})
