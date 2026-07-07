const { ApiError } = require('../helpers/response')

/**
 * Validates req.body / req.query / req.params against a Zod schema and
 * replaces the original with the parsed (coerced + defaulted) result.
 *
 * Usage: router.post('/customers', validate(createCustomerSchema), handler)
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      throw ApiError.badRequest('Validation failed', fieldErrors)
    }
    req[source] = result.data
    next()
  }
}

module.exports = { validate }
