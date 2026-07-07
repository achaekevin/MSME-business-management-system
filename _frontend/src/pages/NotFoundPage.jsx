import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <div className="text-8xl font-black text-muted-foreground/20 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Button asChild><Link to="/dashboard">Back to dashboard</Link></Button>
    </div>
  )
}
