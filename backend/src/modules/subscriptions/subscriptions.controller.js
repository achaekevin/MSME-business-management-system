const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, noContent } = require('../../helpers/response')
const service = require('./subscriptions.service')

const getPlans = asyncHandler(async (_req, res) => {
  success(res, await service.getPlans())
})

const getCurrent = asyncHandler(async (req, res) => {
  success(res, await service.getCurrentSubscription(req.businessId))
})

const upgrade = asyncHandler(async (req, res) => {
  success(res, await service.upgradePlan(req.businessId, req.body.planId, req), 'Plan upgraded successfully')
})

const cancel = asyncHandler(async (req, res) => {
  success(res, await service.cancelSubscription(req.businessId, req), 'Subscription will be cancelled at period end')
})

const billing = asyncHandler(async (req, res) => {
  success(res, await service.getBillingHistory(req.businessId))
})

const listPaymentMethods = asyncHandler(async (req, res) => {
  success(res, await service.getPaymentMethods(req.businessId))
})

const addPaymentMethod = asyncHandler(async (req, res) => {
  created(res, await service.addPaymentMethod(req.businessId, req.body), 'Payment method added')
})

const removePaymentMethod = asyncHandler(async (req, res) => {
  await service.removePaymentMethod(req.businessId, req.params.id)
  noContent(res)
})

module.exports = {
  getPlans, getCurrent, upgrade, cancel, billing,
  listPaymentMethods, addPaymentMethod, removePaymentMethod
}
