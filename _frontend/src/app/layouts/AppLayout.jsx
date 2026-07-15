import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Topbar } from '@/components/navigation/Topbar'
import { Toaster } from 'react-hot-toast'

export function AppLayout() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      gridTemplateRows: '64px 1fr',
      backgroundColor: '#ffffff'
    }}>
      {/* Sidebar */}
      <div style={{
        gridColumn: '1',
        gridRow: '1 / 3',
        overflow: 'hidden'
      }}>
        <Sidebar />
      </div>

      {/* Topbar */}
      <div style={{
        gridColumn: '2',
        gridRow: '1',
        overflow: 'visible',
        position: 'relative',
        zIndex: 40
      }}>
        <Topbar />
      </div>

      {/* Main content */}
      <div style={{
        gridColumn: '2',
        gridRow: '2',
        overflow: 'auto',
        padding: '1.5rem',
        backgroundColor: 'hsl(var(--background))'
      }}>
        <Outlet />
      </div>
      
      <Toaster position="top-right" />
    </div>
  )
}
