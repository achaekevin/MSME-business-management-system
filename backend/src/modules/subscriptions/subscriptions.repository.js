const { prisma } = require('../../config/database')
const dayjs = require('dayjs')

function findSubscription(businessId) {
  return prisma.subscription.findUnique({
    where: { businessId },
    include: { billingHistory: { orderBy: { createdAt: 'desc' }, take: 5 } }
  })
}

function updateSubscription(businessId, data) {
  return prisma.subscription.update({ where: { businessId }, data })
}

function createBillingRecord(subscriptionId, amount, currency, status) {
  return prisma.billingRecord.create({
    data: { subscriptionId, amount, currency, status, paidAt: new Date() }
  })
}

function findBillingHistory(subscriptionId) {
  return prisma.billingRecord.findMany({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  })
}

function findPaymentMethods(subscriptionId) {
  return prisma.subscriptionPaymentMethod.findMany({ where: { subscriptionId } })
}

function clearDefaultPaymentMethods(subscriptionId) {
  return prisma.subscriptionPaymentMethod.updateMany({
    where: { subscriptionId }, data: { isDefault: false }
  })
}

function createPaymentMethod(subscriptionId, type, last4, brand, isDefault) {
  return prisma.subscriptionPaymentMethod.create({
    data: { subscriptionId, type, last4, brand, isDefault: isDefault || false }
  })
}

function findPaymentMethodById(methodId, subscriptionId) {
  return prisma.subscriptionPaymentMethod.findFirst({ where: { id: methodId, subscriptionId } })
}

function deletePaymentMethod(id) {
  return prisma.subscriptionPaymentMethod.delete({ where: { id } })
}

function findExpiringSubscriptions() {
  return prisma.subscription.findMany({
    where: {
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: { lte: dayjs().add(3, 'day').toDate() }
    }
  })
}

function findExpiringTrials() {
  return prisma.subscription.findMany({
    where: {
      status: 'trial',
      currentPeriodEnd: { gte: dayjs().toDate(), lte: dayjs().add(3, 'day').toDate() }
    },
    include: {
      business: {
        include: {
          users: { where: { isOwner: true }, select: { id: true, email: true, name: true } }
        }
      }
    }
  })
}

function expireSubscriptions() {
  return Promise.all([
    prisma.subscription.updateMany({
      where: { status: 'active', cancelAtPeriodEnd: true, currentPeriodEnd: { lt: new Date() } },
      data: { status: 'cancelled' }
    }),
    prisma.subscription.updateMany({
      where: { status: 'trial', currentPeriodEnd: { lt: new Date() } },
      data: { status: 'expired' }
    })
  ])
}

module.exports = {
  findSubscription, updateSubscription, createBillingRecord,
  findBillingHistory, findPaymentMethods, clearDefaultPaymentMethods,
  createPaymentMethod, findPaymentMethodById, deletePaymentMethod,
  findExpiringSubscriptions, findExpiringTrials, expireSubscriptions
}
