import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { storage } from '@/utils'
import { AUTH_TOKEN_KEY } from '@/constants'

export function PrivateRoute({ children }) {
  const { isAuthenticated, token } = useAuthStore()
  const location = useLocation()
  const storedToken = storage.get(AUTH_TOKEN_KEY) || localStorage.getItem('token') || localStorage.getItem(AUTH_TOKEN_KEY)

  if (!isAuthenticated || (!token && !storedToken)) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  return children
}

export function PublicRoute({ children }) {
  return children
}

export function PermissionGuard({ permission, role, fallback = null, children }) {
  const { hasPermission, hasRole } = useAuthStore()
  const hasPerm = permission ? hasPermission(permission) : true
  const hasRol = role ? hasRole(role) : true
  if (!hasPerm || !hasRol) return fallback
  return children
}

export function RoleGuard({ roles, children, fallback = null }) {
  const { hasRole } = useAuthStore()
  if (!hasRole(roles)) return fallback
  return children
}
