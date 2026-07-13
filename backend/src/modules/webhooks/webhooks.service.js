/**
 * Webhooks Service
 * Allows businesses to receive real-time notifications via HTTP callbacks
 */

const crypto = require('crypto')
const axios = require('axios')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const logger = require('../../config/logger')

// Supported webhook events
const WEBHOOK_EVENTS = [
  'sale.created',
  'sale.updated',
  'sale.completed',
  'invoice.created',
  'invoice.paid',
  'customer.created',
  'customer.updated',
  'product.created',
  'product.updated',
  'inventory.low_stock',
  'purchase.created',
  'payment.received',
  'order.fulfilled',
  'user.created',
  'payroll.processed'
]

/**
 * Create webhook endpoint
 */
async function createWebhook(businessId, data, createdBy) {
  // Validate events
  const invalidEvents = data.events.filter(e => !WEBHOOK_EVENTS.includes(e))
  if (invalidEvents.length > 0) {
    throw ApiError.badRequest(`Invalid events: ${invalidEvents.join(', ')}`)
  }

  // Generate secret for signature verification
  const secret = crypto.randomBytes(32).toString('hex')

  const webhook = await prisma.webhook.create({
    data: {
      businessId,
      url: data.url,
      events: data.events,
      secret,
      isActive: true,
      createdBy
    }
  })

  logger.info(`Webhook created for business ${businessId}: ${data.url}`)

  return webhook
}

/**
 * Get all webhooks for business
 */
async function getWebhooks(businessId) {
  return await prisma.webhook.findMany({
    where: { businessId },
    include: {
      _count: {
        select: { deliveries: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Get webhook details
 */
async function getWebhook(id) {
  const webhook = await prisma.webhook.findUnique({
    where: { id },
    include: {
      deliveries: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!webhook) throw ApiError.notFound('Webhook not found')
  return webhook
}

/**
 * Update webhook
 */
async function updateWebhook(id, data) {
  if (data.events) {
    const invalidEvents = data.events.filter(e => !WEBHOOK_EVENTS.includes(e))
    if (invalidEvents.length > 0) {
      throw ApiError.badRequest(`Invalid events: ${invalidEvents.join(', ')}`)
    }
  }

  return await prisma.webhook.update({
    where: { id },
    data: {
      url: data.url,
      events: data.events,
      isActive: data.isActive
    }
  })
}

/**
 * Delete webhook
 */
async function deleteWebhook(id) {
  await prisma.webhook.delete({
    where: { id }
  })

  return { message: 'Webhook deleted successfully' }
}

/**
 * Generate signature for webhook payload
 */
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
}

/**
 * Trigger webhook event
 */
async function triggerWebhookEvent(businessId, event, payload) {
  try {
    // Find all active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        businessId,
        isActive: true,
        events: {
          has: event
        }
      }
    })

    if (webhooks.length === 0) {
      return
    }

    logger.info(`Triggering webhook event: ${event} for ${webhooks.length} endpoint(s)`)

    // Deliver to all webhooks
    const deliveries = webhooks.map(webhook =>
      deliverWebhook(webhook, event, payload)
    )

    await Promise.allSettled(deliveries)

  } catch (error) {
    logger.error(`Failed to trigger webhook event ${event}:`, error)
  }
}

/**
 * Deliver webhook to endpoint
 */
async function deliverWebhook(webhook, event, payload) {
  const deliveryId = crypto.randomUUID()

  const webhookPayload = {
    id: deliveryId,
    event,
    timestamp: new Date().toISOString(),
    data: payload
  }

  const signature = generateSignature(webhookPayload, webhook.secret)

  const startTime = Date.now()
  let status = 'pending'
  let response = null
  let errorMessage = null

  try {
    const result = await axios.post(webhook.url, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'User-Agent': 'SSME-Webhooks/1.0'
      },
      timeout: 10000 // 10 seconds
    })

    status = result.status >= 200 && result.status < 300 ? 'success' : 'failed'
    response = {
      status: result.status,
      headers: result.headers,
      body: result.data
    }

    logger.info(`Webhook delivered successfully: ${event} → ${webhook.url}`)

  } catch (error) {
    status = 'failed'
    errorMessage = error.message

    if (error.response) {
      response = {
        status: error.response.status,
        body: error.response.data
      }
    }

    logger.error(`Webhook delivery failed: ${event} → ${webhook.url}:`, error.message)
  }

  const duration = Date.now() - startTime

  // Record delivery attempt
  await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event,
      payload: webhookPayload,
      status,
      responseCode: response?.status,
      responseBody: response ? JSON.stringify(response.body) : null,
      errorMessage,
      duration
    }
  })

  // Disable webhook after 10 consecutive failures
  if (status === 'failed') {
    const recentFailures = await prisma.webhookDelivery.count({
      where: {
        webhookId: webhook.id,
        status: 'failed',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    if (recentFailures >= 10) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { isActive: false }
      })
      logger.warn(`Webhook disabled after 10 failures: ${webhook.url}`)
    }
  }
}

/**
 * Get webhook deliveries
 */
async function getWebhookDeliveries(webhookId, filters = {}) {
  const where = { webhookId }

  if (filters.status) where.status = filters.status
  if (filters.event) where.event = filters.event

  return await prisma.webhookDelivery.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50
  })
}

/**
 * Retry failed webhook delivery
 */
async function retryWebhookDelivery(deliveryId) {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true }
  })

  if (!delivery) throw ApiError.notFound('Delivery not found')

  await deliverWebhook(
    delivery.webhook,
    delivery.event,
    delivery.payload.data
  )

  return { message: 'Webhook delivery retried' }
}

/**
 * Get available webhook events
 */
function getAvailableEvents() {
  return WEBHOOK_EVENTS.map(event => ({
    event,
    description: getEventDescription(event)
  }))
}

function getEventDescription(event) {
  const descriptions = {
    'sale.created': 'Triggered when a new sale is created',
    'sale.updated': 'Triggered when a sale is updated',
    'sale.completed': 'Triggered when a sale is completed',
    'invoice.created': 'Triggered when a new invoice is created',
    'invoice.paid': 'Triggered when an invoice is paid',
    'customer.created': 'Triggered when a new customer is added',
    'customer.updated': 'Triggered when customer details are updated',
    'product.created': 'Triggered when a new product is added',
    'product.updated': 'Triggered when product details are updated',
    'inventory.low_stock': 'Triggered when stock falls below reorder level',
    'purchase.created': 'Triggered when a new purchase order is created',
    'payment.received': 'Triggered when a payment is received',
    'order.fulfilled': 'Triggered when an order is fulfilled',
    'user.created': 'Triggered when a new user is added',
    'payroll.processed': 'Triggered when payroll is processed'
  }

  return descriptions[event] || 'No description available'
}

module.exports = {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  triggerWebhookEvent,
  getWebhookDeliveries,
  retryWebhookDelivery,
  getAvailableEvents,
  WEBHOOK_EVENTS
}
