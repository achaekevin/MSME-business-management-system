const asyncHandler = require('../../helpers/asyncHandler')
const { success, paginated, noContent } = require('../../helpers/response')
const service = require('./payments.service')

const list = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listPayments(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const getOne = asyncHandler(async (req, res) => {
  success(res, await service.getPayment(req.businessId, req.params.id))
})

const remove = asyncHandler(async (req, res) => {
  await service.deletePayment(req.businessId, req.params.id, req)
  noContent(res)
})

const summary = asyncHandler(async (req, res) => {
  success(res, await service.getPaymentSummary(req.businessId, req.query))
})

const mpesaInitiate = asyncHandler(async (req, res) => {
  success(res, await service.initiateMpesaPayment(req.businessId, req.body))
})

const mpesaCallback = asyncHandler(async (req, res) => {
  await service.handleMpesaCallback(req.body)
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

module.exports = { list, getOne, remove, summary, mpesaInitiate, mpesaCallback }
