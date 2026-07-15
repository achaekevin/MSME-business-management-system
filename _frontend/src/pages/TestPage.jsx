export default function TestPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Test Page - Minimal Component
      </h1>
      <p style={{ marginBottom: '1rem' }}>
        If this page is stable (not shaking), the issue is with the Dashboard or other components.
      </p>
      <p style={{ marginBottom: '1rem' }}>
        If this page is also shaking, the issue is with the layout itself.
      </p>
      <div style={{ 
        padding: '2rem', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <p style={{ margin: 0 }}>
          Static content box - should not move at all.
        </p>
      </div>
    </div>
  )
}
