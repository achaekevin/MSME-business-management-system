const { z } = require('zod')

const createBranchSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(10).toUpperCase(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  managerId: z.string().uuid().optional().nullable(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  businessId: z.string().optional()
})

const updateBranchSchema = createBranchSchema.partial()

module.exports = { createBranchSchema, updateBranchSchema }
