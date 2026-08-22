const Redis = require('ioredis')
const appConfig = require('./app')
const logger = require('./logger')

// In-memory fallback cache when Redis is offline
const memoryCache = new Map()

const redisOptions = {
  host: appConfig.redis.host || 'localhost',
  port: appConfig.redis.port || 6379,
  password: appConfig.redis.password || undefined,
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  retryStrategy: (times) => {
    // Stop retrying after 3 attempts to prevent infinite error logging loops
    if (times > 3) {
      return null
    }
    return Math.min(times * 200, 1000)
  }
}

let redisClient
let isRedisReady = false
let connectionAttempted = false

try {
  redisClient = new Redis(redisOptions)

  redisClient.on('connect', () => {
    isRedisReady = true
    logger.info('✅ Redis connected')
  })

  redisClient.on('ready', () => {
    isRedisReady = true
  })

  redisClient.on('close', () => {
    isRedisReady = false
  })

  redisClient.on('end', () => {
    isRedisReady = false
  })

  redisClient.on('error', (err) => {
    isRedisReady = false
    // Only log once during startup/disconnection to avoid console spam
    if (!connectionAttempted) {
      connectionAttempted = true
      logger.warn(`⚠️  Redis unavailable (${err.code || err.message}). Fallback to in-memory caching.`)
    }
  })
} catch (err) {
  logger.warn(`⚠️  Redis initialization skipped: ${err.message}`)
}

// Separate connection for BullMQ
function createBullConnection() {
  return new Redis({
    ...redisOptions,
    maxRetriesPerRequest: null,
    enableOfflineQueue: true
  })
}

// ---- Cache helpers with automatic in-memory fallback ----

function cacheKey(businessId, namespace, identifier = '') {
  return `tenant:${businessId}:${namespace}${identifier ? ':' + identifier : ''}`
}

async function cacheGet(key) {
  if (isRedisReady && redisClient) {
    try {
      const val = await redisClient.get(key)
      return val ? JSON.parse(val) : null
    } catch (err) {
      // Fallback to memory cache on Redis error
    }
  }

  const cached = memoryCache.get(key)
  if (cached) {
    if (cached.expiry && Date.now() > cached.expiry) {
      memoryCache.delete(key)
      return null
    }
    return cached.value
  }
  return null
}

async function cacheSet(key, value, ttlSeconds = 300) {
  if (isRedisReady && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds)
      return
    } catch (err) {
      // Fallback to memory cache
    }
  }

  memoryCache.set(key, {
    value,
    expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
  })
}

async function cacheDel(key) {
  if (isRedisReady && redisClient) {
    try {
      await redisClient.del(key)
    } catch (err) {
      // Ignore
    }
  }
  memoryCache.delete(key)
}

async function cacheDelPattern(pattern) {
  if (isRedisReady && redisClient) {
    try {
      const stream = redisClient.scanStream({ match: pattern, count: 100 })
      const keysToDelete = []
      await new Promise((resolve) => {
        stream.on('data', (keys) => keysToDelete.push(...keys))
        stream.on('end', async () => {
          if (keysToDelete.length) await redisClient.del(...keysToDelete).catch(() => {})
          resolve()
        })
        stream.on('error', () => resolve())
      })
    } catch (err) {
      // Ignore
    }
  }

  // Clear matching memory cache keys
  const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  for (const k of memoryCache.keys()) {
    if (regexPattern.test(k)) {
      memoryCache.delete(k)
    }
  }
}

async function invalidateTenantCache(businessId, namespace) {
  await cacheDelPattern(`tenant:${businessId}:${namespace}*`)
}

module.exports = {
  redisClient,
  isRedisAvailable: () => isRedisReady,
  createBullConnection,
  cacheKey,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  invalidateTenantCache
}
