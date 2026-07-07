import { io } from 'socket.io-client'
import { storage } from '@/utils'
import { AUTH_TOKEN_KEY } from '@/constants'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'wss://api.msmebms.com'

let socket = null

export function initSocket() {
  const token = storage.get(AUTH_TOKEN_KEY)
  if (!token || socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  })

  socket.on('connect', () => console.log('Socket connected'))
  socket.on('disconnect', () => console.log('Socket disconnected'))
  socket.on('connect_error', (err) => console.error('Socket connection error:', err.message))

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Subscribe to real-time notification events
export function subscribeToNotifications(callback) {
  if (!socket) return () => {}
  socket.on('notification:new', callback)
  return () => socket.off('notification:new', callback)
}

// Subscribe to inventory updates
export function subscribeToInventory(callback) {
  if (!socket) return () => {}
  socket.on('inventory:update', callback)
  return () => socket.off('inventory:update', callback)
}

// Subscribe to sale events (multi-terminal POS sync)
export function subscribeToSales(callback) {
  if (!socket) return () => {}
  socket.on('sale:created', callback)
  return () => socket.off('sale:created', callback)
}
