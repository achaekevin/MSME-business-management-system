const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const salesService = require('../sales/sales.service')

// ─────────────────────────────────────────────────────────────────────────────
// POS SHIFT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Open a new POS shift. A cashier must open a shift before making sales.
 * Records opening cash amount and locks the shift to this user.
 */
async function openShift(businessId, branchId, data, userId) {
  // Check if user already has an open shift
  const existingShift = await prisma.posShift.findFirst({
    where: {
      businessId,
      userId,
      status: 'open'
    }
  })

  if (existingShift) {
    throw ApiError.conflict('You already have an open shift. Please close it before opening a new one.')
  }

  const count = await prisma.posShift.count({ where: { businessId } })
  const shiftNumber = `SHIFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`

  const shift = await prisma.posShift.create({
    data: {
      businessId,
      branchId,
      userId,
      shiftNumber,
      openingCash: data.openingCash || 0,
      expectedCash: data.openingCash || 0,
      status: 'open',
      openedAt: new Date()
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      branch: { select: { id: true, name: true, code: true } }
    }
  })

  return shift
}

/**
 * Close the current shift. Calculates totals and requires actual cash count.
 */
async function closeShift(businessId, shiftId, data, userId) {
  const shift = await prisma.posShift.findFirst({
    where: {
      id: shiftId,
      businessId,
      userId,
      status: 'open'
    },
    include: {
      transactions: {
        include: {
          saleOrder: true
        }
      }
    }
  })

  if (!shift) {
    throw ApiError.notFound('Open shift not found or you do not have permission to close it')
  }

  // Calculate shift totals
  const cashSales = shift.transactions
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const cardSales = shift.transactions
    .filter(t => t.paymentMethod === 'card')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const mobileMoneySales = shift.transactions
    .filter(t => t.paymentMethod === 'mobile_money')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const totalSales = shift.transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const transactionCount = shift.transactions.length
  
  const expectedCash = Number(shift.openingCash) + cashSales
  const actualCash = data.actualCash
  const cashDifference = actualCash - expectedCash

  const closedShift = await prisma.posShift.update({
    where: { id: shiftId },
    data: {
      status: 'closed',
      closedAt: new Date(),
      closingCash: actualCash,
      expectedCash,
      cashDifference,
      totalSales,
      cashSales,
      cardSales,
      mobileMoneySales,
      transactionCount,
      closingNotes: data.notes
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      branch: { select: { id: true, name: true, code: true } },
      transactions: {
        include: {
          saleOrder: {
            include: {
              customer: true
            }
          }
        }
      }
    }
  })

  return closedShift
}

/**
 * Get current open shift for the logged-in user
 */
async function getCurrentShift(businessId, userId) {
  const shift = await prisma.posShift.findFirst({
    where: {
      businessId,
      userId,
      status: 'open'
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      branch: { select: { id: true, name: true, code: true } },
      transactions: {
        include: {
          saleOrder: {
            include: {
              customer: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!shift) {
    return null
  }

  // Calculate running totals
  const cashSales = shift.transactions
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const cardSales = shift.transactions
    .filter(t => t.paymentMethod === 'card')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const mobileMoneySales = shift.transactions
    .filter(t => t.paymentMethod === 'mobile_money')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const totalSales = shift.transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const transactionCount = shift.transactions.length
  const expectedCash = Number(shift.openingCash) + cashSales

  return {
    ...shift,
    totalSales,
    cashSales,
    cardSales,
    mobileMoneySales,
    transactionCount,
    expectedCash
  }
}

/**
 * Get shift history with filters
 */
async function getShiftHistory(businessId, query) {
  const { userId, branchId, status, page = 1, limit = 25 } = query
  const skip = (page - 1) * limit

  const where = {
    businessId,
    ...(userId && { userId }),
    ...(branchId && { branchId }),
    ...(status && { status })
  }

  const [shifts, total] = await Promise.all([
    prisma.posShift.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true, code: true } }
      }
    }),
    prisma.posShift.count({ where })
  ])

  return {
    shifts,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POS SALES TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a POS sale (quick sale with automatic inventory deduction)
 * This wraps the sales service createSale but adds POS-specific features
 */
async function createPOSSale(businessId, branchId, data, userId, req) {
  // Check if user has an open shift
  const shift = await prisma.posShift.findFirst({
    where: {
      businessId,
      userId,
      status: 'open'
    }
  })

  if (!shift) {
    throw ApiError.forbidden('You must open a shift before making sales')
  }

  // Create the sale using existing sales service
  const sale = await salesService.createSale(businessId, {
    ...data,
    branchId
  }, userId, req)

  // Record the transaction in the POS shift
  await prisma.posTransaction.create({
    data: {
      shiftId: shift.id,
      saleOrderId: sale.id,
      amount: sale.total,
      paymentMethod: data.paymentMethod || 'cash',
      cashReceived: data.cashReceived || 0,
      changeGiven: data.changeGiven || 0
    }
  })

  // Return sale with receipt data
  return {
    ...sale,
    shiftNumber: shift.shiftNumber,
    cashier: shift.user?.name,
    receiptNumber: sale.orderNumber
  }
}

/**
 * Search products for POS (by name, SKU, or barcode)
 */
async function searchProducts(businessId, query) {
  const { search, limit = 20 } = query

  if (!search || search.length < 2) {
    throw ApiError.badRequest('Search query must be at least 2 characters')
  }

  const products = await prisma.product.findMany({
    where: {
      businessId,
      isActive: true,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    },
    take: Number(limit),
    include: {
      category: true,
      unit: true,
      inventoryStocks: {
        select: {
          quantity: true,
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  // Calculate total stock for each product
  return products.map(product => ({
    ...product,
    totalStock: product.inventoryStocks.reduce((sum, stock) => sum + Number(stock.quantity), 0)
  }))
}

/**
 * Get product by barcode for quick scanning
 */
async function getProductByBarcode(businessId, barcode) {
  const product = await prisma.product.findFirst({
    where: {
      businessId,
      barcode,
      isActive: true
    },
    include: {
      category: true,
      unit: true,
      inventoryStocks: {
        select: {
          quantity: true,
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  if (!product) {
    throw ApiError.notFound('Product not found with this barcode')
  }

  return {
    ...product,
    totalStock: product.inventoryStocks.reduce((sum, stock) => sum + Number(stock.quantity), 0)
  }
}

/**
 * Process return/refund at POS
 */
async function processPOSReturn(businessId, saleId, data, userId, req) {
  // Check if user has an open shift
  const shift = await prisma.posShift.findFirst({
    where: {
      businessId,
      userId,
      status: 'open'
    }
  })

  if (!shift) {
    throw ApiError.forbidden('You must open a shift before processing returns')
  }

  // Create return using sales service
  const saleReturn = await salesService.createReturn(businessId, saleId, data, req)

  // Record negative transaction in shift
  await prisma.posTransaction.create({
    data: {
      shiftId: shift.id,
      saleOrderId: saleId,
      amount: -data.amount,
      paymentMethod: 'cash', // Returns typically in cash
      cashReceived: 0,
      changeGiven: data.amount,
      notes: `Return: ${data.reason}`
    }
  })

  return saleReturn
}

// ─────────────────────────────────────────────────────────────────────────────
// POS CONFIGURATION & SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get POS configuration for a branch
 */
async function getPOSConfig(businessId, branchId) {
  let config = await prisma.posConfiguration.findFirst({
    where: {
      businessId,
      branchId
    }
  })

  // Create default config if doesn't exist
  if (!config) {
    config = await prisma.posConfiguration.create({
      data: {
        businessId,
        branchId,
        receiptHeader: 'Thank you for your purchase!',
        receiptFooter: 'Please come again',
        autoOpenCashDrawer: true,
        autoPrintReceipt: true,
        allowNegativeStock: false,
        requireCustomer: false
      }
    })
  }

  return config
}

/**
 * Update POS configuration
 */
async function updatePOSConfig(businessId, branchId, data) {
  const config = await prisma.posConfiguration.upsert({
    where: {
      businessId_branchId: {
        businessId,
        branchId
      }
    },
    update: data,
    create: {
      businessId,
      branchId,
      ...data
    }
  })

  return config
}

module.exports = {
  // Shift management
  openShift,
  closeShift,
  getCurrentShift,
  getShiftHistory,
  
  // Sales transactions
  createPOSSale,
  searchProducts,
  getProductByBarcode,
  processPOSReturn,
  
  // Configuration
  getPOSConfig,
  updatePOSConfig
}
