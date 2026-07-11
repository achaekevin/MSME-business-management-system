const {
  inventoryAlertsQueue,
  subscriptionRenewalsQueue,
  scheduledReportsQueue,
  dataBackupsQueue
} = require('./index')
const logger = require('../config/logger')
const { prisma } = require('../config/database')

/**
 * Registers BullMQ repeatable jobs. Called once on API boot — idempotent,
 * BullMQ deduplicates repeatable jobs by key.
 *
 * Schedule overview:
 *   - Inventory alerts:     every hour (on the hour)
 *   - Subscription checks:  daily at 06:00 UTC
 *   - Scheduled reports:    weekly on Monday at 07:00 UTC
 *   - Data backups:         nightly at 02:00 UTC for each business
 */
async function registerScheduledJobs() {
  try {
    // ── Fixed repeatable jobs ─────────────────────────────────────────────────
    await inventoryAlertsQueue.add(
      'scan-low-stock',
      {},
      { repeat: { pattern: '0 * * * *' }, jobId: 'inventory-alert-hourly' }
    )

    await subscriptionRenewalsQueue.add(
      'check-expiring-subscriptions',
      {},
      { repeat: { pattern: '0 6 * * *' }, jobId: 'subscription-check-daily' }
    )

    await scheduledReportsQueue.add(
      'dispatch-due-reports',
      {},
      { repeat: { pattern: '0 7 * * 1' }, jobId: 'scheduled-reports-weekly' }
    )

    // ── Nightly data backup for all active businesses ─────────────────────────
    // One parent job dispatches per-business backup jobs at 02:00 UTC.
    // Individual business backup jobs land in the DATA_BACKUPS queue.
    await scheduledReportsQueue.add(
      'trigger-nightly-backups',
      { _type: 'nightly_backup_trigger' },
      { repeat: { pattern: '0 2 * * *' }, jobId: 'nightly-backup-trigger' }
    )

    logger.info('✅ Scheduled (repeatable) jobs registered')
  } catch (err) {
    logger.warn('⚠️  Queue registration failed - Redis version may be incompatible')
    throw err // Re-throw so server.js can handle it
  }
}

/**
 * Called by the SCHEDULED_REPORTS worker when it receives a job named
 * 'trigger-nightly-backups'. Enqueues one DATA_BACKUPS job per business.
 */
async function triggerNightlyBackups() {
  const { dataBackupsQueue } = require('./index')

  const businesses = await prisma.business.findMany({
    where: { subscription: { status: { in: ['active', 'trial'] } } },
    select: { id: true }
  })

  let queued = 0
  for (const biz of businesses) {
    await dataBackupsQueue.add('nightly-backup', { businessId: biz.id })
    queued++
  }

  logger.info(`Nightly backup dispatch: queued ${queued} backup jobs`)
  return { queued }
}

module.exports = { registerScheduledJobs, triggerNightlyBackups }
