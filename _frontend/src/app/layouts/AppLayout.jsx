import { Outlet } from 'react-router-dom'

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
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        padding: '1rem'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>MSME BMS</div>
      </div>

      {/* Topbar */}
      <div style={{
        gridColumn: '2',
        gridRow: '1',
        borderBottom: '1px solid #e0e0e0',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ fontWeight: 'bold' }}>Dashboard</div>
      </div>

      {/* Main content */}
      <div style={{
        gridColumn: '2',
        gridRow: '2',
        overflow: 'auto',
        padding: '1.5rem'
      }}>
        <Outlet />
      </div>
    </div>
  )
}
