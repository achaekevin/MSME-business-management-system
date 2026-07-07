const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')

describe('Settings API', () => {
  let token, business

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('API Keys', () => {
    let keyId

    it('creates an API key and returns the raw key once', async () => {
      const res = await request(app).post('/api/settings/api-keys').set(auth()).send({
        name: 'Test Integration Key',
        scopes: ['customers.view', 'products.view']
      })
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('key')
      expect(res.body.data.key).toMatch(/^msme_live_/)
      expect(res.body.data).toHaveProperty('warning')
      keyId = res.body.data.id
    })

    it('lists API keys without exposing the raw key', async () => {
      const res = await request(app).get('/api/settings/api-keys').set(auth())
      expect(res.status).toBe(200)
      res.body.data.forEach((k) => {
        expect(k).not.toHaveProperty('keyHash')
        expect(k).not.toHaveProperty('key')
        expect(k).toHaveProperty('keyPrefix')
      })
    })

    it('revokes an API key', async () => {
      const res = await request(app).delete(`/api/settings/api-keys/${keyId}`).set(auth())
      expect(res.status).toBe(204)
    })
  })

  describe('Webhooks', () => {
    let webhookId

    it('creates a webhook with a one-time secret', async () => {
      const res = await request(app).post('/api/settings/webhooks').set(auth()).send({
        url: 'https://example.com/webhook',
        events: ['sale.created', 'invoice.paid']
      })
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('secret')
      expect(res.body.data.secret).toMatch(/^whsec_/)
      webhookId = res.body.data.id
    })

    it('lists webhooks without exposing secrets', async () => {
      const res = await request(app).get('/api/settings/webhooks').set(auth())
      expect(res.status).toBe(200)
      res.body.data.forEach((w) => expect(w).not.toHaveProperty('secret'))
    })

    it('updates webhook events', async () => {
      const res = await request(app).put(`/api/settings/webhooks/${webhookId}`).set(auth()).send({
        url: 'https://example.com/webhook',
        events: ['sale.created']
      })
      expect(res.status).toBe(200)
    })

    it('deletes a webhook', async () => {
      const res = await request(app).delete(`/api/settings/webhooks/${webhookId}`).set(auth())
      expect(res.status).toBe(204)
    })
  })

  describe('Notification Settings', () => {
    it('gets notification settings with defaults', async () => {
      const res = await request(app).get('/api/settings/notifications').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('email')
      expect(res.body.data).toHaveProperty('inApp')
    })

    it('updates notification preferences', async () => {
      const res = await request(app).put('/api/settings/notifications').set(auth()).send({
        email: { lowStock: false, newSale: true, invoicePaid: true, newCustomer: true },
        inApp: { lowStock: true, newSale: true, invoicePaid: true, subscriptionExpiring: false }
      })
      expect(res.status).toBe(200)
    })
  })

  describe('Security Overview', () => {
    it('returns security stats', async () => {
      const res = await request(app).get('/api/settings/security').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('activeSessions')
      expect(res.body.data).toHaveProperty('activeApiKeys')
      expect(res.body.data).toHaveProperty('recentLogins')
    })
  })
})

describe('Subscriptions API', () => {
  let token, business

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  it('GET /api/subscriptions/plans lists available plans', async () => {
    const res = await request(app).get('/api/subscriptions/plans').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(3)
    const planIds = res.body.data.map((p) => p.id)
    expect(planIds).toContain('starter')
    expect(planIds).toContain('growth')
    expect(planIds).toContain('enterprise')
  })

  it('GET /api/subscriptions/current returns trial subscription', async () => {
    const res = await request(app).get('/api/subscriptions/current').set(auth())
    expect(res.status).toBe(200)
    expect(['trial', 'active']).toContain(res.body.data.status)
    expect(res.body.data).toHaveProperty('daysLeft')
    expect(res.body.data).toHaveProperty('plan')
  })

  it('POST /api/subscriptions/upgrade upgrades plan', async () => {
    const res = await request(app).post('/api/subscriptions/upgrade').set(auth()).send({ planId: 'growth' })
    expect(res.status).toBe(200)
    expect(res.body.data.planId).toBe('growth')
    expect(res.body.data.status).toBe('active')
  })

  it('cannot upgrade to same plan twice', async () => {
    const res = await request(app).post('/api/subscriptions/upgrade').set(auth()).send({ planId: 'growth' })
    expect(res.status).toBe(409)
  })

  it('GET /api/subscriptions/billing returns billing history', async () => {
    const res = await request(app).get('/api/subscriptions/billing').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0) // upgrade created a billing record
  })
})
