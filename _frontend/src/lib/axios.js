import axios from 'axios'
import { API_BASE_URL, AUTH_TOKEN_KEY, BUSINESS_KEY } from '@/constants'
import { storage } from '@/utils'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token and business context
axiosInstance.interceptors.request.use(
  (config) => {
    let token = storage.get(AUTH_TOKEN_KEY)
    if (!token) {
      const raw = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token')
      if (raw) {
        try {
          token = JSON.parse(raw)
        } catch {
          token = raw
        }
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const business = storage.get(BUSINESS_KEY)
    const businessId = business?.id || (typeof business === 'string' ? business : null)
    if (businessId) {
      config.headers['X-Business-ID'] = businessId
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if authenticated route and token is actually invalid
      if (window.location.pathname.startsWith('/app')) {
        storage.remove(AUTH_TOKEN_KEY)
        storage.remove('msme_refresh_token')
        window.location.href = '/auth/login?expired=true'
      }
    }
    return Promise.reject(error)
  }
)

export { axiosInstance }

