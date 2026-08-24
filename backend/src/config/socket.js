const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const appConfig = require('./app')
const logger = require('./logger')

let io = null

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (appConfig.env === 'development') return callback(null, true)
        if (appConfig.cors.origins.includes(origin)) return callback(null, true)
        if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
          return callback(null, true)
        }
        callback(new Error(`Socket CORS policy does not allow origin: ${origin}`))
      },
      credentials: true
    },
    pingTimeout: 60000
  })


  // Authenticate socket connections via JWT, attach tenant/user context
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '')
      if (!token) return next(new Error('Authentication required'))

      const payload = jwt.verify(token, appConfig.jwt.accessSecret)
      socket.userId = payload.sub
      socket.businessId = payload.businessId
      socket.branchId = payload.branchId
      next()
    } catch (err) {
      next(new Error('Invalid or expired token'))
    }
  })

  io.on('connection', (socket) => {
    logger.info(`Socket connected: user=${socket.userId} business=${socket.businessId}`)

    // Join tenant room — all events scoped to business are broadcast here
    socket.join(`business:${socket.businessId}`)
    socket.join(`user:${socket.userId}`)
    if (socket.branchId) socket.join(`branch:${socket.branchId}`)

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user=${socket.userId}`)
    })
  })

  return io
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(server) first.')
  return io
}

// Emit helpers — used by services/jobs to push real-time events
function emitToBusiness(businessId, event, payload) {
  if (!io) return
  io.to(`business:${businessId}`).emit(event, payload)
}

function emitToUser(userId, event, payload) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, payload)
}

function emitToBranch(branchId, event, payload) {
  if (!io) return
  io.to(`branch:${branchId}`).emit(event, payload)
}

module.exports = { initSocket, getIO, emitToBusiness, emitToUser, emitToBranch }
