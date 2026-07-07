const { z } = require('zod')

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional()
}).optional()

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  type: z.enum(['individual', 'business']).default('individual'),
  groupId: z.string().uuid().optional().nullable(),
  creditLimit: z.coerce.number().min(0).optional().default(0),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxNumber: z.string().optional(),
  notes: z.string().max(2000).optional(),
  businessId: z.string().optional() // injected by tenantContext middleware
})

const updateCustomerSchema = createCustomerSchema.partial()

const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  type: z.enum(['individual', 'business', '']).optional(),
  groupId: z.string().uuid().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

const createCustomerGroupSchema = z.object({
  name: z.string().min(2),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  businessId: z.string().optional()
})

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  createCustomerGroupSchema
}
