import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

export function AppLayout() {
  return (
    <>
      {/* Minimal static sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '240px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        zIndex: 50
      }}>
        <div style={{ padding: '1rem', fontWeight: 'bold' }}>MSME BMS</div>
      </div>

      {/* Main content area */}
      <div style={{ 
        position: 'fixed',
        left: '240px',
        top: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff'
      }}>
        {/* Minimal static topbar */}
        <div style={{
          height: '64px',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ fontWeight: 'bold' }}>Dashboard</div>
        </div>

        {/* Content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          <Outlet />
        </main>
      </div>
      
      <Toaster position="top-right" />
    </>
  )
}
