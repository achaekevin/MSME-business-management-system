const { z } = require('zod')

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  fiscalYearStart: z.string().optional(),
  taxNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  type: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional()
})

const settingsSchema = z.object({
  taxRate: z.coerce.number().min(0).max(100).optional(),
  taxInclusive: z.boolean().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  notificationSettings: z.record(z.any()).optional(),
  appearanceSettings: z.record(z.any()).optional(),
  securitySettings: z.record(z.any()).optional(),
  receiptTemplate: z.string().optional(),
  invoiceTemplate: z.string().optional()
})

module.exports = { profileSchema, settingsSchema }
