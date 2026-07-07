const { z } = require('zod')

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0)
})

const createSaleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  discountAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  amountPaid: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  businessId: z.string().optional()
})

const updateSaleSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(['confirmed', 'partial', 'paid']).optional()
})

const voidSaleSchema = z.object({
  reason: z.string().min(3, 'Please provide a reason for voiding this sale')
})

const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

const createQuotationSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  items: z.array(orderItemSchema).min(1),
  discountAmount: z.coerce.number().min(0).default(0),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  businessId: z.string().optional()
})

const createReturnSchema = z.object({
  reason: z.string().min(3),
  amount: z.coerce.number().positive()
})

module.exports = {
  createSaleSchema, updateSaleSchema, voidSaleSchema, listSalesQuerySchema,
  createQuotationSchema, createReturnSchema
}
