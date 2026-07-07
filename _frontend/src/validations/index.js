import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Your name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(v => v, 'You must accept the terms')
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address')
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// Address schema
const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional()
})

// Customer schema
export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  type: z.enum(['individual', 'business']),
  groupId: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  address: addressSchema.optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
})

// Supplier schema
export const supplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  taxNumber: z.string().optional(),
  paymentTerms: z.number().min(0).max(365),
  address: addressSchema.optional()
})

// Product schema
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Select a category'),
  unitId: z.string().min(1, 'Select a unit'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  barcode: z.string().optional(),
  trackInventory: z.boolean(),
  reorderPoint: z.number().min(0).optional()
})

// Sale schema
export const saleSchema = z.object({
  customerId: z.string().optional(),
  branchId: z.string().min(1, 'Select a branch'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
    discount: z.number().min(0),
    tax: z.number().min(0)
  })).min(1, 'Add at least one item'),
  discount: z.number().min(0).optional(),
  notes: z.string().optional()
})

// Invoice schema
export const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
    discount: z.number().min(0),
    tax: z.number().min(0)
  })).min(1, 'Add at least one item'),
  notes: z.string().optional()
})

// Purchase schema
export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Select a supplier'),
  expectedDate: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0)
  })).min(1, 'Add at least one item'),
  notes: z.string().optional()
})

// Employee schema
export const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Select a department'),
  positionId: z.string().min(1, 'Select a position'),
  salary: z.number().min(0, 'Salary cannot be negative'),
  salaryType: z.enum(['monthly', 'weekly', 'daily', 'hourly']),
  joinDate: z.string().min(1, 'Join date is required')
})

// Expense schema
export const expenseSchema = z.object({
  category: z.string().min(1, 'Select a category'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque', 'credit']),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional()
})

// Settings schema
export const businessSettingsSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  currency: z.string().min(3),
  timezone: z.string().min(1),
  address: addressSchema
})

// User invite schema
export const userInviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().min(1, 'Select a role'),
  branchId: z.string().optional()
})
