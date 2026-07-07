import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '@/constants'
import { storage } from '@/utils'

export const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        twoFactorPending: false,
        twoFactorUserId: null,

        setAuth: (user, token, refreshToken) => {
          storage.set(AUTH_TOKEN_KEY, token)
          if (refreshToken) storage.set(REFRESH_TOKEN_KEY, refreshToken)
          set({ user, token, refreshToken, isAuthenticated: true, twoFactorPending: false })
        },

        setUser: (user) => set({ user }),

        clearAuth: () => {
          storage.remove(AUTH_TOKEN_KEY)
          storage.remove(REFRESH_TOKEN_KEY)
          storage.remove(USER_KEY)
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
        },

        setLoading: (isLoading) => set({ isLoading }),

        setTwoFactorPending: (userId) => set({ twoFactorPending: true, twoFactorUserId: userId }),

        hasPermission: (permission) => {
          const { user } = get()
          if (!user) return false
          if (user.role === 'owner' || user.role === 'admin') return true
          return user.permissions?.includes(permission) ?? false
        },

        hasRole: (roles) => {
          const { user } = get()
          if (!user) return false
          const roleArray = Array.isArray(roles) ? roles : [roles]
          return roleArray.includes(user.role)
        }
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
)
