import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { loginSchema } from '@/validations'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input, Label, Alert } from '@/components/ui'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, setTwoFactorPending } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const from = location.state?.from?.pathname || '/app/dashboard'
  const expired = new URLSearchParams(location.search).get('expired')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false }
  })

  const onSubmit = async (data) => {
    setError('')
    try {
      const res = await authService.login(data)
      if (res.data.requiresTwoFactor) {
        setTwoFactorPending(res.data.userId)
        navigate('/auth/2fa')
        return
      }
      setAuth(res.data.user, res.data.token, res.data.refreshToken)
      toast.success(`Welcome back, ${res.data.user.name}!`)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    }
  }

  return (
    <>
      <Helmet><title>Log in — MSME BMS</title></Helmet>

      <div>
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-muted-foreground mb-6">Log in to your account to continue</p>

        {expired && (
          <Alert variant="warning" className="mb-4">
            Your session expired. Please log in again.
          </Alert>
        )}
        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              className="mt-1"
              {...register('email')}
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password">Password</Label>
              <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input id="rememberMe" type="checkbox" className="rounded" {...register('rememberMe')} />
            <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">Remember me for 30 days</Label>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={!isSubmitting && <LogIn className="h-4 w-4" />}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-primary font-medium hover:underline">
            Register your business
          </Link>
        </p>
      </div>
    </>
  )
}
