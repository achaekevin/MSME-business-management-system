import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location }} replace />
  return children
}

export function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />
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
