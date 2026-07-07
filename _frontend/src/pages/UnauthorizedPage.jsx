import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-4">
        <ShieldX className="h-10 w-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Access denied</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">You don't have permission to view this page. Contact your administrator if you think this is a mistake.</p>
      <Button asChild><Link to="/dashboard">Back to dashboard</Link></Button>
    </div>
  )
}
