const jwt = require('jsonwebtoken')
const appConfig = require('../config/app')
const { prisma } = require('../config/database')
const { ApiError } = require('../helpers/response')
const asyncHandler = require('../helpers/asyncHandler')

/**
 * Verifies the access token and attaches `req.user` and tenant context.
 * Token payload shape: { sub: userId, businessId, branchId, roleId }
 *
 * This is the ONLY place a request's identity is established — every
 * downstream module trusts req.user / req.businessId rather than re-deriving it.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token missing')
  }

  const token = header.split(' ')[1]
  let payload
  try {
    payload = jwt.verify(token, appConfig.jwt.accessSecret)
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: { include: { permissions: { include: { permission: true } } } }, business: true }
  })

  if (!user) throw ApiError.unauthorized('User no longer exists')
  if (!user.isActive || user.status !== 'active') throw ApiError.forbidden('Account is suspended')
  if (!user.business.isActive) throw ApiError.forbidden('Business account is inactive')

  // Attach identity + tenant context for downstream middleware/controllers
  req.user = user
  req.userId = user.id
  req.businessId = user.businessId
  req.branchId = payload.branchId || user.branchId || null
  req.permissions = user.isOwner
    ? null // owners bypass permission checks entirely (null = wildcard)
    : (user.role?.permissions || []).map((rp) => rp.permission.key)

  next()
})

/**
 * Optional auth — attaches req.user if a valid token is present, but doesn't
 * reject the request otherwise. Useful for public/semi-public endpoints.
 */
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return next()

  try {
    const token = header.split(' ')[1]
    const payload = jwt.verify(token, appConfig.jwt.accessSecret)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (user) {
      req.user = user
      req.userId = user.id
      req.businessId = user.businessId
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next()
})

module.exports = { authenticate, optionalAuthenticate }
