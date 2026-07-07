import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

// Tailwind class merging
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Currency formatting
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

// Number formatting
export function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num || 0)
}

// Compact number (1000 -> 1K)
export function formatCompact(num) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num || 0)
}

// Percentage
export function formatPercent(value, decimals = 1) {
  return `${(value || 0).toFixed(decimals)}%`
}

// Date formatting
export function formatDate(date, fmt = 'MMM dd, yyyy') {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, fmt)
}

export function formatDateTime(date) {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export function formatRelativeTime(date) {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
}

// Truncate text
export function truncate(text, length = 50) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '…' : text
}

// Generate initials
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// Generate random color for avatar
export function getAvatarColor(name) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

// Calculate percentage change
export function calcChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Debounce
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Sleep
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Deep clone
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Flatten array
export function flattenArray(arr, key = 'children') {
  return arr.reduce((acc, item) => {
    acc.push(item)
    if (item[key]) acc.push(...flattenArray(item[key], key))
    return acc
  }, [])
}

// Group by
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key]
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})
}

// Sort by
export function sortBy(arr, key, order = 'asc') {
  return [...arr].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1
    return 0
  })
}

// Filter search
export function filterSearch(arr, query, fields) {
  if (!query) return arr
  const q = query.toLowerCase()
  return arr.filter(item =>
    fields.some(field => {
      const val = item[field]
      return val && String(val).toLowerCase().includes(q)
    })
  )
}

// Generate order number
export function generateOrderNumber(prefix = 'ORD') {
  const date = format(new Date(), 'yyyyMMdd')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${date}-${rand}`
}

// Download file
export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Parse query params
export function parseQueryParams(search) {
  return Object.fromEntries(new URLSearchParams(search))
}

// Build query string
export function buildQueryString(params) {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  return filtered.length ? '?' + new URLSearchParams(filtered).toString() : ''
}

// Validate email
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Password strength
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: 'None', color: 'bg-gray-200' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const levels = [
    { score: 0, label: 'Very weak', color: 'bg-red-500' },
    { score: 1, label: 'Weak', color: 'bg-orange-500' },
    { score: 2, label: 'Fair', color: 'bg-yellow-500' },
    { score: 3, label: 'Good', color: 'bg-blue-500' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
    { score: 5, label: 'Very strong', color: 'bg-green-600' }
  ]
  return levels[score] || levels[0]
}

// Local storage helpers
export const storage = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key)
      return val ? JSON.parse(val) : fallback
    } catch { return fallback }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
  },
  remove: (key) => {
    try { localStorage.removeItem(key) } catch {}
  },
  clear: () => {
    try { localStorage.clear() } catch {}
  }
}
