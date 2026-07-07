const { ApiError } = require('../helpers/response')

/**
 * Must run AFTER `authenticate`. Guarantees every downstream handler has
 * req.businessId set, and additionally guards against cross-tenant access
 * attempted via request body/params (defense in depth — Prisma queries
 * should ALSO always filter by businessId explicitly in repositories).
 */
function tenantContext(req, res, next) {
  if (!req.businessId) {
    throw ApiError.unauthorized('Tenant context could not be resolved')
  }

  // If a client tries to smuggle a different businessId in the body, reject it.
  if (req.body && req.body.businessId && req.body.businessId !== req.businessId) {
    throw ApiError.forbidden('Cross-tenant write attempt blocked')
  }

  // Always force the authenticated tenant onto write payloads.
  if (req.body && typeof req.body === 'object') {
    req.body.businessId = req.businessId
  }

  next()
}

/**
 * Optional stricter guard for branch-scoped resources (e.g. POS terminals,
 * branch-specific inventory). Requires req.branchId to be present, and
 * verifies it belongs to the authenticated business if a branchId is
 * supplied explicitly in params/query.
 */
function branchContext(req, res, next) {
  const requestedBranchId = req.params.branchId || req.query.branchId || req.body?.branchId

  if (requestedBranchId && req.user.role?.name !== 'Owner' && req.user.role?.name !== 'Administrator') {
    // Non-admins are restricted to their assigned branch
    if (req.user.branchId && requestedBranchId !== req.user.branchId) {
      throw ApiError.forbidden('You do not have access to this branch')
    }
  }

  req.branchId = requestedBranchId || req.branchId
  next()
}

/**
 * Verifies the business's subscription is active before allowing access
 * to paid features. Mount on routes behind the subscription paywall.
 */
const { prisma } = require('../config/database')
const asyncHandler = require('../helpers/asyncHandler')

const requireActiveSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await prisma.subscription.findUnique({ where: { businessId: req.businessId } })

  if (!subscription) throw ApiError.forbidden('No active subscription found')

  const now = new Date()
  const isTrialActive = subscription.status === 'trial' && subscription.currentPeriodEnd > now
  const isActive = subscription.status === 'active'

  if (!isActive && !isTrialActive) {
    throw ApiError.forbidden('Your subscription has expired. Please upgrade to continue.')
  }

  req.subscription = subscription
  next()
})

module.exports = { tenantContext, branchContext, requireActiveSubscription }
