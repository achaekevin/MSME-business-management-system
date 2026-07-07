const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')

describe('Accounting API', () => {
  let token, business

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
  })

  afterAll(async () => {
    await cleanupBusiness(business?.id)
  })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('GET /api/accounting/accounts', () => {
    it('returns the seeded chart of accounts', async () => {
      const res = await request(app).get('/api/accounting/accounts').set(auth())
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('POST /api/accounting/accounts', () => {
    it('creates a new account', async () => {
      const res = await request(app)
        .post('/api/accounting/accounts')
        .set(auth())
        .send({ code: `TEST-${Date.now()}`, name: 'Test Account', type: 'asset' })
      expect(res.status).toBe(201)
      expect(res.body.data.type).toBe('asset')
      expect(res.body.data.businessId).toBe(business.id)
    })

    it('rejects duplicate account codes', async () => {
      const code = `DUP-${Date.now()}`
      await request(app).post('/api/accounting/accounts').set(auth()).send({ code, name: 'First', type: 'asset' })
      const res = await request(app).post('/api/accounting/accounts').set(auth()).send({ code, name: 'Second', type: 'asset' })
      expect(res.status).toBe(409)
    })
  })

  describe('POST /api/accounting/journals', () => {
    it('creates a balanced double-entry journal', async () => {
      const accounts = await prisma.account.findMany({ where: { businessId: business.id }, take: 2 })
      if (accounts.length < 2) return // skip if no accounts seeded

      const [a1, a2] = accounts
      const res = await request(app)
        .post('/api/accounting/journals')
        .set(auth())
        .send({
          date: new Date().toISOString(),
          description: 'Test journal entry',
          lines: [
            { accountId: a1.id, debit: 1000, credit: 0 },
            { accountId: a2.id, debit: 0, credit: 1000 }
          ]
        })
      expect(res.status).toBe(201)
      expect(res.body.data.lines).toHaveLength(2)
    })

    it('rejects an unbalanced journal entry', async () => {
      const accounts = await prisma.account.findMany({ where: { businessId: business.id }, take: 2 })
      if (accounts.length < 2) return

      const [a1, a2] = accounts
      const res = await request(app)
        .post('/api/accounting/journals')
        .set(auth())
        .send({
          date: new Date().toISOString(),
          description: 'Unbalanced',
          lines: [
            { accountId: a1.id, debit: 1000, credit: 0 },
            { accountId: a2.id, debit: 0, credit: 500 } // ≠ 1000
          ]
        })
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/not balanced/i)
    })

    it('requires at least 2 lines', async () => {
      const accounts = await prisma.account.findMany({ where: { businessId: business.id }, take: 1 })
      if (!accounts.length) return

      const res = await request(app)
        .post('/api/accounting/journals')
        .set(auth())
        .send({
          date: new Date().toISOString(),
          lines: [{ accountId: accounts[0].id, debit: 100, credit: 0 }]
        })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/accounting/reports/trial-balance', () => {
    it('returns trial balance with totals', async () => {
      const res = await request(app).get('/api/accounting/reports/trial-balance').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('rows')
      expect(res.body.data).toHaveProperty('totalDebit')
      expect(res.body.data).toHaveProperty('totalCredit')
      expect(res.body.data).toHaveProperty('balanced')
    })
  })

  describe('GET /api/accounting/reports/profit-loss', () => {
    it('returns P&L with income, expenses, and net profit', async () => {
      const res = await request(app).get('/api/accounting/reports/profit-loss').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('income')
      expect(res.body.data).toHaveProperty('expenses')
      expect(res.body.data).toHaveProperty('netProfit')
    })
  })
})
