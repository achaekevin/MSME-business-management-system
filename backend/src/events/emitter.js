const { webhooksQueue } = require('../queues')
const { emitToBusiness } = require('../config/socket')
const { EVENTS } = require('../constants')
const logger = require('../config/logger')

/**
 * Central event bus. Call this after any significant domain mutation to
 * trigger the downstream effects: real-time socket push + webhook delivery.
 *
 * Usage:
 *   await emit(businessId, EVENTS.SALE_CREATED, { saleId, total, orderNumber })
 *   await emit(businessId, EVENTS.INVOICE_PAID, { invoiceId, invoiceNumber, amount })
 */
async function emit(businessId, event, payload) {
  try {
    // 1. Real-time: push to all connected sockets in this tenant's room
    emitToBusiness(businessId, event, payload)

    // 2. Async: deliver to registered webhooks via BullMQ
    await webhooksQueue.add('deliver-webhook', { businessId, event, payload }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    })
  } catch (err) {
    // Event emission must never break the main request flow
    logger.error(`Event emission failed for [${event}] on business ${businessId}: ${err.message}`)
  }
}

// Convenience wrappers for the most common events
const events = {
  saleCreated:       (businessId, data) => emit(businessId, EVENTS.SALE_CREATED, data),
  saleVoided:        (businessId, data) => emit(businessId, EVENTS.SALE_VOIDED, data),
  invoiceCreated:    (businessId, data) => emit(businessId, EVENTS.INVOICE_CREATED, data),
  invoiceSent:       (businessId, data) => emit(businessId, EVENTS.INVOICE_SENT, data),
  invoicePaid:       (businessId, data) => emit(businessId, EVENTS.INVOICE_PAID, data),
  invoiceOverdue:    (businessId, data) => emit(businessId, EVENTS.INVOICE_OVERDUE, data),
  paymentReceived:   (businessId, data) => emit(businessId, EVENTS.PAYMENT_RECEIVED, data),
  purchaseReceived:  (businessId, data) => emit(businessId, EVENTS.PURCHASE_RECEIVED, data),
  productLowStock:   (businessId, data) => emit(businessId, EVENTS.PRODUCT_LOW_STOCK, data),
  customerCreated:   (businessId, data) => emit(businessId, EVENTS.CUSTOMER_CREATED, data),
  customerUpdated:   (businessId, data) => emit(businessId, EVENTS.CUSTOMER_UPDATED, data),
  userRegistered:    (businessId, data) => emit(businessId, EVENTS.USER_REGISTERED, data),
  userInvited:       (businessId, data) => emit(businessId, EVENTS.USER_INVITED, data)
}

module.exports = { emit, events }
