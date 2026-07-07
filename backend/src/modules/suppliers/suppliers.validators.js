const { z } = require('zod')

const createSupplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().optional(),
  taxNumber: z.string().optional(),
  paymentTerms: z.coerce.number().int().min(0).max(365).default(0),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  businessId: z.string().optional()
})

const updateSupplierSchema = createSupplierSchema.partial()

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque', 'credit']),
  reference: z.string().optional(),
  notes: z.string().optional()
})

module.exports = { createSupplierSchema, updateSupplierSchema, paymentSchema }
