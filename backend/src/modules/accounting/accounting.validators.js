const { z } = require('zod')

const accountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(2),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  businessId: z.string().optional()
})

const journalLineSchema = z.object({
  accountId: z.string().uuid(),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  memo: z.string().optional()
})

const journalSchema = z.object({
  date: z.string().min(1),
  description: z.string().optional(),
  reference: z.string().optional(),
  lines: z.array(journalLineSchema).min(2, 'A journal entry needs at least 2 lines')
})

module.exports = { accountSchema, journalLineSchema, journalSchema }
