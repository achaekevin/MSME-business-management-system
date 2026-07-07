import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Building2 } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { registerSchema } from '@/validations'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input, Label, Alert } from '@/components/ui'
import { getPasswordStrength } from '@/utils'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessName: '', ownerName: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: false }
  })

  const password = watch('password', '')
  const strength = getPasswordStrength(password)

  const onSubmit = async (data) => {
    setError('')
    try {
      const res = await authService.register(data)
      setAuth(res.data.user, res.data.token, res.data.refreshToken)
      toast.success('Business registered successfully!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <>
      <Helmet><title>Register — MSME BMS</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold mb-1">Register your business</h1>
        <p className="text-muted-foreground mb-6">Get started with a 14-day free trial</p>

        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" placeholder="Acme Ltd" className="mt-1" {...register('businessName')} />
              {errors.businessName && <p className="text-destructive text-xs mt-1">{errors.businessName.message}</p>}
            </div>
            <div>
              <Label htmlFor="ownerName">Your name</Label>
              <Input id="ownerName" placeholder="Jane Doe" className="mt-1" {...register('ownerName')} />
              {errors.ownerName && <p className="text-destructive text-xs mt-1">{errors.ownerName.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@company.com" className="mt-1" {...register('email')} />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" type="tel" placeholder="+1 555 000 0000" className="mt-1" {...register('phone')} />
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pr-10" {...register('password')} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-muted'}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strength.label}</p>
              </div>
            )}
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" className="mt-1" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="flex items-start gap-2">
            <input id="acceptTerms" type="checkbox" className="mt-0.5 rounded" {...register('acceptTerms')} />
            <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer leading-relaxed">
              I agree to the{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </Label>
          </div>
          {errors.acceptTerms && <p className="text-destructive text-xs">{errors.acceptTerms.message}</p>}

          <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={!isSubmitting && <Building2 className="h-4 w-4" />}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </>
  )
}
