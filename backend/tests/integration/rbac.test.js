const request = require('supertest')
const { app, createTestBusiness, createTestRole, createOwnerUser, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')
const bcrypt = require('bcryptjs')

describe('RBAC / Permission Middleware', () => {
  let business, branch, ownerToken, restrictedToken

  beforeAll(async () => {
    ;({ business, branch } = await createTestBusiness())
    const owner = await createOwnerUser(business.id, branch.id)

    const ownerLogin = await request(app).post('/api/auth/login').send({ email: owner.email, password: 'Owner@1234' })
    ownerToken = ownerLogin.body.data.token

    // Create a viewer role with NO permissions
    const viewerRole = await prisma.role.create({
      data: { businessId: business.id, name: 'NoPermRole', isSystem: false }
    })

    const restrictedUser = await prisma.user.create({
      data: {
        businessId: business.id, branchId: branch.id, roleId: viewerRole.id,
        name: 'Restricted User', email: `restricted-${Date.now()}@test.com`,
        passwordHash: await bcrypt.hash('Test@1234', 10),
        isOwner: false, isActive: true, status: 'active', emailVerifiedAt: new Date()
      }
    })

    const restrictedLogin = await request(app).post('/api/auth/login').send({ email: restrictedUser.email, password: 'Test@1234' })
    restrictedToken = restrictedLogin.body.data.token
  })

  afterAll(async () => {
    await cleanupBusiness(business?.id)
  })

  it('owner can access all customer endpoints', async () => {
    const res = await request(app).get('/api/customers').set('Authorization', `Bearer ${ownerToken}`)
    expect(res.status).toBe(200)
  })

  it('user with no permissions is denied access to customers', async () => {
    const res = await request(app).get('/api/customers').set('Authorization', `Bearer ${restrictedToken}`)
    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('user with no permissions is denied creating customers', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${restrictedToken}`)
      .send({ name: 'Test Customer', type: 'individual' })
    expect(res.status).toBe(403)
  })

  it('unauthenticated request always returns 401', async () => {
    const res = await request(app).get('/api/customers')
    expect(res.status).toBe(401)
  })
})
