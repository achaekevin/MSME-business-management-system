const bcrypt = require('bcryptjs')
const { authenticator } = require('otplib')
const dayjs = require('dayjs')
const { prisma } = require('../../config/database')
const appConfig = require('../../config/app')
const { ApiError } = require('../../helpers/response')
const { SYSTEM_ROLES, ROLE_PERMISSIONS } = require('../../constants/permissions')
const { EVENTS } = require('../../constants')
const tokenService = require('./token.service')
const emailQueue = require('../../queues/email.queue')
const { emitToUser } = require('../../config/socket')

// ---------------------------------------------------------------------------
// Registration — creates Business + Owner User + default Roles + Subscription
// in a single transaction so a half-created tenant can never exist.
// ---------------------------------------------------------------------------
async function registerBusiness({ businessName, ownerName, email, phone, password, currency, timezone }) {
  const existing = await prisma.user.findFirst({ where: { email } })
  if (existing) throw ApiError.conflict('An account with this email already exists')

  const passwordHash = await bcrypt.hash(password, appConfig.bcrypt.saltRounds)
  const slug = slugify(businessName)

  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: businessName,
        slug,
        email,
        phone,
        currency,
        timezone,
        trialEndsAt: dayjs().add(14, 'day').toDate()
      }
    })

    // Seed default roles for this business with their permission sets
    const allPermissions = await tx.permission.findMany()
    const permissionByKey = Object.fromEntries(allPermissions.map((p) => [p.key, p.id]))

    const roleRecords = {}
    for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await tx.role.create({
        data: {
          businessId: business.id,
          name: roleName,
          isSystem: true,
          permissions: {
            create: permissionKeys
              .filter((key) => permissionByKey[key])
              .map((key) => ({ permissionId: permissionByKey[key] }))
          }
        }
      })
      roleRecords[roleName] = role
    }

    const headquarters = await tx.branch.create({
      data: { businessId: business.id, name: 'Head Office', code: 'HQ', isHeadquarters: true }
    })

    const owner = await tx.user.create({
      data: {
        businessId: business.id,
        branchId: headquarters.id,
        name: ownerName,
        email,
        phone,
        passwordHash,
        isOwner: true,
        roleId: roleRecords[SYSTEM_ROLES.OWNER].id,
        status: 'active'
      }
    })

    await tx.subscription.create({
      data: {
        businessId: business.id,
        planId: 'starter',
        planName: 'Starter (Trial)',
        status: 'trial',
        currentPeriodEnd: dayjs().add(14, 'day').toDate(),
        limits: { branches: 1, users: 3, products: 1000 }
      }
    })

    await tx.businessSetting.create({ data: { businessId: business.id } })

    return { business, owner, branch: headquarters }
  })

  const accessToken = tokenService.signAccessToken(result.owner, result.branch.id)
  const refreshToken = tokenService.signRefreshToken(result.owner)
  await persistRefreshToken(result.owner.id, refreshToken)

  await emailQueue.add('send-welcome-email', { userId: result.owner.id, email, name: ownerName })

  return {
    user: sanitizeUser(result.owner),
    business: result.business,
    token: accessToken,
    refreshToken
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
async function login({ email, password, rememberMe }, requestMeta = {}) {
  const user = await prisma.user.findFirst({
    where: { email },
    include: { 
      business: true, 
      role: { 
        include: { 
          permissions: { 
            include: { permission: true } 
          } 
        } 
      } 
    }
  })

  if (!user) throw ApiError.unauthorized('Invalid email or password')

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000)
    throw ApiError.forbidden(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`)
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash)
  if (!passwordValid) {
    await handleFailedLogin(user)
    throw ApiError.unauthorized('Invalid email or password')
  }

  if (!user.isActive || user.status !== 'active') throw ApiError.forbidden('Your account has been suspended')
  if (!user.business.isActive) throw ApiError.forbidden('This business account is inactive')

  // Reset failed-attempt counter on success
  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } })
  }

  if (user.twoFactorEnabled) {
    return { requiresTwoFactor: true, userId: user.id }
  }

  return completeLogin(user, rememberMe, requestMeta)
}

async function handleFailedLogin(user) {
  const attempts = user.failedLoginAttempts + 1
  const shouldLock = attempts >= appConfig.account.maxFailedLoginAttempts

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: attempts,
      lockedUntil: shouldLock
        ? dayjs().add(appConfig.account.lockoutDurationMinutes, 'minute').toDate()
        : undefined
    }
  })
}

async function completeLogin(user, rememberMe, requestMeta) {
  const accessToken = tokenService.signAccessToken(user)
  const refreshToken = tokenService.signRefreshToken(user, rememberMe)

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      deviceName: requestMeta.deviceName || 'Unknown device',
      deviceType: requestMeta.deviceType || 'desktop',
      ipAddress: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      expiresAt: dayjs().add(rememberMe ? 90 : 30, 'day').toDate()
    }
  })

  await persistRefreshToken(user.id, refreshToken, session.id)
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastLoginIp: requestMeta.ip } })

  return { user: sanitizeUser(user), token: accessToken, refreshToken }
}

// ---------------------------------------------------------------------------
// Two-Factor Authentication
// ---------------------------------------------------------------------------
async function verifyTwoFactor({ userId, code }, requestMeta = {}) {
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { 
      business: true, 
      role: { 
        include: { 
          permissions: { 
            include: { permission: true } 
          } 
        } 
      } 
    } 
  })
  if (!user) throw ApiError.unauthorized('Invalid session')

  const isValid = authenticator.check(code, user.twoFactorSecret)
  if (!isValid) throw ApiError.unauthorized('Invalid or expired code')

  return completeLogin(user, false, requestMeta)
}

async function enableTwoFactor(userId) {
  const secret = authenticator.generateSecret()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const otpauthUrl = authenticator.keyuri(user.email, appConfig.appName, secret)

  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } })

  return { secret, otpauthUrl } // controller renders this as a QR code
}

async function confirmTwoFactor(userId, code) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const isValid = authenticator.check(code, user.twoFactorSecret)
  if (!isValid) throw ApiError.badRequest('Invalid verification code')

  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } })
  return { enabled: true }
}

async function disableTwoFactor(userId, password) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw ApiError.unauthorized('Incorrect password')

  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
  return { enabled: false }
}

// ---------------------------------------------------------------------------
// Token refresh & logout
// ---------------------------------------------------------------------------
async function persistRefreshToken(userId, token, sessionId = null) {
  const tokenHash = tokenService.hashToken(token)
  const decoded = require('jsonwebtoken').decode(token)
  await prisma.refreshToken.create({
    data: { userId, tokenHash, sessionId, expiresAt: new Date(decoded.exp * 1000) }
  })
}

async function refreshAccessToken(refreshToken) {
  let payload
  try {
    payload = tokenService.verifyRefreshToken(refreshToken)
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token')
  }

  const tokenHash = tokenService.hashToken(refreshToken)
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is no longer valid')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer active')

  const newAccessToken = tokenService.signAccessToken(user)
  return { token: newAccessToken }
}

async function logout(userId, refreshToken) {
  if (refreshToken) {
    const tokenHash = tokenService.hashToken(refreshToken)
    await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } })
  }
  return { loggedOut: true }
}

async function getSessions(userId) {
  return prisma.session.findMany({ where: { userId }, orderBy: { lastActiveAt: 'desc' } })
}

async function revokeSession(userId, sessionId) {
  const session = await prisma.session.findFirst({ where: { id: sessionId, userId } })
  if (!session) throw ApiError.notFound('Session not found')

  await prisma.$transaction([
    prisma.session.delete({ where: { id: sessionId } }),
    prisma.refreshToken.updateMany({ where: { sessionId }, data: { revoked: true } })
  ])
  return { revoked: true }
}

// ---------------------------------------------------------------------------
// Password reset / change / email verification
// ---------------------------------------------------------------------------
async function forgotPassword(email) {
  const user = await prisma.user.findFirst({ where: { email } })
  // Always respond success even if user not found — avoid account enumeration
  if (!user) return { sent: true }

  const rawToken = tokenService.generateSecureToken()
  const tokenHash = tokenService.hashToken(rawToken)

  await prisma.passwordReset.create({
    data: { userId: user.id, tokenHash, expiresAt: dayjs().add(1, 'hour').toDate() }
  })

  await emailQueue.add('send-password-reset', { email: user.email, name: user.name, token: rawToken })
  return { sent: true }
}

async function resetPassword(token, newPassword) {
  const tokenHash = tokenService.hashToken(token)
  const resetRecord = await prisma.passwordReset.findUnique({ where: { tokenHash } })

  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
    throw ApiError.badRequest('Reset link is invalid or has expired')
  }

  const passwordHash = await bcrypt.hash(newPassword, appConfig.bcrypt.saltRounds)

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: resetRecord.id }, data: { usedAt: new Date() } }),
    // Revoke all existing sessions/refresh tokens as a security measure
    prisma.refreshToken.updateMany({ where: { userId: resetRecord.userId }, data: { revoked: true } })
  ])

  return { reset: true }
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw ApiError.unauthorized('Current password is incorrect')

  const passwordHash = await bcrypt.hash(newPassword, appConfig.bcrypt.saltRounds)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  return { changed: true }
}

async function sendVerificationEmail(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const token = tokenService.generateSecureToken()

  await prisma.otpCode.create({
    data: { userId, code: token, purpose: 'verify_email', expiresAt: dayjs().add(24, 'hour').toDate() }
  })

  await emailQueue.add('send-verification-email', { email: user.email, name: user.name, token })
  return { sent: true }
}

async function verifyEmail(token) {
  const record = await prisma.otpCode.findFirst({
    where: { code: token, purpose: 'verify_email', usedAt: null, expiresAt: { gt: new Date() } }
  })
  if (!record) throw ApiError.badRequest('Verification link is invalid or has expired')

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.otpCode.update({ where: { id: record.id }, data: { usedAt: new Date() } })
  ])
  return { verified: true }
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------
async function acceptInvitation(token, password) {
  const user = await prisma.user.findFirst({
    where: { invitationToken: token, invitationExpiresAt: { gt: new Date() }, status: 'pending' }
  })
  if (!user) throw ApiError.badRequest('Invitation is invalid or has expired')

  const passwordHash = await bcrypt.hash(password, appConfig.bcrypt.saltRounds)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: 'active',
      invitationToken: null,
      invitationExpiresAt: null,
      emailVerifiedAt: new Date()
    },
    include: { business: true, role: true }
  })

  return completeLogin(updated, false, {})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sanitizeUser(user) {
  const { passwordHash, twoFactorSecret, ...safe } = user
  
  // Add permissions array from role
  if (user.role && user.role.permissions) {
    safe.permissions = user.role.permissions.map(rp => rp.permission.key)
  } else {
    safe.permissions = []
  }
  
  return safe
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}

module.exports = {
  registerBusiness,
  login,
  verifyTwoFactor,
  enableTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  refreshAccessToken,
  logout,
  getSessions,
  revokeSession,
  forgotPassword,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
  acceptInvitation,
  sanitizeUser
}
