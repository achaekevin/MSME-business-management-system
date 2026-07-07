const express = require('express')
const router = express.Router()
const asyncHandler = require('../../helpers/asyncHandler')
const { success, noContent, paginated } = require('../../helpers/response')
const { prisma } = require('../../config/database')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { parsePagination } = require('../../helpers/pagination')

router.use(authenticate, tenantContext)

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notifications for the authenticated user
 */

router.get('/', asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const userId = req.userId
  const showUnread = req.query.unread === 'true'

  const where = { userId, businessId: req.businessId, ...(showUnread ? { isRead: false } : {}) }

  const [items, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where })
  ])

  paginated(res, items, total, page, limit)
}))

router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({ where: { userId: req.userId, isRead: false } })
  success(res, { count })
}))

router.put('/:id/read', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.userId }, data: { isRead: true, readAt: new Date() } })
  success(res, { marked: true })
}))

router.put('/read-all', asyncHandler(async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId: req.userId, businessId: req.businessId, isRead: false },
    data: { isRead: true, readAt: new Date() }
  })
  success(res, { marked: count })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.userId } })
  noContent(res)
}))

module.exports = router
