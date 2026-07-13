const { z } = require('zod')

const openShift = z.object({
  body: z.object({
    openingCash: z.number().min(0).optional().default(0),
    notes: z.string().optional()
  })
})

const closeShift = z.object({
  params: z.object({
    shiftId: z.string().uuid()
  }),
  body: z.object({
    actualCash: z.number().min(0, 'Actual cash must be a positive number'),
    notes: z.string().optional()
  })
})

const createSale = z.object({
  body: z.object({
    customerId: z.string().uuid().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().positive('Quantity must be positive'),
        unitPrice: z.number().positive('Unit price must be positive'),
        discount: z.number().min(0).optional().default(0),
        tax: z.number().min(0).max(100).optional().default(0)
      })
    ).min(1, 'At least one item is required'),
    discountAmount: z.number().min(0).optional().default(0),
    paymentMethod: z.enum(['cash', 'card', 'mobile_money', 'bank_transfer']).optional().default('cash'),
    amountPaid: z.number().min(0).optional(),
    cashReceived: z.number().min(0).optional(),
    changeGiven: z.number().min(0).optional(),
    notes: z.string().optional()
  })
})

const processReturn = z.object({
  params: z.object({
    saleId: z.string().uuid()
  }),
  body: z.object({
    amount: z.number().positive('Return amount must be positive'),
    reason: z.string().min(3, 'Return reason must be at least 3 characters')
  })
})

const updateConfig = z.object({
  body: z.object({
    receiptHeader: z.string().optional(),
    receiptFooter: z.string().optional(),
    autoOpenCashDrawer: z.boolean().optional(),
    autoPrintReceipt: z.boolean().optional(),
    allowNegativeStock: z.boolean().optional(),
    requireCustomer: z.boolean().optional(),
    taxRate: z.number().min(0).max(100).optional()
  })
})

module.exports = {
  openShift,
  closeShift,
  createSale,
  processReturn,
  updateConfig
}
