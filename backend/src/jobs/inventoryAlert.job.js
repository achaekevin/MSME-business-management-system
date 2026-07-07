const { prisma } = require('../config/database')
const notificationsQueue = require('../queues').notificationsQueue
const emailQueue = require('../queues/email.queue')
const logger = require('../config/logger')
const { QUEUE_NAMES } = require('../constants')

/**
 * Scans all active, inventory-tracked products and notifies business users
 * when stock has fallen to/below the reorder point. Scheduled to run hourly
 * via a repeatable job (see src/queues/scheduler.js).
 */
async function processInventoryAlertJob(job) {
  const { businessId } = job.data || {}

  const where = {
    trackInventory: true,
    isActive: true,
    ...(businessId ? { businessId } : {})
  }

  const products = await prisma.product.findMany({
    where,
    include: { inventoryStocks: true }
  })

  let alertCount = 0

  for (const product of products) {
    const totalStock = product.inventoryStocks.reduce((sum, s) => sum + Number(s.quantity), 0)
    if (totalStock <= product.reorderPoint) {
      await notificationsQueue.add('low-stock-notification', {
        businessId: product.businessId,
        title: 'Low stock alert',
        message: `${product.name} has ${totalStock} units left (reorder point: ${product.reorderPoint})`,
        type: 'warning',
        link: `/products/${product.id}`,
        broadcast: true
      })
      alertCount++
    }
  }

  logger.info(`Inventory alert scan complete: ${alertCount} low-stock products flagged`)
  return { alertCount }
}

module.exports = processInventoryAlertJob
