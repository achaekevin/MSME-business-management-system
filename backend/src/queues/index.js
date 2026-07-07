const { Queue } = require('bullmq')
const { createBullConnection } = require('../config/redis')
const { QUEUE_NAMES } = require('../constants')

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86400 }
}

function makeQueue(name) {
  return new Queue(name, { connection: createBullConnection(), defaultJobOptions })
}

const smsQueue = makeQueue(QUEUE_NAMES.SMS)
const notificationsQueue = makeQueue(QUEUE_NAMES.NOTIFICATIONS)
const reportGenerationQueue = makeQueue(QUEUE_NAMES.REPORT_GENERATION)
const invoiceGenerationQueue = makeQueue(QUEUE_NAMES.INVOICE_GENERATION)
const dataBackupsQueue = makeQueue(QUEUE_NAMES.DATA_BACKUPS)
const auditLoggingQueue = makeQueue(QUEUE_NAMES.AUDIT_LOGGING)
const subscriptionRenewalsQueue = makeQueue(QUEUE_NAMES.SUBSCRIPTION_RENEWALS)
const inventoryAlertsQueue = makeQueue(QUEUE_NAMES.INVENTORY_ALERTS)
const scheduledReportsQueue = makeQueue(QUEUE_NAMES.SCHEDULED_REPORTS)
const webhooksQueue = makeQueue(QUEUE_NAMES.WEBHOOKS)

module.exports = {
  smsQueue,
  notificationsQueue,
  reportGenerationQueue,
  invoiceGenerationQueue,
  dataBackupsQueue,
  auditLoggingQueue,
  subscriptionRenewalsQueue,
  inventoryAlertsQueue,
  scheduledReportsQueue,
  webhooksQueue
}
