const request = require('supertest')
const { app, createTestBusiness, createOwnerUser, cleanupBusiness } = require('../helpers')

describe('POST /api/auth/register', () => {
  it('creates a new business and owner, returns tokens', async () => {
    const payload = {
      businessName: 'Integration Test Biz',
      ownerName: 'Test Owner',
      email: `reg-${Date.now()}@test.com`,
      phone: '+254700111222',
      password: 'Test@1234',
      confirmPassword: 'Test@1234'
    }

    const res = await request(app).post('/api/auth/register').send(payload)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('token')
    expect(res.body.data).toHaveProperty('refreshToken')
    expect(res.body.data.user.email).toBe(payload.email)
    expect(res.body.data.user).not.toHaveProperty('passwordHash')

    // cleanup
    if (res.body.data?.business?.id) {
      await cleanupBusiness(res.body.data.business.id)
    }
  })

  it('rejects registration with a duplicate email', async () => {
    const email = `dup-${Date.now()}@test.com`
    const payload = { businessName: 'Biz A', ownerName: 'Owner', email, phone: '+254700000001', password: 'Test@1234' }

    const res1 = await request(app).post('/api/auth/register').send(payload)
    expect(res1.status).toBe(201)

    const res2 = await request(app).post('/api/auth/register').send({ ...payload, businessName: 'Biz B' })
    expect(res2.status).toBe(409)

    if (res1.body.data?.business?.id) await cleanupBusiness(res1.body.data.business.id)
  })

  it('rejects a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      businessName: 'Weak Pass Biz',
      ownerName: 'Owner',
      email: `weak-${Date.now()}@test.com`,
      phone: '+254700000002',
      password: 'weak'
    })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/auth/login', () => {
  let business, branch, user, email

  beforeAll(async () => {
    ;({ business, branch } = await createTestBusiness())
    email = `login-test-${Date.now()}@test.com`
    user = await createOwnerUser(business.id, branch.id)
    email = user.email
  })

  afterAll(async () => {
    await cleanupBusiness(business?.id)
  })

  it('returns tokens on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'Owner@1234' })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('token')
    expect(res.body.data).toHaveProperty('refreshToken')
  })

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPassword@1' })
    expect(res.status).toBe(401)
  })

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'Test@1234' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/refresh', () => {
  it('issues a new access token from a valid refresh token', async () => {
    const { business, branch } = await createTestBusiness()
    const user = await createOwnerUser(business.id, branch.id)

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Owner@1234' })

    const { refreshToken } = loginRes.body.data

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(refreshRes.status).toBe(200)
    expect(refreshRes.body.data).toHaveProperty('token')

    await cleanupBusiness(business.id)
  })

  it('rejects a bogus refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'not-a-real-token' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the authenticated user profile', async () => {
    const { business, branch } = await createTestBusiness()
    const user = await createOwnerUser(business.id, branch.id)
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Owner@1234' })
    const { token } = loginRes.body.data

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(user.id)
    expect(res.body.data).not.toHaveProperty('passwordHash')

    await cleanupBusiness(business.id)
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
