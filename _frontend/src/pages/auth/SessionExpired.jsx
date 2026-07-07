import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SessionExpired() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
        <Clock className="h-8 w-8 text-yellow-600" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Session expired</h1>
      <p className="text-muted-foreground mb-6">Your session timed out due to inactivity. Please log in again.</p>
      <Button asChild className="w-full"><Link to="/auth/login">Log in again</Link></Button>
    </div>
  )
}
