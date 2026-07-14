import { Outlet } from 'react-router-dom'
import { Building2 } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-8">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">MSME BMS</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
