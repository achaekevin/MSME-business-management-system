const crypto = require('crypto')
const { prisma } = require('../config/database')
const logger = require('../config/logger')

/**
 * Delivers a webhook event to all matching registered endpoints for a business.
 * Job data: { businessId, event, payload }
 *
 * Security: each delivery is signed with HMAC-SHA256 using the webhook's secret.
 * Consumers verify: X-MSME-Signature == hmac(secret, JSON.stringify(payload))
 */
async function processWebhookJob(job) {
  const { businessId, event, payload } = job.data

  const webhooks = await prisma.webhook.findMany({
    where: { businessId, isActive: true }
  })

  const matching = webhooks.filter((wh) => {
    const events = Array.isArray(wh.events) ? wh.events : JSON.parse(wh.events || '[]')
    return events.includes(event) || events.includes('*')
  })

  if (matching.length === 0) return { delivered: 0 }

  const results = []

  for (const webhook of matching) {
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() })
    const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')

    let statusCode = null
    let success = false

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MSME-Signature': `sha256=${signature}`,
          'X-MSME-Event': event,
          'User-Agent': 'MSME-BMS-Webhook/1.0'
        },
        body,
        signal: controller.signal
      }).finally(() => clearTimeout(timeout))

      statusCode = res.status
      success = res.ok
    } catch (err) {
      logger.warn(`Webhook delivery failed for ${webhook.url}: ${err.message}`)
    }

    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload,
        statusCode,
        success,
        attempt: job.attemptsMade + 1
      }
    })

    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date() }
    })

    results.push({ webhookId: webhook.id, url: webhook.url, success, statusCode })
  }

  const failedCount = results.filter((r) => !r.success).length
  if (failedCount > 0) {
    throw new Error(`${failedCount}/${results.length} webhook deliveries failed — will retry`)
  }

  return { delivered: results.length, results }
}

module.exports = processWebhookJob
