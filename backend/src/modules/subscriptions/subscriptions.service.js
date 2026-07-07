const repo = require('./subscriptions.repository')
const { ApiError } = require('../../helpers/response')
const { invalidateTenantCache } = require('../../config/redis')
const dayjs = require('dayjs')

const PLANS = {
  starter:    { id: 'starter',    name: 'Starter',    price: 29,  limits: { branches: 1,  users: 3,   products: 1000  }, features: ['1 branch', '3 users', '1,000 products', 'Basic reports', 'Email support'] },
  growth:     { id: 'growth',     name: 'Growth',     price: 79,  limits: { branches: 5,  users: 15,  products: 10000 }, features: ['5 branches', '15 users', '10,000 products', 'Advanced reports', 'Priority support', 'API access'] },
  enterprise: { id: 'enterprise', name: 'Enterprise', price: 199, limits: { branches: -1, users: -1,  products: -1    }, features: ['Unlimited branches', 'Unlimited users', 'Unlimited products', 'Custom reports', 'Dedicated support', 'SLA'] }
}

async function getPlans() {
  return Object.values(PLANS)
}

async function getCurrentSubscription(businessId) {
  const sub = await repo.findSubscription(businessId)
  if (!sub) throw ApiError.notFound('No subscription found')
  const plan = PLANS[sub.planId] || {}
  const daysLeft = dayjs(sub.currentPeriodEnd).diff(dayjs(), 'day')
  const isExpired = sub.currentPeriodEnd < new Date() && sub.status !== 'active'
  return { ...sub, plan, daysLeft, isExpired }
}

async function upgradePlan(businessId, planId, req) {
  const plan = PLANS[planId]
  if (!plan) throw ApiError.badRequest('Invalid plan selected')

  const sub = await repo.findSubscription(businessId)
  if (!sub) throw ApiError.notFound('No subscription found')
  if (sub.planId === planId && sub.status === 'active') throw ApiError.conflict('You are already on this plan')

  const newPeriodEnd = dayjs().add(30, 'day').toDate()
  const [subscription] = await Promise.all([
    repo.updateSubscription(businessId, {
      planId, planName: plan.name, status: 'active',
      currentPeriodStart: new Date(), currentPeriodEnd: newPeriodEnd,
      features: plan.features, limits: plan.limits
    }),
    repo.createBillingRecord(sub.id, plan.price, 'USD', 'paid')
  ])

  await invalidateTenantCache(businessId, 'subscription')
  req?.audit?.('subscription.upgraded', 'Subscription', sub.id, { from: sub.planId, to: planId })
  return { ...subscription, plan }
}

async function cancelSubscription(businessId, req) {
  const sub = await repo.findSubscription(businessId)
  if (!sub) throw ApiError.notFound('No subscription found')
  if (sub.status === 'cancelled') throw ApiError.conflict('Subscription is already cancelled')

  const updated = await repo.updateSubscription(businessId, { cancelAtPeriodEnd: true })
  req?.audit?.('subscription.cancelled', 'Subscription', sub.id)
  return {
    ...updated,
    message: `Your subscription will remain active until ${dayjs(sub.currentPeriodEnd).format('MMMM D, YYYY')}`
  }
}

async function getBillingHistory(businessId) {
  const sub = await repo.findSubscription(businessId)
  if (!sub) throw ApiError.notFound('No subscription found')
  return repo.findBillingHistory(sub.id)
}

async function getPaymentMethods(businessId) {
  const sub = await repo.findSubscription(businessId)
  if (!sub) return []
  return repo.findPaymentMethods(sub.id)
}

async function addPaymentMethod(businessId, data) {
  const sub = await repo.findSubscription(businessId)
  if (!sub) throw ApiError.notFound('No subscription found')
  if (data.isDefault) await repo.clearDefaultPaymentMethods(sub.id)
  return repo.createPaymentMethod(sub.id, data.type, data.last4, data.brand, data.isDefault)
}

async function removePaymentMethod(businessId, methodId) {
  const sub = await repo.findSubscription(businessId)
  if (!sub) throw ApiError.notFound('No subscription found')
  const method = await repo.findPaymentMethodById(methodId, sub.id)
  if (!method) throw ApiError.notFound('Payment method not found')
  if (method.isDefault) throw ApiError.badRequest('Cannot remove the default payment method. Set another as default first.')
  await repo.deletePaymentMethod(methodId)
  return { deleted: true }
}

async function checkAndRenewExpiring() {
  const expiring = await repo.findExpiringSubscriptions()
  const results = []
  for (const sub of expiring) {
    const plan = PLANS[sub.planId]
    if (!plan) continue
    const newEnd = dayjs(sub.currentPeriodEnd).add(30, 'day').toDate()
    await repo.updateSubscription(sub.businessId, { currentPeriodStart: new Date(), currentPeriodEnd: newEnd })
    await repo.createBillingRecord(sub.id, plan.price, 'USD', 'paid')
    results.push({ subscriptionId: sub.id, businessId: sub.businessId, renewedTo: newEnd })
  }
  return results
}

module.exports = {
  getPlans, getCurrentSubscription, upgradePlan, cancelSubscription,
  getBillingHistory, getPaymentMethods, addPaymentMethod, removePaymentMethod,
  checkAndRenewExpiring, PLANS
}
