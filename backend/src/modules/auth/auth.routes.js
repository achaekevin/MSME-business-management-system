const express = require('express')
const router = express.Router()
const controller = require('./auth.controller')
const validators = require('./auth.validators')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { authLimiter, otpLimiter } = require('../../middleware/rateLimiter')

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication, sessions, and account security
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new business and owner account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Business and owner account created
 */
router.post('/register', authLimiter, validate(validators.registerSchema), controller.register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate with email and password
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns access/refresh tokens, or requiresTwoFactor=true
 */
router.post('/login', authLimiter, validate(validators.loginSchema), controller.login)

router.post('/2fa/verify', authLimiter, validate(validators.verify2faSchema), controller.verifyTwoFactor)
router.post('/2fa/enable', authenticate, controller.enable2fa)
router.post('/2fa/confirm', authenticate, controller.confirm2fa)
router.post('/2fa/disable', authenticate, validate(validators.disable2faSchema), controller.disable2fa)

router.post('/refresh', validate(validators.refreshTokenSchema), controller.refresh)
router.post('/logout', authenticate, controller.logout)

router.get('/sessions', authenticate, controller.getSessions)
router.delete('/sessions/:id', authenticate, controller.revokeSession)

router.post('/forgot-password', otpLimiter, validate(validators.forgotPasswordSchema), controller.forgotPassword)
router.post('/reset-password', authLimiter, validate(validators.resetPasswordSchema), controller.resetPassword)
router.post('/change-password', authenticate, validate(validators.changePasswordSchema), controller.changePassword)

router.post('/send-verification', authenticate, otpLimiter, controller.sendVerification)
router.post('/verify-email', validate(validators.verifyEmailSchema), controller.verifyEmail)

router.post('/invitation/accept', authLimiter, validate(validators.acceptInvitationSchema), controller.acceptInvitation)

router.get('/me', authenticate, controller.me)

module.exports = router
