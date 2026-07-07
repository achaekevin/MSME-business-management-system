const request = require('supertest')
const bcrypt = require('bcryptjs')
const { prisma } = require('../src/config/database')
const createApp = require('../src/app')

const app = createApp()

// ── Data factories ────────────────────────────────────────────────────────────

let _businessCounter = 0

async function createTestBusiness(overrides = {}) {
  _businessCounter++
  const slug = `test-biz-${_businessCounter}-${Date.now()}`

  const business = await prisma.business.create({
    data: {
      name: `Test Business ${_businessCounter}`,
      slug,
      email: `owner${_businessCounter}@test.com`,
      phone: '+254700000000',
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      trialEndsAt: new Date(Date.now() + 14 * 86400000),
      ...overrides
    }
  })

  const branch = await prisma.branch.create({
    data: { businessId: business.id, name: 'Head Office', code: 'HQ', isHeadquarters: true }
  })

  await prisma.subscription.create({
    data: {
      businessId: business.id, planId: 'starter', planName: 'Starter', status: 'trial',
      currentPeriodEnd: new Date(Date.now() + 14 * 86400000)
    }
  })
  await prisma.businessSetting.create({ data: { businessId: business.id } })

  return { business, branch }
}

async function createTestRole(businessId) {
  const perms = await prisma.permission.findMany()
  return prisma.role.create({
    data: {
      businessId, name: 'Test Admin', isSystem: false,
      permissions: { create: perms.map((p) => ({ permissionId: p.id })) }
    }
  })
}

async function createTestUser(businessId, branchId, roleId, overrides = {}) {
  const counter = Date.now()
  return prisma.user.create({
    data: {
      businessId, branchId, roleId,
      name: 'Test User',
      email: `user${counter}@test.com`,
      passwordHash: await bcrypt.hash('Test@1234', 10),
      isOwner: false,
      isActive: true,
      status: 'active',
      emailVerifiedAt: new Date(),
      ...overrides
    }
  })
}

async function createOwnerUser(businessId, branchId) {
  const role = await createTestRole(businessId)
  const counter = Date.now()
  return prisma.user.create({
    data: {
      businessId, branchId, roleId: role.id,
      name: 'Test Owner',
      email: `owner${counter}@test.com`,
      passwordHash: await bcrypt.hash('Owner@1234', 10),
      isOwner: true, isActive: true, status: 'active', emailVerifiedAt: new Date()
    }
  })
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getAuthToken(email = null, password = 'Owner@1234') {
  const { business, branch } = await createTestBusiness()
  const user = await createOwnerUser(business.id, branch.id)
  const loginEmail = email || user.email

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: loginEmail, password })

  return {
    token: res.body.data?.token,
    user: res.body.data?.user,
    business,
    branch,
    authUser: user
  }
}

// ── DB cleanup ────────────────────────────────────────────────────────────────

async function cleanupBusiness(businessId) {
  if (!businessId) return
  await prisma.business.delete({ where: { id: businessId } }).catch(() => {})
}

module.exports = { app, createTestBusiness, createTestRole, createTestUser, createOwnerUser, getAuthToken, cleanupBusiness }
