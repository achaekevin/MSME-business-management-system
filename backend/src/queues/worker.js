require('dotenv').config()
const { Worker } = require('bullmq')
const { createBullConnection } = require('../config/redis')
const { QUEUE_NAMES } = require('../constants')
const logger = require('../config/logger')
const { connectDatabase } = require('../config/database')

// Job processors
const processEmailJob = require('../jobs/email.job')
const processNotificationJob = require('../jobs/notification.job')
const processInventoryAlertJob = require('../jobs/inventoryAlert.job')
const processReportGenerationJob = require('../jobs/reportGeneration.job')
const processWebhookJob = require('../jobs/webhook.job')
const processSubscriptionRenewalJob = require('../jobs/subscriptionRenewal.job')
const processSmsJob = require('../jobs/sms.job')
const processInvoiceGenerationJob = require('../jobs/invoiceGeneration.job')
const processDataBackupJob = require('../jobs/dataBackup.job')
const processAuditLoggingJob = require('../jobs/auditLogging.job')
const processScheduledReportJob = require('../jobs/scheduledReport.job')

async function start() {
  await connectDatabase()
  const connection = createBullConnection()

  const workerConfig = [
    { name: QUEUE_NAMES.EMAIL,                 fn: processEmailJob,                concurrency: 10 },
    { name: QUEUE_NAMES.SMS,                   fn: processSmsJob,                  concurrency: 5  },
    { name: QUEUE_NAMES.NOTIFICATIONS,         fn: processNotificationJob,         concurrency: 20 },
    { name: QUEUE_NAMES.INVENTORY_ALERTS,      fn: processInventoryAlertJob,       concurrency: 2  },
    { name: QUEUE_NAMES.REPORT_GENERATION,     fn: processReportGenerationJob,     concurrency: 3  },
    { name: QUEUE_NAMES.WEBHOOKS,              fn: processWebhookJob,              concurrency: 5  },
    { name: QUEUE_NAMES.SUBSCRIPTION_RENEWALS, fn: processSubscriptionRenewalJob,  concurrency: 1  },
    { name: QUEUE_NAMES.INVOICE_GENERATION,    fn: processInvoiceGenerationJob,   concurrency: 3 },
    { name: QUEUE_NAMES.DATA_BACKUPS,          fn: processDataBackupJob,           concurrency: 1 },
    { name: QUEUE_NAMES.AUDIT_LOGGING,         fn: processAuditLoggingJob,         concurrency: 10 },
    { name: QUEUE_NAMES.SCHEDULED_REPORTS,     fn: processScheduledReportJob,      concurrency: 2 }
  ]

  const workers = workerConfig.map(({ name, fn, concurrency }) =>
    new Worker(name, fn, { connection, concurrency })
  )

  workers.forEach((worker) => {
    worker.on('completed', (job) => logger.info(`✅ [${worker.name}] Job ${job.id} (${job.name}) completed`))
    worker.on('failed', (job, err) => logger.error(`❌ [${worker.name}] Job ${job?.id} (${job?.name}) failed: ${err.message}`))
    worker.on('error', (err) => logger.error(`[${worker.name}] Worker error: ${err.message}`))
  })

  logger.info(`🚀 Worker process started — ${workers.length} queue workers running`)

  const shutdown = async (signal) => {
    logger.info(`${signal} — shutting down workers gracefully...`)
    await Promise.all(workers.map((w) => w.close()))
    const { disconnectDatabase } = require('../config/database')
    const { redisClient } = require('../config/redis')
    await disconnectDatabase()
    await redisClient.quit()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => logger.error('Worker unhandled rejection:', reason))
}

start().catch((err) => { logger.error('Worker failed to start:', err); process.exit(1) })
