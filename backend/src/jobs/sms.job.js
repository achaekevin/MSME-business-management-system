const appConfig = require('../config/app')
const logger = require('../config/logger')

/**
 * Sends SMS via Africa's Talking (or logs in dev if not configured).
 * Job data: { phone, message, sender? }
 */
async function processSmsJob(job) {
  const { phone, message, sender } = job.data

  if (!appConfig.sms.apiKey || appConfig.sms.username === 'sandbox') {
    logger.info(`[DEV SMS] To: ${phone} | Message: ${message}`)
    return { simulated: true, phone, message }
  }

  const credentials = Buffer.from(`${appConfig.sms.username}:${appConfig.sms.apiKey}`).toString('base64')

  const params = new URLSearchParams({
    username: appConfig.sms.username,
    to: phone,
    message,
    ...(sender ? { from: sender } : {})
  })

  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      apiKey: appConfig.sms.apiKey
    },
    body: params.toString()
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`SMS API error ${res.status}: ${body}`)
  }

  const result = await res.json()
  const recipient = result.SMSMessageData?.Recipients?.[0]

  if (recipient?.status !== 'Success') {
    throw new Error(`SMS delivery failed for ${phone}: ${recipient?.status || 'Unknown error'}`)
  }

  logger.info(`SMS sent to ${phone}: messageId=${recipient.messageId}`)
  return { sent: true, phone, messageId: recipient.messageId }
}

module.exports = processSmsJob
