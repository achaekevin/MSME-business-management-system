import axios from 'axios'
import { API_BASE_URL, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants'
import { storage } from '@/utils'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = storage.get(AUTH_TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`

    const businessId = storage.get('msme_business')?.id
    if (businessId) config.headers['X-Business-ID'] = businessId

    // CSRF token
    const csrf = document.cookie.match(/csrf_token=([^;]+)/)
    if (csrf) config.headers['X-CSRF-Token'] = csrf[1]

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = storage.get(REFRESH_TOKEN_KEY)
        if (!refreshToken) throw new Error('No refresh token')

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        const { token } = res.data.data

        storage.set(AUTH_TOKEN_KEY, token)
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        storage.remove(AUTH_TOKEN_KEY)
        storage.remove(REFRESH_TOKEN_KEY)
        window.location.href = '/auth/login?expired=true'
      }
    }

    const message = error.response?.data?.message || error.message || 'Something went wrong'
    return Promise.reject({ message, statusCode: error.response?.status, errors: error.response?.data?.errors })
  }
)

export default api

// Convenience methods
export const get = (url, params) => api.get(url, { params })
export const post = (url, data) => api.post(url, data)
export const put = (url, data) => api.put(url, data)
export const patch = (url, data) => api.patch(url, data)
export const del = (url) => api.delete(url)

export const upload = (url, file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
    }
  })
}
