export default function DashboardMinimal() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Welcome to Dashboard
      </h1>
      <p>This is a minimal dashboard page with no dynamic content.</p>
      <div style={{ 
        marginTop: '2rem',
        padding: '2rem',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Static Content</h2>
        <p>If this page is stable, we can gradually add back features.</p>
      </div>
    </div>
  )
}
