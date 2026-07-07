const repo = require('./payments.repository')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')

async function listPayments(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total, aggregate] = await repo.findMany(businessId, {
    skip, take, orderBy,
    method: query.method,
    referenceType: query.referenceType,
    customerId: query.customerId,
    startDate: query.startDate,
    endDate: query.endDate
  })
  return { items, total, page, limit, totalAmount: Number(aggregate._sum.amount || 0) }
}

async function getPayment(businessId, id) {
  const payment = await repo.findById(businessId, id)
  if (!payment) throw ApiError.notFound('Payment not found')
  return payment
}

async function deletePayment(businessId, id, req) {
  const payment = await repo.findById(businessId, id)
  if (!payment) throw ApiError.notFound('Payment not found')

  await prisma.$transaction(async (tx) => {
    if (payment.invoiceId) {
      await repo.updateInvoiceOnDelete(tx, payment.invoiceId, Number(payment.amount))
    }
    if (payment.customerId) {
      await repo.incrementCustomerBalance(tx, payment.customerId, Number(payment.amount))
    }
    await repo.deleteTx(tx, id)
  })

  req?.audit?.('payment.deleted', 'Payment', id, { amount: payment.amount })
  return { deleted: true }
}

async function getPaymentSummary(businessId, query) {
  const dateFilter = {}
  if (query.startDate) dateFilter.gte = new Date(query.startDate)
  if (query.endDate) dateFilter.lte = new Date(query.endDate)
  const filter = Object.keys(dateFilter).length ? dateFilter : null

  const [byMethod, byType, total] = await Promise.all([
    repo.groupByMethod(businessId, filter),
    repo.groupByReferenceType(businessId, filter),
    repo.aggregateTotal(businessId, filter)
  ])

  return {
    total: Number(total._sum.amount || 0),
    byMethod: byMethod.map((m) => ({ method: m.method, amount: Number(m._sum.amount || 0), count: m._count })),
    byType: byType.map((t) => ({ type: t.referenceType, amount: Number(t._sum.amount || 0), count: t._count }))
  }
}

// ── M-Pesa STK Push (Daraja API) ──────────────────────────────────────────────
async function initiateMpesaPayment(businessId, data) {
  const appConfig = require('../../config/app')
  if (!appConfig.mpesa?.consumerKey) {
    throw ApiError.badRequest('M-Pesa is not configured for this environment')
  }

  const { phone, amount, accountRef, description } = data

  const authRes = await fetch(
    appConfig.mpesa.env === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: 'Basic ' + Buffer.from(
          `${appConfig.mpesa.consumerKey}:${appConfig.mpesa.consumerSecret}`
        ).toString('base64')
      }
    }
  )
  const { access_token } = await authRes.json()

  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
  const password = Buffer.from(
    `${appConfig.mpesa.shortcode}${appConfig.mpesa.passkey}${timestamp}`
  ).toString('base64')

  const stkUrl = appConfig.mpesa.env === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

  const pushRes = await fetch(stkUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: appConfig.mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: phone.replace('+', ''),
      PartyB: appConfig.mpesa.shortcode,
      PhoneNumber: phone.replace('+', ''),
      CallBackURL: appConfig.mpesa.callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: description || 'Payment'
    })
  })

  return pushRes.json()
}

async function handleMpesaCallback(callbackData) {
  const { Body: { stkCallback } } = callbackData
  if (stkCallback.ResultCode !== 0) {
    return { success: false, message: stkCallback.ResultDesc }
  }

  const metadata = stkCallback.CallbackMetadata.Item
  const amount = metadata.find((i) => i.Name === 'Amount')?.Value
  const mpesaRef = metadata.find((i) => i.Name === 'MpesaReceiptNumber')?.Value
  const phone = metadata.find((i) => i.Name === 'PhoneNumber')?.Value

  // Correlate via Redis-stored checkout request ID if needed
  return { success: true, amount, mpesaRef, phone }
}

module.exports = {
  listPayments, getPayment, deletePayment, getPaymentSummary,
  initiateMpesaPayment, handleMpesaCallback
}
