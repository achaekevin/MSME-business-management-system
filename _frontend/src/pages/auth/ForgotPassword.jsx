// ForgotPassword.jsx
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { forgotPasswordSchema } from '@/validations'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { Input, Label, Alert } from '@/components/ui'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data) => {
    try {
      await authService.forgotPassword(data.email)
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-6">
          We sent a password reset link to <strong>{getValues('email')}</strong>
        </p>
        <Link to="/auth/login" className="text-primary hover:underline text-sm">
          ← Back to login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Reset your password</h1>
      <p className="text-muted-foreground mb-6">Enter your email and we'll send you a reset link</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="you@company.com" className="mt-1" {...register('email')} />
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>Send reset link</Button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to login
        </Link>
      </div>
    </div>
  )
}
