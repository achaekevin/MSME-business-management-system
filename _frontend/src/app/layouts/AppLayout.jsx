import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Topbar } from '@/components/navigation/Topbar'
import { Toaster } from 'react-hot-toast'
import { useIdleTimeout } from '@/hooks'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUIStore } from '@/store'

export function AppLayout() {
  const navigate = useNavigate()
  const { clearAuth } = useAuthStore()
  const { initTheme } = useUIStore()

  useEffect(() => { initTheme() }, [initTheme])

  useIdleTimeout(() => {
    clearAuth()
    navigate('/auth/login?expired=true')
  }, 30 * 60 * 1000)

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ position: 'fixed', width: '100%', height: '100vh' }}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6" style={{ scrollbarGutter: 'stable' }}>
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
    </div>
  )
}
