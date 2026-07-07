const { z } = require('zod')

const upgradeSchema = z.object({
  planId: z.enum(['starter', 'growth', 'enterprise'])
})

const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bank', 'mobile_money']),
  last4: z.string().length(4).optional(),
  brand: z.string().optional(),
  isDefault: z.boolean().optional()
})

module.exports = { upgradeSchema, paymentMethodSchema }
