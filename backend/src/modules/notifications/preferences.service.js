/**
 * Notification Preferences Service
 * Allows users to customize which notifications they receive
 */

const { prisma } = require('../../config/database')
const logger = require('../../config/logger')

const DEFAULT_PREFERENCES = {
  email: {
    newSale: true,
    invoicePaid: true,
    lowStock: true,
    payrollProcessed: true,
    leaveRequest: true,
    systemAlerts: true
  },
  inApp: {
    newSale: true,
    invoicePaid: true,
    lowStock: true,
    payrollProcessed: true,
    leaveRequest: true,
    systemAlerts: true,
    mentions: true,
    comments: true
  },
  push: {
    newSale: false,
    invoicePaid: true,
    lowStock: true,
    payrollProcessed: false,
    leaveRequest: true,
    systemAlerts: true
  }
}

/**
 * Get user notification preferences
 */
async function getUserPreferences(userId) {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId }
  })

  if (!preferences) {
    // Create default preferences
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
        emailPreferences: JSON.stringify(DEFAULT_PREFERENCES.email),
        inAppPreferences: JSON.stringify(DEFAULT_PREFERENCES.inApp),
        pushPreferences: JSON.stringify(DEFAULT_PREFERENCES.push),
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false
      }
    })
  }

  return {
    id: preferences.id,
    userId: preferences.userId,
    emailEnabled: preferences.emailEnabled,
    inAppEnabled: preferences.inAppEnabled,
    pushEnabled: preferences.pushEnabled,
    email: preferences.emailPreferences ? JSON.parse(preferences.emailPreferences) : DEFAULT_PREFERENCES.email,
    inApp: preferences.inAppPreferences ? JSON.parse(preferences.inAppPreferences) : DEFAULT_PREFERENCES.inApp,
    push: preferences.pushPreferences ? JSON.parse(preferences.pushPreferences) : DEFAULT_PREFERENCES.push,
    quietHoursStart: preferences.quietHoursStart,
    quietHoursEnd: preferences.quietHoursEnd,
    updatedAt: preferences.updatedAt
  }
}

/**
 * Update notification preferences
 */
async function updatePreferences(userId, updates) {
  const current = await getUserPreferences(userId)

  const data = {}

  if (updates.emailEnabled !== undefined) data.emailEnabled = updates.emailEnabled
  if (updates.inAppEnabled !== undefined) data.inAppEnabled = updates.inAppEnabled
  if (updates.pushEnabled !== undefined) data.pushEnabled = updates.pushEnabled
  if (updates.quietHoursStart !== undefined) data.quietHoursStart = updates.quietHoursStart
  if (updates.quietHoursEnd !== undefined) data.quietHoursEnd = updates.quietHoursEnd

  if (updates.email) {
    data.emailPreferences = JSON.stringify({
      ...current.email,
      ...updates.email
    })
  }

  if (updates.inApp) {
    data.inAppPreferences = JSON.stringify({
      ...current.inApp,
      ...updates.inApp
    })
  }

  if (updates.push) {
    data.pushPreferences = JSON.stringify({
      ...current.push,
      ...updates.push
    })
  }

  const updated = await prisma.notificationPreference.update({
    where: { userId },
    data
  })

  logger.info(`Updated notification preferences for user ${userId}`)

  return getUserPreferences(userId)
}

/**
 * Reset preferences to defaults
 */
async function resetPreferences(userId) {
  await prisma.notificationPreference.update({
    where: { userId },
    data: {
      emailPreferences: JSON.stringify(DEFAULT_PREFERENCES.email),
      inAppPreferences: JSON.stringify(DEFAULT_PREFERENCES.inApp),
      pushPreferences: JSON.stringify(DEFAULT_PREFERENCES.push),
      emailEnabled: true,
      inAppEnabled: true,
      pushEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null
    }
  })

  logger.info(`Reset notification preferences for user ${userId}`)

  return getUserPreferences(userId)
}

/**
 * Check if user should receive a specific notification
 */
async function shouldNotify(userId, notificationType, channel = 'inApp') {
  const preferences = await getUserPreferences(userId)

  // Check if channel is enabled
  if (channel === 'email' && !preferences.emailEnabled) return false
  if (channel === 'inApp' && !preferences.inAppEnabled) return false
  if (channel === 'push' && !preferences.pushEnabled) return false

  // Check quiet hours
  if (preferences.quietHoursStart && preferences.quietHoursEnd) {
    const now = new Date()
    const currentHour = now.getHours()
    const startHour = parseInt(preferences.quietHoursStart.split(':')[0])
    const endHour = parseInt(preferences.quietHoursEnd.split(':')[0])

    if (currentHour >= startHour || currentHour < endHour) {
      return false // In quiet hours
    }
  }

  // Check specific preference
  const channelPrefs = preferences[channel]
  return channelPrefs[notificationType] !== false
}

/**
 * Batch check notification permissions
 */
async function batchShouldNotify(userId, notifications) {
  const preferences = await getUserPreferences(userId)
  
  return notifications.map(({ type, channel }) => ({
    type,
    channel,
    shouldSend: shouldNotifySync(preferences, type, channel)
  }))
}

function shouldNotifySync(preferences, notificationType, channel = 'inApp') {
  if (channel === 'email' && !preferences.emailEnabled) return false
  if (channel === 'inApp' && !preferences.inAppEnabled) return false
  if (channel === 'push' && !preferences.pushEnabled) return false

  if (preferences.quietHoursStart && preferences.quietHoursEnd) {
    const now = new Date()
    const currentHour = now.getHours()
    const startHour = parseInt(preferences.quietHoursStart.split(':')[0])
    const endHour = parseInt(preferences.quietHoursEnd.split(':')[0])

    if (currentHour >= startHour || currentHour < endHour) {
      return false
    }
  }

  const channelPrefs = preferences[channel]
  return channelPrefs[notificationType] !== false
}

module.exports = {
  getUserPreferences,
  updatePreferences,
  resetPreferences,
  shouldNotify,
  batchShouldNotify,
  DEFAULT_PREFERENCES
}
