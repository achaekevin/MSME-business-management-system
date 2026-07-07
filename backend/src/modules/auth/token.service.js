const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const appConfig = require('../../config/app')

function signAccessToken(user, branchId = null) {
  return jwt.sign(
    {
      sub: user.id,
      businessId: user.businessId,
      branchId: branchId || user.branchId,
      roleId: user.roleId
    },
    appConfig.jwt.accessSecret,
    { expiresIn: appConfig.jwt.accessExpiresIn }
  )
}

function signRefreshToken(user, rememberMe = false) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    appConfig.jwt.refreshSecret,
    { expiresIn: rememberMe ? appConfig.jwt.rememberMeExpiresIn : appConfig.jwt.refreshExpiresIn }
  )
}

function verifyRefreshToken(token) {
  return jwt.verify(token, appConfig.jwt.refreshSecret)
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

function generateOtp(length = 6) {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) otp += digits[crypto.randomInt(0, 10)]
  return otp
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateSecureToken,
  generateOtp
}
