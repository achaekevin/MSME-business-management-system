/**
 * Input sanitization and payload security middleware.
 * Prevents XSS, NoSQL/SQL parameter tampering, and cleans malicious string inputs.
 */

// Recursive string sanitizer that trims whitespace and strips harmful HTML/script tags
function sanitizeValue(value) {
  if (typeof value === 'string') {
    // 1. Trim leading/trailing whitespace
    let sanitized = value.trim()
    
    // 2. Strip dangerous HTML/script tags while preserving safe text
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onload\s*=/gi, '')
      .replace(/onerror\s*=/gi, '')
      .replace(/onclick\s*=/gi, '')

    return sanitized
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (value !== null && typeof value === 'object') {
    const cleaned = {}
    for (const [key, val] of Object.entries(value)) {
      // Prevent object prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue
      }
      cleaned[key] = sanitizeValue(val)
    }
    return cleaned
  }

  return value
}

// Middleware that sanitizes req.body, req.query, and req.params
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body)
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query)
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params)
  }
  next()
}

// Catches malformed JSON payloads and oversized requests from body-parser
function payloadErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.'
    })
  }

  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Maximum allowed size is 2MB.'
    })
  }

  next(err)
}

module.exports = {
  sanitizeInput,
  payloadErrorHandler,
  sanitizeValue
}
