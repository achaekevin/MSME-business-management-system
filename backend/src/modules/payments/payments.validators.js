const { z } = require('zod')
const { PAYMENT_METHODS } = require('../../constants')

const mpesaInitiateSchema = z.object({
  phone: z.string().regex(/^\+?254\d{9}$/, 'Must be a valid Kenyan phone number'),
  amount: z.coerce.number().positive(),
  accountRef: z.string().min(1),
  description: z.string().optional()
})

module.exports = { mpesaInitiateSchema }
