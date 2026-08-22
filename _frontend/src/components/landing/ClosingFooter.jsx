import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Building2, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  Server, 
  CheckCircle,
  Sparkles,
  Users,
  ShoppingCart,
  BookOpen,
  Package
} from 'lucide-react'

export default function ClosingFooter() {
  const navigate = useNavigate()

  const quickRoles = [
    { title: 'Business Owner', email: 'admin@ssme.com', icon: Building2, desc: 'Full business dashboard & approvals' },
    { title: 'Cashier / POS', email: 'cashier@ssme.com', icon: ShoppingCart, desc: 'Fast barcode checkout & till sessions' },
    { title: 'Inventory Officer', email: 'inventoryofficer@ssme.com', icon: Package, desc: 'Warehouse bins & stock adjustments' },
    { title: 'Accountant', email: 'accountant@ssme.com', icon: BookOpen, desc: 'Double-entry ledger, tax & journal vouchers' }
  ]

  return (
    <section className="relative bg-slate-900 border-t border-slate-800 text-slate-200 overflow-hidden">
      {/* Subtle Glow Background */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Main Closing Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        {/* Action Banner Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-indigo-950/80 border border-blue-500/20 shadow-2xl backdrop-blur-xl mb-16">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready For Instant Production Use</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Experience seamless business operations with zero guesswork.
              </h2>
              <p className="text-slate-300 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
                Sign in to your pre-configured branch and begin processing sales, tracking inventory stocks, and posting balanced financial journals right away.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <button
                onClick={() => navigate('/auth/login')}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Launch System Login</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="text-center">
                <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Tenant Isolated · 10 Active Roles</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Role Launcher Grid */}
          <div className="mt-10 pt-8 border-t border-slate-800/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Direct Role Access Shortcuts
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickRoles.map((role) => {
                const Icon = role.icon
                return (
                  <div
                    key={role.title}
                    onClick={() => navigate('/auth/login')}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        {role.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{role.desc}</p>
                    <div className="text-[11px] font-mono text-slate-500 mt-2 flex items-center justify-between">
                      <span>{role.email}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">MSME BMS</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Engineered for commercial enterprises in Kenya and beyond. Normalized MySQL architecture, real-time POS, warehouse management, and strict double-entry accounting.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Database: MySQL 8.0 (msme_db)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-sm font-bold text-white uppercase tracking-wider">System Modules</div>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => navigate('/auth/login')} className="hover:text-white transition-colors">
                  Point of Sale (POS)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/auth/login')} className="hover:text-white transition-colors">
                  Inventory & Warehousing
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/auth/login')} className="hover:text-white transition-colors">
                  Double-Entry Accounting
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/auth/login')} className="hover:text-white transition-colors">
                  HR & Payroll Processing
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Support & Headquarters */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-sm font-bold text-white uppercase tracking-wider">Headquarters & Support</div>
            <div className="space-y-2.5 text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+254 700 000 000</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>admin@ssme.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} MSME Business Management System. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-400 transition-colors">Version 1.0.0 (Production)</span>
            <span>·</span>
            <span className="hover:text-slate-400 transition-colors">Relational 3NF Architecture</span>
          </div>
        </div>
      </div>
    </section>
  )
}
