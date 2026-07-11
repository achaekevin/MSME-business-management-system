const repo = require('./security.repository')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')

// Login History
async function getLoginHistory(userId, query) {
  const { page, limit, skip } = parsePagination(query)
  const { status, startDate, endDate } = query

  const filters = { userId }
  
  if (status) filters.status = status
  if (startDate || endDate) {
    filters.createdAt = {}
    if (startDate) filters.createdAt.gte = new Date(startDate)
    if (endDate) filters.createdAt.lte = new Date(endDate)
  }

  if (page) {
    const [items, total] = await Promise.all([
      repo.getLoginAttempts(filters, skip, limit),
      repo.countLoginAttempts(filters)
    ])
    return { items, total, page, limit }
  }

  return await repo.getLoginAttempts(filters)
}

// Device Management
async function getUserDevices(userId) {
  return await repo.getUserDevices(userId)
}

async function revokeDevice(userId, deviceId, req) {
  const device = await repo.findDeviceById(deviceId, userId)
  if (!device) throw ApiError.notFound('Device not found')

  await repo.revokeDevice(deviceId)
  req?.audit?.('security.device_revoked', 'Session', deviceId, { userId })
}

async function trustDevice(userId, deviceId, req) {
  const device = await repo.findDeviceById(deviceId, userId)
  if (!device) throw ApiError.notFound('Device not found')

  const updated = await repo.updateDevice(deviceId, { isTrusted: true })
  req?.audit?.('security.device_trusted', 'Session', deviceId, { userId })
  return updated
}

// IP Restrictions
async function getIpRestrictions(businessId) {
  return await repo.getIpRestrictions(businessId)
}

async function addIpRestriction(businessId, data, req) {
  const restriction = await repo.createIpRestriction(businessId, data)
  req?.audit?.('security.ip_restriction_added', 'IpRestriction', restriction.id, { data })
  return restriction
}

async function updateIpRestriction(businessId, restrictionId, data, req) {
  const restriction = await repo.findIpRestriction(businessId, restrictionId)
  if (!restriction) throw ApiError.notFound('IP restriction not found')

  const updated = await repo.updateIpRestriction(restrictionId, data)
  req?.audit?.('security.ip_restriction_updated', 'IpRestriction', restrictionId, { changes: data })
  return updated
}

async function deleteIpRestriction(businessId, restrictionId, req) {
  const restriction = await repo.findIpRestriction(businessId, restrictionId)
  if (!restriction) throw ApiError.notFound('IP restriction not found')

  await repo.deleteIpRestriction(restrictionId)
  req?.audit?.('security.ip_restriction_deleted', 'IpRestriction', restrictionId)
}

// Activity Logs
async function getUserActivity(userId, query) {
  const { page, limit, skip } = parsePagination(query)
  const { action, startDate, endDate } = query

  const filters = { userId }
  
  if (action) filters.action = { contains: action }
  if (startDate || endDate) {
    filters.createdAt = {}
    if (startDate) filters.createdAt.gte = new Date(startDate)
    if (endDate) filters.createdAt.lte = new Date(endDate)
  }

  const [items, total] = await Promise.all([
    repo.getAuditLogs(filters, skip, limit),
    repo.countAuditLogs(filters)
  ])

  return { items, total, page, limit }
}

async function exportActivity(businessId, query) {
  const { userId, startDate, endDate, action } = query
  
  const filters = { businessId }
  if (userId) filters.userId = userId
  if (action) filters.action = { contains: action }
  if (startDate || endDate) {
    filters.createdAt = {}
    if (startDate) filters.createdAt.gte = new Date(startDate)
    if (endDate) filters.createdAt.lte = new Date(endDate)
  }

  const logs = await repo.getAuditLogs(filters, 0, 10000) // Max 10k records
  
  // Convert to CSV
  const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address', 'Details']
  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.user?.name || 'System',
    log.action,
    log.entity,
    log.entityId || '',
    log.ipAddress || '',
    JSON.stringify(log.metadata || {})
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csv
}

// Security Settings
async function getSecuritySettings(businessId) {
  let settings = await repo.getSecuritySettings(businessId)
  
  if (!settings) {
    // Return default settings
    settings = getDefaultSecuritySettings()
  }

  return settings
}

async function updateSecuritySettings(businessId, data, req) {
  const settings = await repo.upsertSecuritySettings(businessId, data)
  req?.audit?.('security.settings_updated', 'BusinessSetting', businessId, { changes: data })
  return settings
}

function getDefaultSecuritySettings() {
  return {
    sessionTimeout: 60, // minutes
    maxConcurrentSessions: 5,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordExpiryDays: 90,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30,
    ipRestrictionEnabled: false,
    ipWhitelistMode: false,
    require2faForAdmins: false,
    require2faForAll: false,
    allowMultipleDevices: true,
    requireEmailVerification: true,
    loginNotifications: true
  }
}

// Failed Logins
async function getFailedLogins(businessId, query) {
  const { page, limit, skip } = parsePagination(query)
  const { email, startDate, endDate } = query

  const filters = { 
    business: { id: businessId },
    status: 'failed'
  }
  
  if (email) filters.email = { contains: email }
  if (startDate || endDate) {
    filters.createdAt = {}
    if (startDate) filters.createdAt.gte = new Date(startDate)
    if (endDate) filters.createdAt.lte = new Date(endDate)
  }

  const [items, total] = await Promise.all([
    repo.getLoginAttempts(filters, skip, limit),
    repo.countLoginAttempts(filters)
  ])

  return { items, total, page, limit }
}

async function unlockUser(businessId, userId, req) {
  const user = await repo.findUserById(businessId, userId)
  if (!user) throw ApiError.notFound('User not found')

  const updated = await repo.unlockUser(userId)
  req?.audit?.('security.user_unlocked', 'User', userId, { unlockedBy: req.userId })
  return updated
}

// Helper: Check if IP is allowed
async function isIpAllowed(businessId, ipAddress) {
  const restrictions = await repo.getIpRestrictions(businessId)
  if (!restrictions || restrictions.length === 0) return true

  const settings = await getSecuritySettings(businessId)
  if (!settings.ipRestrictionEnabled) return true

  const activeRestrictions = restrictions.filter(r => r.isActive)
  
  if (settings.ipWhitelistMode) {
    // Whitelist mode: IP must be in allow list
    return activeRestrictions.some(r => r.type === 'allow' && matchesIp(ipAddress, r.ipAddress))
  } else {
    // Blacklist mode: IP must not be in block list
    return !activeRestrictions.some(r => r.type === 'block' && matchesIp(ipAddress, r.ipAddress))
  }
}

function matchesIp(ip, pattern) {
  if (pattern.includes('/')) {
    // CIDR notation - simple implementation
    return ip.startsWith(pattern.split('/')[0].split('.').slice(0, 3).join('.'))
  }
  return ip === pattern
}

module.exports = {
  getLoginHistory,
  getUserDevices,
  revokeDevice,
  trustDevice,
  getIpRestrictions,
  addIpRestriction,
  updateIpRestriction,
  deleteIpRestriction,
  getUserActivity,
  exportActivity,
  getSecuritySettings,
  updateSecuritySettings,
  getFailedLogins,
  unlockUser,
  isIpAllowed
}
