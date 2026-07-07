const { prisma } = require('../config/database')
const { emitToUser, emitToBusiness } = require('../config/socket')
const logger = require('../config/logger')

/**
 * Creates an in-app notification row and pushes it over the socket to the
 * recipient in real time. Job data shape:
 *   { businessId, userId, title, message, type, link, broadcast }
 */
async function processNotificationJob(job) {
  const { businessId, userId, title, message, type = 'info', link, broadcast = false } = job.data

  if (broadcast) {
    // Fan out to every active user in the business (e.g. "low stock" alerts)
    const users = await prisma.user.findMany({ where: { businessId, isActive: true }, select: { id: true } })
    const notifications = await prisma.$transaction(
      users.map((u) =>
        prisma.notification.create({ data: { businessId, userId: u.id, title, message, type, link } })
      )
    )
    emitToBusiness(businessId, 'notification:new', { title, message, type, link })
    return { created: notifications.length }
  }

  const notification = await prisma.notification.create({
    data: { businessId, userId, title, message, type, link }
  })

  emitToUser(userId, 'notification:new', notification)
  return { created: 1, notification }
}

module.exports = processNotificationJob
