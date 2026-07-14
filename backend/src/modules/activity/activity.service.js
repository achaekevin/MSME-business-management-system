/**
 * Activity Feed Service
 * Tracks and displays recent business activities
 */

const { prisma } = require('../../config/database')
const logger = require('../../config/logger')

const ACTIVITY_TYPES = {
  SALE_CREATED: 'sale.created',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  PAYMENT_RECEIVED: 'payment.received',
  PRODUCT_CREATED: 'product.created',
  CUSTOMER_CREATED: 'customer.created',
  EMPLOYEE_ADDED: 'employee.added',
  EXPENSE_RECORDED: 'expense.recorded',
  STOCK_ADJUSTED: 'stock.adjusted',
  PURCHASE_CREATED: 'purchase.created'
}

/**
 * Log activity
 */
async function logActivity(businessId, userId, type, description, metadata = {}) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        businessId,
        userId,
        type,
        description,
        metadata: JSON.stringify(metadata),
        createdAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    logger.info(`Activity logged: ${type} by user ${userId}`)
    return activity
  } catch (error) {
    logger.error('Failed to log activity:', error)
    return null
  }
}

/**
 * Get recent activities
 */
async function getRecentActivities(businessId, filters = {}) {
  const where = { businessId }

  if (filters.type) where.type = filters.type
  if (filters.userId) where.userId = filters.userId

  const activities = await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 20
  })

  return activities.map(activity => ({
    ...activity,
    metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
  }))
}

/**
 * Get activity statistics
 */
async function getActivityStats(businessId, days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const activities = await prisma.activityLog.findMany({
    where: {
      businessId,
      createdAt: {
        gte: startDate
      }
    },
    select: {
      type: true,
      createdAt: true
    }
  })

  // Group by type
  const byType = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1
    return acc
  }, {})

  // Group by day
  const byDay = activities.reduce((acc, activity) => {
    const day = activity.createdAt.toISOString().split('T')[0]
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  return {
    total: activities.length,
    byType,
    byDay,
    period: `${days} days`
  }
}

/**
 * Delete old activities (cleanup)
 */
async function cleanupOldActivities(businessId, daysToKeep = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const deleted = await prisma.activityLog.deleteMany({
    where: {
      businessId,
      createdAt: {
        lt: cutoffDate
      }
    }
  })

  logger.info(`Cleaned up ${deleted.count} old activities for business ${businessId}`)
  return deleted.count
}

module.exports = {
  ACTIVITY_TYPES,
  logActivity,
  getRecentActivities,
  getActivityStats,
  cleanupOldActivities
}
