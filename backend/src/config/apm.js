/**
 * Application Performance Monitoring (APM) Configuration
 * Supports New Relic, DataDog, and other APM providers
 */

const logger = require('./logger')

/**
 * Initialize APM based on environment configuration
 */
function initializeAPM() {
  const apmProvider = process.env.APM_PROVIDER || 'none'

  switch (apmProvider.toLowerCase()) {
    case 'newrelic':
      return initializeNewRelic()
    case 'datadog':
      return initializeDataDog()
    case 'elastic':
      return initializeElasticAPM()
    default:
      logger.info('No APM provider configured')
      return null
  }
}

/**
 * Initialize New Relic APM
 * https://docs.newrelic.com/docs/apm/agents/nodejs-agent/
 */
function initializeNewRelic() {
  if (!process.env.NEW_RELIC_LICENSE_KEY) {
    logger.warn('NEW_RELIC_LICENSE_KEY not set, skipping New Relic initialization')
    return null
  }

  try {
    const newrelic = require('newrelic')
    logger.info('New Relic APM initialized successfully')
    return newrelic
  } catch (error) {
    logger.error('Failed to initialize New Relic:', error.message)
    logger.info('Install with: npm install newrelic')
    return null
  }
}

/**
 * Initialize DataDog APM
 * https://docs.datadoghq.com/tracing/trace_collection/dd_libraries/nodejs/
 */
function initializeDataDog() {
  if (!process.env.DD_API_KEY) {
    logger.warn('DD_API_KEY not set, skipping DataDog initialization')
    return null
  }

  try {
    const tracer = require('dd-trace').init({
      service: process.env.DD_SERVICE || 'msme-bms-api',
      env: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      logInjection: true,
      analytics: true,
      runtimeMetrics: true,
      profiling: true,
    })
    
    logger.info('DataDog APM initialized successfully')
    return tracer
  } catch (error) {
    logger.error('Failed to initialize DataDog:', error.message)
    logger.info('Install with: npm install dd-trace')
    return null
  }
}

/**
 * Initialize Elastic APM
 * https://www.elastic.co/guide/en/apm/agent/nodejs/current/index.html
 */
function initializeElasticAPM() {
  if (!process.env.ELASTIC_APM_SERVER_URL) {
    logger.warn('ELASTIC_APM_SERVER_URL not set, skipping Elastic APM initialization')
    return null
  }

  try {
    const apm = require('elastic-apm-node').start({
      serviceName: process.env.ELASTIC_APM_SERVICE_NAME || 'msme-bms-api',
      serverUrl: process.env.ELASTIC_APM_SERVER_URL,
      secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
      environment: process.env.NODE_ENV || 'development',
      logLevel: 'info',
      captureBody: 'all',
      captureHeaders: true,
    })
    
    logger.info('Elastic APM initialized successfully')
    return apm
  } catch (error) {
    logger.error('Failed to initialize Elastic APM:', error.message)
    logger.info('Install with: npm install elastic-apm-node')
    return null
  }
}

/**
 * Create custom transaction for APM tracking
 */
function createTransaction(name, type = 'request') {
  const apmProvider = process.env.APM_PROVIDER || 'none'

  switch (apmProvider.toLowerCase()) {
    case 'newrelic':
      try {
        const newrelic = require('newrelic')
        return newrelic.startWebTransaction(name)
      } catch (error) {
        return null
      }

    case 'elastic':
      try {
        const apm = require('elastic-apm-node')
        return apm.startTransaction(name, type)
      } catch (error) {
        return null
      }

    default:
      return null
  }
}

/**
 * Record custom metric
 */
function recordMetric(name, value, unit = 'count') {
  const apmProvider = process.env.APM_PROVIDER || 'none'

  switch (apmProvider.toLowerCase()) {
    case 'newrelic':
      try {
        const newrelic = require('newrelic')
        newrelic.recordMetric(`Custom/${name}`, value)
      } catch (error) {
        // Silent fail
      }
      break

    case 'datadog':
      try {
        const tracer = require('dd-trace')
        tracer.dogstatsd.gauge(name, value)
      } catch (error) {
        // Silent fail
      }
      break

    case 'elastic':
      try {
        const apm = require('elastic-apm-node')
        if (apm.currentTransaction) {
          apm.currentTransaction.setLabel(name, value)
        }
      } catch (error) {
        // Silent fail
      }
      break
  }
}

/**
 * Record custom error
 */
function recordError(error, customAttributes = {}) {
  const apmProvider = process.env.APM_PROVIDER || 'none'

  switch (apmProvider.toLowerCase()) {
    case 'newrelic':
      try {
        const newrelic = require('newrelic')
        newrelic.noticeError(error, customAttributes)
      } catch (e) {
        // Silent fail
      }
      break

    case 'elastic':
      try {
        const apm = require('elastic-apm-node')
        apm.captureError(error, { custom: customAttributes })
      } catch (e) {
        // Silent fail
      }
      break
  }
}

module.exports = {
  initializeAPM,
  createTransaction,
  recordMetric,
  recordError,
}
