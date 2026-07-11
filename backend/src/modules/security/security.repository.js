const { prisma } = require('../../config/database')

// Login Attempts / History
function getLoginAttempts(filters, skip = 0, limit = 50) {
  return prisma.loginAttempt.findMany({
    where: filters,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  })
}

function countLoginAttempts(filters) {
  return prisma.loginAttempt.count({ where: filters })
}

function createLoginAttempt(data) {
  return prisma.loginAttempt.create({ data })
}

// Devices (Sessions)
function getUserDevices(userId) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { lastActiveAt: 'desc' }
  })
}

function findDeviceById(deviceId, userId) {
  return prisma.session.findFirst({
    where: { id: deviceId, userId }
  })
}

function revokeDevice(deviceId) {
  return prisma.session.delete({
    where: { id: deviceId }
  })
}

function updateDevice(deviceId, data) {
  return prisma.session.update({
    where: { id: deviceId },
    data
  })
}

// IP Restrictions
function getIpRestrictions(businessId) {
  return prisma.ipRestriction.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' }
  })
}

function createIpRestriction(businessId, data) {
  return prisma.ipRestriction.create({
    data: { businessId, ...data }
  })
}

function findIpRestriction(businessId, restrictionId) {
  return prisma.ipRestriction.findFirst({
    where: { id: restrictionId, businessId }
  })
}

function updateIpRestriction(restrictionId, data) {
  return prisma.ipRestriction.update({
    where: { id: restrictionId },
    data
  })
}

function deleteIpRestriction(restrictionId) {
  return prisma.ipRestriction.delete({
    where: { id: restrictionId }
  })
}

// Audit Logs (Activity)
function getAuditLogs(filters, skip = 0, limit = 50) {
  return prisma.auditLog.findMany({
    where: filters,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  })
}

function countAuditLogs(filters) {
  return prisma.auditLog.count({ where: filters })
}

// Security Settings
function getSecuritySettings(businessId) {
  return prisma.businessSetting.findUnique({
    where: { businessId },
    select: {
      securitySettings: true
    }
  }).then(result => result?.securitySettings)
}

function upsertSecuritySettings(businessId, data) {
  return prisma.businessSetting.upsert({
    where: { businessId },
    create: { businessId, securitySettings: data },
    update: { securitySettings: data }
  }).then(result => result.securitySettings)
}

// User management
function findUserById(businessId, userId) {
  return prisma.user.findFirst({
    where: { id: userId, businessId }
  })
}

function unlockUser(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  })
}

module.exports = {
  getLoginAttempts,
  countLoginAttempts,
  createLoginAttempt,
  getUserDevices,
  findDeviceById,
  revokeDevice,
  updateDevice,
  getIpRestrictions,
  createIpRestriction,
  findIpRestriction,
  updateIpRestriction,
  deleteIpRestriction,
  getAuditLogs,
  countAuditLogs,
  getSecuritySettings,
  upsertSecuritySettings,
  findUserById,
  unlockUser
}
