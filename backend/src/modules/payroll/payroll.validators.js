const { z } = require('zod')

const allowanceDeductionSchema = z.object({
  name: z.string(),
  amount: z.coerce.number().positive(),
  employeeId: z.string().uuid().optional()
})

const processPayrollSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM format'),
  employeeIds: z.array(z.string().uuid()).optional(),
  allowances: z.array(allowanceDeductionSchema).optional().default([]),
  deductions: z.array(allowanceDeductionSchema).optional().default([])
})

module.exports = { processPayrollSchema, allowanceDeductionSchema }
