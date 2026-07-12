const { Queue } = require('bullmq')
const { createBullConnection } = require('../config/redis')
const { QUEUE_NAMES } = require('../constants')

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86400 }
}

// Lazy queue initialization - only create queues when needed
let queuesInitialized = false
let queues = {}

function makeQueue(name) {
  return new Queue(name, { connection: createBullConnection(), defaultJobOptions })
}

function initializeQueues() {
  if (queuesInitialized) return queues
  
  queues.smsQueue = makeQueue(QUEUE_NAMES.SMS)
  queues.notificationsQueue = makeQueue(QUEUE_NAMES.NOTIFICATIONS)
  queues.reportGenerationQueue = makeQueue(QUEUE_NAMES.REPORT_GENERATION)
  queues.invoiceGenerationQueue = makeQueue(QUEUE_NAMES.INVOICE_GENERATION)
  queues.dataBackupsQueue = makeQueue(QUEUE_NAMES.DATA_BACKUPS)
  queues.auditLoggingQueue = makeQueue(QUEUE_NAMES.AUDIT_LOGGING)
  queues.subscriptionRenewalsQueue = makeQueue(QUEUE_NAMES.SUBSCRIPTION_RENEWALS)
  queues.inventoryAlertsQueue = makeQueue(QUEUE_NAMES.INVENTORY_ALERTS)
  queues.scheduledReportsQueue = makeQueue(QUEUE_NAMES.SCHEDULED_REPORTS)
  queues.webhooksQueue = makeQueue(QUEUE_NAMES.WEBHOOKS)
  
  queuesInitialized = true
  return queues
}

// Export getter functions for lazy initialization
module.exports = {
  get smsQueue() { return initializeQueues().smsQueue },
  get notificationsQueue() { return initializeQueues().notificationsQueue },
  get reportGenerationQueue() { return initializeQueues().reportGenerationQueue },
  get invoiceGenerationQueue() { return initializeQueues().invoiceGenerationQueue },
  get dataBackupsQueue() { return initializeQueues().dataBackupsQueue },
  get auditLoggingQueue() { return initializeQueues().auditLoggingQueue },
  get subscriptionRenewalsQueue() { return initializeQueues().subscriptionRenewalsQueue },
  get inventoryAlertsQueue() { return initializeQueues().inventoryAlertsQueue },
  get scheduledReportsQueue() { return initializeQueues().scheduledReportsQueue },
  get webhooksQueue() { return initializeQueues().webhooksQueue },
  initializeQueues
}
