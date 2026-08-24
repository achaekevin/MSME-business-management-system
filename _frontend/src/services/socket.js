import { io } from 'socket.io-client'
import { storage } from '@/utils'
import { AUTH_TOKEN_KEY } from '@/constants'
const resolveSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL
  if (typeof window !== 'undefined') {
    const isNetworkAccess = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    if (isNetworkAccess) {
      if (envUrl) {
        try {
          const parsed = new URL(envUrl)
          if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
            parsed.hostname = window.location.hostname
            return parsed.toString().replace(/\/$/, '')
          }
        } catch {
          // fallback
        }
        return envUrl
      }
      return `${window.location.protocol}//${window.location.hostname}:4000`
    }
  }
  return envUrl || 'http://localhost:4000'
}

const SOCKET_URL = resolveSocketUrl()

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
