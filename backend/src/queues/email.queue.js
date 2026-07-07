const { Queue } = require('bullmq')
const { createBullConnection } = require('../config/redis')
const { QUEUE_NAMES } = require('../constants')

const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: createBullConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 }
  }
})

module.exports = emailQueue
