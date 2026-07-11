const { z } = require('zod')

const ipRestrictionSchema = z.object({
  ipAddress: z.string().ip({ version: 'v4' }).or(z.string().regex(/^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/)), // IP or CIDR
  type: z.enum(['allow', 'block']),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true)
})

const updateIpRestrictionSchema = z.object({
  ipAddress: z.string().ip({ version: 'v4' }).or(z.string().regex(/^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/)).optional(),
  type: z.enum(['allow', 'block']).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
})

const securitySettingsSchema = z.object({
  // Session settings
  sessionTimeout: z.number().int().min(5).max(1440).optional(), // minutes
  maxConcurrentSessions: z.number().int().min(1).max(10).optional(),
  
  // Password policy
  passwordMinLength: z.number().int().min(6).max(32).optional(),
  passwordRequireUppercase: z.boolean().optional(),
  passwordRequireLowercase: z.boolean().optional(),
  passwordRequireNumbers: z.boolean().optional(),
  passwordRequireSpecialChars: z.boolean().optional(),
  passwordExpiryDays: z.number().int().min(0).max(365).optional(), // 0 = never
  
  // Account lockout
  maxFailedAttempts: z.number().int().min(3).max(10).optional(),
  lockoutDurationMinutes: z.number().int().min(5).max(1440).optional(),
  
  // IP restrictions
  ipRestrictionEnabled: z.boolean().optional(),
  ipWhitelistMode: z.boolean().optional(), // true = whitelist only, false = blacklist
  
  // Two-factor authentication
  require2faForAdmins: z.boolean().optional(),
  require2faForAll: z.boolean().optional(),
  
  // Other settings
  allowMultipleDevices: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  loginNotifications: z.boolean().optional()
})

module.exports = {
  ipRestrictionSchema,
  updateIpRestrictionSchema,
  securitySettingsSchema
}
