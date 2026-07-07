import { Outlet } from 'react-router-dom'
import { Building2 } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">MSME BMS</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Run your business<br />with confidence
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            The complete business management platform for small and medium enterprises.
            Sales, inventory, finance, and more — in one place.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Active businesses', value: '12,000+' },
              { label: 'Transactions processed', value: '$2B+' },
              { label: 'Countries', value: '45+' },
              { label: 'Uptime', value: '99.9%' }
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">© 2024 MSME BMS. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background rounded-l-3xl lg:rounded-l-3xl">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">MSME BMS</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
