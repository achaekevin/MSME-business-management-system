const { z } = require('zod')
const { PAYMENT_METHODS } = require('../../constants')

const createExpenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string().min(1),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  attachmentUrl: z.string().url().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  businessId: z.string().optional()
})

const updateExpenseSchema = createExpenseSchema.partial()

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required')
})

module.exports = { createExpenseSchema, updateExpenseSchema, rejectSchema }
