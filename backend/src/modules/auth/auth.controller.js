const asyncHandler = require('../../helpers/asyncHandler')
const { success, created } = require('../../helpers/response')
const authService = require('./auth.service')

function getRequestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    deviceType: /mobile/i.test(req.headers['user-agent'] || '') ? 'mobile' : 'desktop',
    deviceName: req.headers['user-agent']?.split(')')[0]?.split('(')[1] || 'Unknown device'
  }
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerBusiness(req.body)
  created(res, result, 'Business registered successfully')
})

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, getRequestMeta(req))
  success(res, result, 'Login successful')
})

const verifyTwoFactor = asyncHandler(async (req, res) => {
  const result = await authService.verifyTwoFactor(req.body, getRequestMeta(req))
  success(res, result, 'Verified successfully')
})

const enable2fa = asyncHandler(async (req, res) => {
  const result = await authService.enableTwoFactor(req.userId)
  success(res, result, 'Scan the QR code with your authenticator app')
})

const confirm2fa = asyncHandler(async (req, res) => {
  const result = await authService.confirmTwoFactor(req.userId, req.body.code)
  success(res, result, 'Two-factor authentication enabled')
})

const disable2fa = asyncHandler(async (req, res) => {
  const result = await authService.disableTwoFactor(req.userId, req.body.password)
  success(res, result, 'Two-factor authentication disabled')
})

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken)
  success(res, result, 'Token refreshed')
})

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.userId, req.body.refreshToken)
  success(res, result, 'Logged out successfully')
})

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getSessions(req.userId)
  success(res, sessions)
})

const revokeSession = asyncHandler(async (req, res) => {
  const result = await authService.revokeSession(req.userId, req.params.id)
  success(res, result, 'Session revoked')
})

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email)
  success(res, result, 'If an account exists with this email, a reset link has been sent')
})

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body.token, req.body.password)
  success(res, result, 'Password reset successfully')
})

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.userId, req.body.currentPassword, req.body.newPassword)
  success(res, result, 'Password changed successfully')
})

const sendVerification = asyncHandler(async (req, res) => {
  const result = await authService.sendVerificationEmail(req.userId)
  success(res, result, 'Verification email sent')
})

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.token)
  success(res, result, 'Email verified successfully')
})

const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await authService.acceptInvitation(req.body.token, req.body.password)
  success(res, result, 'Welcome aboard!')
})

const me = asyncHandler(async (req, res) => {
  const userResponse = authService.sanitizeUser(req.user)
  success(res, userResponse)
})

module.exports = {
  register,
  login,
  verifyTwoFactor,
  enable2fa,
  confirm2fa,
  disable2fa,
  refresh,
  logout,
  getSessions,
  revokeSession,
  forgotPassword,
  resetPassword,
  changePassword,
  sendVerification,
  verifyEmail,
  acceptInvitation,
  me
}
