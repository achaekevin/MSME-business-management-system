const { prisma } = require('../config/database')
const logger = require('../config/logger')
const dayjs = require('dayjs')

/**
 * Checks for subscriptions expiring within 3 days and renews active ones.
 * Also sends expiry warning notifications. Runs daily via cron scheduler.
 * Uses lazy requires to avoid circular dependency with queues/index.
 */
async function processSubscriptionRenewalJob(job) {
  // Lazy requires to avoid circular dependency: queues/index -> worker -> this -> queues/index
  const { checkAndRenewExpiring } = require('../modules/subscriptions/subscriptions.service')
  const { notificationsQueue } = require('./index')
  const emailQueue = require('./email.queue')

  logger.info('Starting subscription renewal check...')

  // 1. Renew active subscriptions due to roll over
  const renewed = await checkAndRenewExpiring()
  logger.info(`Renewed ${renewed.length} subscriptions`)

  for (const sub of renewed) {
    const owner = await prisma.user.findFirst({
      where: { businessId: sub.businessId, isOwner: true },
      select: { email: true, name: true }
    })
    if (owner) {
      await emailQueue.add('subscription-renewed', { email: owner.email, name: owner.name, renewedTo: sub.renewedTo })
    }
  }

  // 2. Find trials expiring in <= 3 days
  const expiringTrials = await prisma.subscription.findMany({
    where: {
      status: 'trial',
      currentPeriodEnd: { gte: dayjs().toDate(), lte: dayjs().add(3, 'day').toDate() }
    },
    include: {
      business: { include: { users: { where: { isOwner: true }, select: { id: true, email: true, name: true } } } }
    }
  })

  for (const trial of expiringTrials) {
    const owner = trial.business.users[0]
    if (!owner) continue
    const daysLeft = dayjs(trial.currentPeriodEnd).diff(dayjs(), 'day')

    await notificationsQueue.add('trial-expiring-notification', {
      businessId: trial.businessId, userId: owner.id,
      title: 'Your free trial is expiring',
      message: `Your trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to keep your data.`,
      type: 'warning', link: '/subscriptions'
    })

    await emailQueue.add('trial-expiring', {
      email: owner.email, name: owner.name, daysLeft, expiresAt: trial.currentPeriodEnd
    })
  }

  // 3. Mark truly expired subscriptions
  const [expired, expiredTrials] = await Promise.all([
    prisma.subscription.updateMany({
      where: { status: 'active', cancelAtPeriodEnd: true, currentPeriodEnd: { lt: new Date() } },
      data: { status: 'cancelled' }
    }),
    prisma.subscription.updateMany({
      where: { status: 'trial', currentPeriodEnd: { lt: new Date() } },
      data: { status: 'expired' }
    })
  ])

  const totalExpired = expired.count + expiredTrials.count
  logger.info(`Renewal job done: renewed=${renewed.length}, warned=${expiringTrials.length}, expired=${totalExpired}`)
  return { renewed: renewed.length, warned: expiringTrials.length, expired: totalExpired }
}

module.exports = processSubscriptionRenewalJob
