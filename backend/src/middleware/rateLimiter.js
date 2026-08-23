const rateLimit = require('express-rate-limit')
const appConfig = require('../config/app')

// ── General API limiter — applies across all /api endpoints ─────────────────
const apiLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs || (15 * 60 * 1000), // 15 minutes
  max: appConfig.rateLimit.max || 300, // 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: { 
    success: false, 
    message: 'Too many requests from this IP, please try again later.' 
  },
  keyGenerator: (req) => req.businessId || req.ip
})

// ── Strict auth limiter — Maximum 5 attempts per 15 minutes ──────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: appConfig.rateLimit.authMax || 5, // Exactly 5 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: { 
    success: false, 
    message: 'Too many authentication attempts. Please try again after 15 minutes.' 
  },
  skipSuccessfulRequests: false // Strictly rate limits all authentication attempts
})

// ── Strict OTP / Password reset limiter — Maximum 5 attempts per 15 minutes ──
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: { 
    success: false, 
    message: 'Too many verification / password reset requests, please wait 15 minutes before retrying.' 
  }
})

module.exports = { apiLimiter, authLimiter, otpLimiter }
