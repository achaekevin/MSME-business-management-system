const { z } = require('zod')

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  fiscalYearStart: z.string().regex(/^\d{2}-\d{2}$/).optional(), // MM-DD format
  taxNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  type: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional()
})

const businessHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional()
})

const brandingSchema = z.object({
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
  customCss: z.string().optional()
})

const taxSettingsSchema = z.object({
  taxRate: z.coerce.number().min(0).max(100).optional(),
  taxInclusive: z.boolean().optional(),
  taxLabel: z.string().optional(),
  multiTaxEnabled: z.boolean().optional(),
  taxRegions: z.array(z.object({
    name: z.string(),
    rate: z.number().min(0).max(100),
    isDefault: z.boolean().optional()
  })).optional()
})

const settingsSchema = z.object({
  // Tax settings
  taxRate: z.coerce.number().min(0).max(100).optional(),
  taxInclusive: z.boolean().optional(),
  taxLabel: z.string().optional(),
  multiTaxEnabled: z.boolean().optional(),
  taxRegions: z.array(z.any()).optional(),
  
  // Branding
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
  customCss: z.string().optional(),
  
  // Business hours
  businessHours: z.record(z.any()).optional(),
  timezone: z.string().optional(),
  
  // Inventory
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  
  // Other settings
  notificationSettings: z.record(z.any()).optional(),
  appearanceSettings: z.record(z.any()).optional(),
  securitySettings: z.record(z.any()).optional(),
  receiptTemplate: z.string().optional(),
  invoiceTemplate: z.string().optional()
})

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().datetime().or(z.date()),
  recurring: z.boolean().optional(),
  isActive: z.boolean().optional()
})

const updateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().datetime().or(z.date()).optional(),
  recurring: z.boolean().optional(),
  isActive: z.boolean().optional()
})

module.exports = { 
  profileSchema, 
  settingsSchema, 
  brandingSchema,
  taxSettingsSchema,
  businessHoursSchema,
  holidaySchema,
  updateHolidaySchema
}
