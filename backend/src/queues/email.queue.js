const { Queue } = require('bullmq')
const { createBullConnection } = require('../config/redis')
const { QUEUE_NAMES } = require('../constants')

// Lazy initialization to prevent premature Redis connection
let emailQueue = null

function getEmailQueue() {
  if (!emailQueue) {
    emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
      connection: createBullConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 }
      }
    })
  }
  return emailQueue
}

// Export the queue with a getter for lazy initialization
module.exports = new Proxy({}, {
  get(target, prop) {
    const queue = getEmailQueue()
    return typeof queue[prop] === 'function' ? queue[prop].bind(queue) : queue[prop]
  }
})
