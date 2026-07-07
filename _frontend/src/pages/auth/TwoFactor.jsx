import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui'

export default function TwoFactor() {
  const navigate = useNavigate()
  const { twoFactorUserId, setAuth } = useAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef([])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) {
      handleVerify(next.join(''))
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handleVerify = async (otp) => {
    setError('')
    setIsLoading(true)
    try {
      const res = await authService.verifyTwoFactor({ userId: twoFactorUserId, code: otp })
      setAuth(res.data.user, res.data.token, res.data.refreshToken)
      toast.success('Verified!')
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid code. Please try again.')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <ShieldCheck className="h-8 w-8 text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold mb-1">Two-factor authentication</h1>
      <p className="text-muted-foreground mb-6">Enter the 6-digit code from your authenticator app</p>
      {error && <Alert variant="destructive" className="mb-4 text-left">{error}</Alert>}
      <div className="flex justify-center gap-2 mb-6">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={el => inputs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:border-primary focus:outline-none bg-background"
          />
        ))}
      </div>
      <Button className="w-full" isLoading={isLoading} onClick={() => handleVerify(code.join(''))}>
        Verify
      </Button>
    </div>
  )
}
