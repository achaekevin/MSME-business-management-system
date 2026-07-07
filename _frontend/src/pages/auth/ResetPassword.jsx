import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPasswordSchema } from '@/validations'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input, Label, Alert } from '@/components/ui'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const token = params.get('token')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  })

  const onSubmit = async (data) => {
    try {
      await authService.resetPassword({ token, password: data.password })
      toast.success('Password reset successfully')
      navigate('/auth/login')
    } catch (err) {
      toast.error(err.message || 'Reset failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Set new password</h1>
      <p className="text-muted-foreground mb-6">Choose a strong password for your account</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>New password</Label>
          <div className="relative mt-1">
            <Input type={showPw ? 'text' : 'password'} placeholder="••••••••" className="pr-10" {...register('password')} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input type="password" placeholder="••••••••" className="mt-1" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>Reset password</Button>
      </form>
    </div>
  )
}
