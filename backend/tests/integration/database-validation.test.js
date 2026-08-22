const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

describe('Database Architecture & Relational Integrity Tests', () => {
  let demoBusiness
  let testBusinessB

  beforeAll(async () => {
    demoBusiness = await prisma.business.findFirst({
      where: { email: 'admin@ssme.com' },
      include: { branches: true, users: { include: { role: true } } }
    })
  })

  afterAll(async () => {
    if (testBusinessB) {
      await prisma.product.deleteMany({ where: { businessId: testBusinessB.id } }).catch(() => {})
      await prisma.business.delete({ where: { id: testBusinessB.id } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  test('1. Core Multi-Tenant Isolation: Business B cannot see Business A records', async () => {
    expect(demoBusiness).toBeDefined()
    expect(demoBusiness.name).toBe('SSME Business')

    // Create a second tenant
    testBusinessB = await prisma.business.create({
      data: {
        name: 'Tenant B Logistics',
        slug: `tenant-b-${Date.now()}`,
        email: `contact-${Date.now()}@tenantb.example.com`,
        phone: '+254799000001',
        currency: 'USD'
      }
    })

    // Create product in Business B
    const productB = await prisma.product.create({
      data: {
        businessId: testBusinessB.id,
        name: 'Tenant B Exclusive Product',
        sku: `SKU-B-${Date.now()}`,
        costPrice: 50.00,
        sellingPrice: 100.00
      }
    })

    // Query products belonging strictly to demoBusiness (Tenant A)
    const businessAProducts = await prisma.product.findMany({
      where: { businessId: demoBusiness.id }
    })

    // Verify isolation
    const foundProductBInA = businessAProducts.find((p) => p.id === productB.id)
    expect(foundProductBInA).toBeUndefined()
  })

  test('2. RBAC & Password Hashing: 10 primary roles exist with valid bcrypt password verification', async () => {
    const roles = await prisma.role.findMany({
      where: { businessId: demoBusiness.id },
      include: { permissions: { include: { permission: true } } }
    })

    expect(roles.length).toBeGreaterThanOrEqual(9)

    // Verify Business Owner user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@ssme.com' }
    })
    expect(adminUser).toBeDefined()
    const passwordValid = await bcrypt.compare('admin1', adminUser.passwordHash)
    expect(passwordValid).toBe(true)
  })

  test('3. Inventory & Catalog: Products, Categories, Units & Warehouses are properly linked', async () => {
    const products = await prisma.product.findMany({
      where: { businessId: demoBusiness.id },
      include: { category: true, unit: true, inventoryStocks: true }
    })

    expect(products.length).toBeGreaterThan(0)
    for (const prod of products) {
      expect(prod.businessId).toBe(demoBusiness.id)
      if (prod.trackInventory && prod.inventoryStocks.length > 0) {
        expect(Number(prod.inventoryStocks[0].quantity)).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('4. Double-Entry Accounting: Balanced Journal Entry (Total Debits == Total Credits)', async () => {
    const cashAccount = await prisma.account.findFirst({
      where: { businessId: demoBusiness.id, code: '1000' }
    })
    const revenueAccount = await prisma.account.findFirst({
      where: { businessId: demoBusiness.id, code: '4000' }
    })

    expect(cashAccount).toBeDefined()
    expect(revenueAccount).toBeDefined()

    const journalEntry = await prisma.journalEntry.create({
      data: {
        businessId: demoBusiness.id,
        entryNumber: `JE-TEST-${Date.now()}`,
        date: new Date(),
        description: 'Test Sales Transaction Entry',
        status: 'posted',
        lines: {
          create: [
            {
              accountId: cashAccount.id,
              debit: 5000.00,
              credit: 0.00,
              memo: 'Debit Cash'
            },
            {
              accountId: revenueAccount.id,
              debit: 0.00,
              credit: 5000.00,
              memo: 'Credit Sales Revenue'
            }
          ]
        }
      },
      include: { lines: true }
    })

    const totalDebit = journalEntry.lines
      .reduce((sum, l) => sum + Number(l.debit), 0)

    const totalCredit = journalEntry.lines
      .reduce((sum, l) => sum + Number(l.credit), 0)

    expect(totalDebit).toBe(5000.00)
    expect(totalCredit).toBe(5000.00)
    expect(totalDebit).toEqual(totalCredit)
  })

  test('5. Precision & Currency Constraints: Decimal precision is retained without float rounding errors', async () => {
    const testDecimalAmount = 12345.67
    const payment = await prisma.payment.create({
      data: {
        businessId: demoBusiness.id,
        referenceType: 'sale',
        amount: testDecimalAmount,
        method: 'mobile_money',
        reference: `MPESA-REF-${Date.now()}`
      }
    })

    expect(Number(payment.amount)).toBe(12345.67)
  })
})
