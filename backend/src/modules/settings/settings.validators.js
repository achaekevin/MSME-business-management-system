const { z } = require('zod')

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional().default([]),
  expiresAt: z.string().datetime().optional().nullable()
})

const webhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
  isActive: z.boolean().optional().default(true)
})

const notificationSettingsSchema = z.object({
  email: z.object({
    lowStock: z.boolean().optional(),
    newSale: z.boolean().optional(),
    invoicePaid: z.boolean().optional(),
    newCustomer: z.boolean().optional()
  }).optional(),
  inApp: z.object({
    lowStock: z.boolean().optional(),
    newSale: z.boolean().optional(),
    invoicePaid: z.boolean().optional(),
    subscriptionExpiring: z.boolean().optional()
  }).optional()
})

module.exports = { apiKeySchema, webhookSchema, notificationSettingsSchema }
