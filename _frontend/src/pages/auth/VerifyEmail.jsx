import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/button'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const token = params.get('token')

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    authService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold">Verifying your email...</h1>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Email verified!</h1>
          <p className="text-muted-foreground mb-6">Your account is ready. Log in to get started.</p>
          <Button asChild className="w-full"><Link to="/auth/login">Go to login</Link></Button>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verification failed</h1>
          <p className="text-muted-foreground mb-6">The link may have expired or is invalid.</p>
          <Link to="/auth/login" className="text-primary hover:underline text-sm">Back to login</Link>
        </>
      )}
    </div>
  )
}
