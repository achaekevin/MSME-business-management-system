const rateLimit = require('express-rate-limit')
const appConfig = require('../config/app')

const isDevelopment = process.env.NODE_ENV !== 'production'

// General API limiter — generous, prevents abuse without hurting normal usage
const apiLimiter = isDevelopment 
  ? (req, res, next) => next() // Bypass in development
  : rateLimit({
      windowMs: appConfig.rateLimit.windowMs,
      max: appConfig.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
      keyGenerator: (req) => req.businessId || req.ip
    })

// Strict limiter for auth endpoints — guards against credential stuffing/brute force
const authLimiter = isDevelopment
  ? (req, res, next) => next() // Bypass in development
  : rateLimit({
      windowMs: appConfig.rateLimit.windowMs,
      max: appConfig.rateLimit.authMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many authentication attempts, please try again later.' },
      skipSuccessfulRequests: true
    })

// Very strict limiter for password reset / OTP requests
const otpLimiter = isDevelopment
  ? (req, res, next) => next() // Bypass in development
  : rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 5,
      message: { success: false, message: 'Too many OTP requests, please wait before retrying.' }
    })

module.exports = { apiLimiter, authLimiter, otpLimiter }
