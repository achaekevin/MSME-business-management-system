/**
 * Wraps an async Express route handler so rejected promises are forwarded
 * to the centralized errorHandler middleware instead of crashing the process.
 *
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = asyncHandler
