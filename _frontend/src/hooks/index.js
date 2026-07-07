import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Auth hook
export function useAuth() {
  return useAuthStore()
}

// Permission hook
export function usePermission() {
  const { hasPermission, hasRole } = useAuthStore()
  return { hasPermission, hasRole, can: hasPermission }
}

// Debounce hook
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// Local storage hook
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })
  const setStoredValue = useCallback((val) => {
    try {
      const toStore = val instanceof Function ? val(value) : val
      setValue(toStore)
      localStorage.setItem(key, JSON.stringify(toStore))
    } catch {}
  }, [key, value])
  return [value, setStoredValue]
}

// Pagination hook
export function usePagination(total, initialLimit = 25) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)
  const totalPages = Math.ceil(total / limit)

  const goToPage = useCallback((p) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages])
  const nextPage = useCallback(() => goToPage(page + 1), [page, goToPage])
  const prevPage = useCallback(() => goToPage(page - 1), [page, goToPage])
  const changeLimit = useCallback((l) => { setLimit(l); setPage(1) }, [])

  return { page, limit, totalPages, setPage: goToPage, nextPage, prevPage, setLimit: changeLimit }
}

// Search hook
export function useSearch(initialValue = '') {
  const [search, setSearch] = useState(initialValue)
  const debouncedSearch = useDebounce(search, 400)
  return { search, setSearch, debouncedSearch }
}

// Modal hook
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [data, setData] = useState(null)

  const open = useCallback((d = null) => { setData(d); setIsOpen(true) }, [])
  const close = useCallback(() => { setIsOpen(false); setTimeout(() => setData(null), 300) }, [])
  const toggle = useCallback(() => setIsOpen(v => !v), [])

  return { isOpen, data, open, close, toggle }
}

// Confirm dialog hook
export function useConfirm() {
  const [state, setState] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const confirm = useCallback(({ title, message }) => {
    return new Promise((resolve) => {
      setState({ isOpen: true, title, message, onConfirm: resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.onConfirm?.(true)
    setState(s => ({ ...s, isOpen: false }))
  }, [state])

  const handleCancel = useCallback(() => {
    state.onConfirm?.(false)
    setState(s => ({ ...s, isOpen: false }))
  }, [state])

  return { ...state, confirm, handleConfirm, handleCancel }
}

// Outside click hook
export function useOutsideClick(callback) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) callback() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [callback])
  return ref
}

// Window size hook
export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return { ...size, isMobile: size.width < 768, isTablet: size.width < 1024 }
}

// Copy to clipboard hook
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [])
  return { copied, copy }
}

// Idle timeout hook
export function useIdleTimeout(callback, timeout = 30 * 60 * 1000) {
  const timer = useRef(null)
  const reset = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(callback, timeout)
  }, [callback, timeout])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(e => document.addEventListener(e, reset))
    reset()
    return () => {
      clearTimeout(timer.current)
      events.forEach(e => document.removeEventListener(e, reset))
    }
  }, [reset])
}

// Document title hook
export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} — MSME BMS` : 'MSME BMS'
    return () => { document.title = prev }
  }, [title])
}

// Previous value hook
export function usePrevious(value) {
  const ref = useRef()
  useEffect(() => { ref.current = value })
  return ref.current
}

// Toggle hook
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  return [value, toggle, setTrue, setFalse]
}

// Scroll to top
export function useScrollToTop() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
}
