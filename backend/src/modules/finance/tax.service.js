const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// TAX RATES & CONFIGURATION
// ============================================================================

async function createTaxRate(businessId, data) {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.taxRate.updateMany({
      where: { businessId, isDefault: true },
      data: { isDefault: false }
    })
  }

  const taxRate = await prisma.taxRate.create({
    data: {
      businessId,
      ...data
    }
  })

  // Create tax components if compound tax
  if (data.isCompound && data.components) {
    await prisma.taxComponent.createMany({
      data: data.components.map(c => ({
        taxRateId: taxRate.id,
        name: c.name,
        rate: c.rate,
        order: c.order || 1
      }))
    })
  }

  return await prisma.taxRate.findUnique({
    where: { id: taxRate.id },
    include: { taxComponents: true }
  })
}

async function getTaxRates(businessId, filters = {}) {
  const where = { businessId }
  if (filters.isActive !== undefined) where.isActive = filters.isActive
  if (filters.taxType) where.taxType = filters.taxType
  if (filters.applicableOn) where.applicableOn = filters.applicableOn

  return await prisma.taxRate.findMany({
    where,
    include: {
      taxComponents: true,
      _count: {
        select: { taxExemptions: true, taxPayments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function updateTaxRate(taxRateId, data) {
  if (data.isDefault) {
    const taxRate = await prisma.taxRate.findUnique({ where: { id: taxRateId } })
    await prisma.taxRate.updateMany({
      where: { businessId: taxRate.businessId, isDefault: true },
      data: { isDefault: false }
    })
  }

  return await prisma.taxRate.update({
    where: { id: taxRateId },
    data,
    include: { taxComponents: true }
  })
}

async function deleteTaxRate(taxRateId) {
  // Check if tax rate is in use
  const usage = await prisma.taxPayment.count({ where: { taxRateId } })
  if (usage > 0) {
    throw ApiError.badRequest('Cannot delete tax rate that is in use. Mark it as inactive instead.')
  }

  return await prisma.taxRate.delete({ where: { id: taxRateId } })
}

// ============================================================================
// TAX EXEMPTIONS
// ============================================================================

async function createTaxExemption(businessId, data) {
  return await prisma.taxExemption.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getTaxExemptions(businessId, filters = {}) {
  const where = { businessId }
  if (filters.isActive !== undefined) where.isActive = filters.isActive
  if (filters.exemptionType) where.exemptionType = filters.exemptionType
  if (filters.taxRateId) where.taxRateId = filters.taxRateId

  return await prisma.taxExemption.findMany({
    where,
    include: {
      taxRate: { select: { name: true, taxType: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function updateTaxExemption(exemptionId, data) {
  return await prisma.taxExemption.update({
    where: { id: exemptionId },
    data
  })
}

// ============================================================================
// TAX PAYMENTS
// ============================================================================

async function createTaxPayment(businessId, data) {
  const lastPayment = await prisma.taxPayment.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: { paymentNumber: true }
  })

  const paymentNumber = generateTaxPaymentNumber(lastPayment?.paymentNumber)

  return await prisma.taxPayment.create({
    data: {
      businessId,
      paymentNumber,
      ...data
    },
    include: {
      taxRate: true
    }
  })
}

async function getTaxPayments(businessId, filters = {}) {
  const where = { businessId }
  if (filters.status) where.status = filters.status
  if (filters.taxRateId) where.taxRateId = filters.taxRateId
  if (filters.startDate && filters.endDate) {
    where.periodStart = { gte: new Date(filters.startDate) }
    where.periodEnd = { lte: new Date(filters.endDate) }
  }

  return await prisma.taxPayment.findMany({
    where,
    include: {
      taxRate: { select: { name: true, taxType: true, rate: true } }
    },
    orderBy: { periodStart: 'desc' }
  })
}

async function updateTaxPayment(paymentId, data) {
  return await prisma.taxPayment.update({
    where: { id: paymentId },
    data,
    include: {
      taxRate: true
    }
  })
}

async function markTaxPaymentPaid(paymentId, paymentData) {
  return await prisma.taxPayment.update({
    where: { id: paymentId },
    data: {
      status: 'paid',
      paymentDate: paymentData.paymentDate || new Date(),
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber
    }
  })
}

// ============================================================================
// TAX REPORTS & CALCULATIONS
// ============================================================================

async function getTaxReport(businessId, startDate, endDate, taxRateId = null) {
  const where = {
    businessId,
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  // Get sales and purchases with tax
  const [sales, purchases] = await Promise.all([
    prisma.saleOrder.aggregate({
      where,
      _sum: { subtotal: true, taxAmount: true, total: true },
      _count: true
    }),
    prisma.purchaseOrder.aggregate({
      where,
      _sum: { subtotal: true, taxAmount: true, total: true },
      _count: true
    })
  ])

  const outputTax = Number(sales._sum.taxAmount || 0)
  const inputTax = Number(purchases._sum.taxAmount || 0)
  const netTax = outputTax - inputTax

  return {
    period: { startDate, endDate },
    sales: {
      subtotal: Number(sales._sum.subtotal || 0),
      taxAmount: outputTax,
      total: Number(sales._sum.total || 0),
      count: sales._count
    },
    purchases: {
      subtotal: Number(purchases._sum.subtotal || 0),
      taxAmount: inputTax,
      total: Number(purchases._sum.total || 0),
      count: purchases._count
    },
    summary: {
      outputTax,
      inputTax,
      netTax: netTax > 0 ? netTax : 0,
      refund: netTax < 0 ? Math.abs(netTax) : 0
    }
  }
}

async function calculateTaxLiability(businessId, periodStart, periodEnd) {
  const taxRates = await prisma.taxRate.findMany({
    where: { businessId, isActive: true }
  })

  const liability = []

  for (const taxRate of taxRates) {
    const report = await getTaxReport(businessId, periodStart, periodEnd, taxRate.id)
    
    liability.push({
      taxRateId: taxRate.id,
      taxName: taxRate.name,
      taxType: taxRate.taxType,
      rate: Number(taxRate.rate),
      outputTax: report.summary.outputTax,
      inputTax: report.summary.inputTax,
      netTax: report.summary.netTax
    })
  }

  return {
    period: { periodStart, periodEnd },
    liability,
    totalLiability: liability.reduce((sum, l) => sum + l.netTax, 0)
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateTaxPaymentNumber(lastNumber) {
  if (!lastNumber) return 'TAX-0001'
  const num = parseInt(lastNumber.split('-')[1]) + 1
  return `TAX-${String(num).padStart(4, '0')}`
}

module.exports = {
  // Tax Rates
  createTaxRate,
  getTaxRates,
  updateTaxRate,
  deleteTaxRate,
  
  // Tax Exemptions
  createTaxExemption,
  getTaxExemptions,
  updateTaxExemption,
  
  // Tax Payments
  createTaxPayment,
  getTaxPayments,
  updateTaxPayment,
  markTaxPaymentPaid,
  
  // Tax Reports
  getTaxReport,
  calculateTaxLiability
}
