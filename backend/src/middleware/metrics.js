/**
 * Application Performance Monitoring (APM) Middleware
 * Tracks request metrics, response times, and system health
 */

const os = require('os')
const logger = require('../config/logger')

// Metrics storage (in-memory for demo, use Redis in production)
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: new Map(),
    byMethod: new Map(),
  },
  responseTimes: [],
  activeRequests: 0,
  startTime: Date.now(),
}

/**
 * Track request metrics
 */
function trackRequest(req, res, next) {
  const startTime = Date.now()
  metrics.activeRequests++

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const endpoint = `${req.method} ${req.route?.path || req.path}`

    // Update metrics
    metrics.requests.total++
    metrics.activeRequests--

    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.requests.success++
    } else if (res.statusCode >= 400) {
      metrics.requests.errors++
    }

    // Track by endpoint
    const endpointStats = metrics.requests.byEndpoint.get(endpoint) || {
      count: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
    }

    endpointStats.count++
    endpointStats.avgDuration =
      (endpointStats.avgDuration * (endpointStats.count - 1) + duration) /
      endpointStats.count
    endpointStats.minDuration = Math.min(endpointStats.minDuration, duration)
    endpointStats.maxDuration = Math.max(endpointStats.maxDuration, duration)

    metrics.requests.byEndpoint.set(endpoint, endpointStats)

    // Track by method
    const methodCount = metrics.requests.byMethod.get(req.method) || 0
    metrics.requests.byMethod.set(req.method, methodCount + 1)

    // Store response times (keep last 1000)
    metrics.responseTimes.push(duration)
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes.shift()
    }

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn(`Slow request: ${endpoint} took ${duration}ms`, {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
      })
    }
  })

  next()
}

/**
 * Get current metrics
 */
function getMetrics() {
  const uptime = Date.now() - metrics.startTime
  const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b)

  // Calculate percentiles
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0

  // System metrics
  const cpuUsage = process.cpuUsage()
  const memUsage = process.memoryUsage()

  return {
    uptime: Math.floor(uptime / 1000), // seconds
    timestamp: new Date().toISOString(),
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      errorRate:
        metrics.requests.total > 0
          ? (metrics.requests.errors / metrics.requests.total) * 100
          : 0,
      active: metrics.activeRequests,
      byMethod: Object.fromEntries(metrics.requests.byMethod),
    },
    responseTime: {
      avg:
        sortedTimes.length > 0
          ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length
          : 0,
      min: sortedTimes.length > 0 ? sortedTimes[0] : 0,
      max: sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0,
      p50,
      p95,
      p99,
    },
    topEndpoints: Array.from(metrics.requests.byEndpoint.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([endpoint, stats]) => ({ endpoint, ...stats })),
    system: {
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      },
      os: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
        totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
        loadAverage: os.loadavg(),
      },
    },
  }
}

/**
 * Reset metrics (useful for testing)
 */
function resetMetrics() {
  metrics.requests.total = 0
  metrics.requests.success = 0
  metrics.requests.errors = 0
  metrics.requests.byEndpoint.clear()
  metrics.requests.byMethod.clear()
  metrics.responseTimes = []
  metrics.startTime = Date.now()
}

module.exports = {
  trackRequest,
  getMetrics,
  resetMetrics,
}
