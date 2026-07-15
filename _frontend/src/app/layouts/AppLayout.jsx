import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Topbar } from '@/components/navigation/Topbar'
import { Toaster } from 'react-hot-toast'
import { memo } from 'react'

const MemoizedSidebar = memo(Sidebar)
const MemoizedTopbar = memo(Topbar)

export function AppLayout() {
  return (
    <>
      <MemoizedSidebar />
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
        <MemoizedTopbar />
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
