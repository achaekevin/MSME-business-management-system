import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Topbar } from '@/components/navigation/Topbar'
import { Toaster } from 'react-hot-toast'
import { useEffect, useRef } from 'react'
import { RenderTracker } from '@/components/debug/RenderTracker'

export function AppLayout() {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      // Initialize theme once on mount
      const savedTheme = localStorage.getItem('ui-store')
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme)
          if (parsed.state?.theme === 'dark') {
            document.documentElement.classList.add('dark')
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      initialized.current = true
    }
  }, [])

  return (
    <>
      <RenderTracker name="AppLayout" />
      <Sidebar />
      <div style={{ 
        position: 'fixed',
        left: '240px',
        top: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'hsl(var(--background))'
      }}>
        <Topbar />
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
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
    </>
  )
}
