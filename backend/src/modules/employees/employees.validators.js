const { z } = require('zod')

const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  employeeNumber: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  salary: z.coerce.number().min(0),
  salaryType: z.enum(['monthly', 'weekly', 'daily', 'hourly']).default('monthly'),
  joinDate: z.string().min(1),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  businessId: z.string().optional()
})

const departmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  businessId: z.string().optional()
})

const positionSchema = z.object({
  title: z.string().min(2),
  departmentId: z.string().uuid(),
  description: z.string().optional(),
  minSalary: z.coerce.number().min(0).optional(),
  maxSalary: z.coerce.number().min(0).optional(),
  businessId: z.string().optional()
})

const attendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().min(1),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'half_day']).default('present'),
  notes: z.string().optional()
})

const leaveSchema = z.object({
  employeeId: z.string().uuid(),
  type: z.enum(['annual', 'sick', 'unpaid', 'maternity', 'paternity']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional()
})

const reviewSchema = z.object({
  period: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comments: z.string().optional()
})

module.exports = {
  employeeSchema, departmentSchema, positionSchema,
  attendanceSchema, leaveSchema, reviewSchema
}
