const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')

describe('Invoices API', () => {
  let token, business, branch, customer, product

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token; business = auth.business; branch = auth.branch
    customer = await prisma.customer.create({ data: { businessId: business.id, name: 'Inv Customer', type: 'business' } })
    product = await prisma.product.create({ data: { businessId: business.id, name: 'Inv Product', sku: `INV-${Date.now()}`, sellingPrice: 10000, costPrice: 7000, trackInventory: false } })
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  it('creates an invoice in draft status', async () => {
    const res = await request(app).post('/api/invoices').set(auth()).send({
      customerId: customer.id, dueDate: '2024-12-31',
      items: [{ productId: product.id, quantity: 3, unitPrice: 10000, discount: 0, tax: 0 }]
    })
    expect(res.status).toBe(201)
    expect(res.body.data.invoiceNumber).toMatch(/^INV-/)
    expect(res.body.data.status).toBe('draft')
    expect(Number(res.body.data.total)).toBe(30000)
  })

  it('records partial then full payment', async () => {
    const invRes = await request(app).post('/api/invoices').set(auth()).send({
      customerId: customer.id, dueDate: '2024-12-31',
      items: [{ productId: product.id, quantity: 2, unitPrice: 10000, discount: 0, tax: 0 }]
    })
    const invoiceId = invRes.body.data.id

    const partial = await request(app).post(`/api/invoices/${invoiceId}/payments`).set(auth()).send({ amount: 10000, method: 'cash' })
    expect(partial.status).toBe(200)
    expect(partial.body.data.status).toBe('partial')

    const full = await request(app).post(`/api/invoices/${invoiceId}/payments`).set(auth()).send({ amount: 10000, method: 'bank_transfer' })
    expect(full.status).toBe(200)
    expect(full.body.data.status).toBe('paid')
    expect(Number(full.body.data.balance)).toBe(0)
  })

  it('rejects payment exceeding balance', async () => {
    const invRes = await request(app).post('/api/invoices').set(auth()).send({
      customerId: customer.id, dueDate: '2024-12-31',
      items: [{ productId: product.id, quantity: 1, unitPrice: 5000, discount: 0, tax: 0 }]
    })
    const res = await request(app).post(`/api/invoices/${invRes.body.data.id}/payments`).set(auth()).send({ amount: 9999, method: 'cash' })
    expect(res.status).toBe(400)
  })
})
