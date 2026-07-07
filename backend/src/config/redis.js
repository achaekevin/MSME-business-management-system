const Redis = require('ioredis')
const appConfig = require('./app')
const logger = require('./logger')

const redisOptions = {
  host: appConfig.redis.host,
  port: appConfig.redis.port,
  password: appConfig.redis.password,
  maxRetriesPerRequest: null, // required by BullMQ
  retryStrategy: (times) => Math.min(times * 100, 3000)
}

const redisClient = new Redis(redisOptions)

redisClient.on('connect', () => logger.info('✅ Redis connected'))
redisClient.on('error', (err) => logger.error('❌ Redis error:', err.message))

// Separate connection for BullMQ (recommended by BullMQ docs)
function createBullConnection() {
  return new Redis(redisOptions)
}

// ---- Cache helpers, namespaced per business for tenant isolation ----

function cacheKey(businessId, namespace, identifier = '') {
  return `tenant:${businessId}:${namespace}${identifier ? ':' + identifier : ''}`
}

async function cacheGet(key) {
  const val = await redisClient.get(key)
  return val ? JSON.parse(val) : null
}

async function cacheSet(key, value, ttlSeconds = 300) {
  await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

async function cacheDel(key) {
  await redisClient.del(key)
}

async function cacheDelPattern(pattern) {
  const stream = redisClient.scanStream({ match: pattern, count: 100 })
  const keysToDelete = []
  return new Promise((resolve, reject) => {
    stream.on('data', (keys) => keysToDelete.push(...keys))
    stream.on('end', async () => {
      if (keysToDelete.length) await redisClient.del(...keysToDelete)
      resolve()
    })
    stream.on('error', reject)
  })
}

// Invalidate all cached entries for a business namespace, e.g. on mutation
async function invalidateTenantCache(businessId, namespace) {
  await cacheDelPattern(`tenant:${businessId}:${namespace}*`)
}

module.exports = {
  redisClient,
  createBullConnection,
  cacheKey,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  invalidateTenantCache
}
