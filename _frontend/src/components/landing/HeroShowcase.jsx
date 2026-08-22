import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Building2, 
  ArrowRight, 
  Sun, 
  Moon, 
  ShoppingCart, 
  Package, 
  BookOpen, 
  Users, 
  CheckCircle2,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react'

export default function HeroShowcase() {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const coreCapabilities = [
    {
      icon: ShoppingCart,
      title: 'Point of Sale & Tills',
      description: 'Barcode checkout, cash drawer sessions, and instant M-Pesa receipt reconciliation.'
    },
    {
      icon: Package,
      title: 'Multi-Warehouse Inventory',
      description: 'Real-time stock valuation using FIFO costing, batch tracking, and reorder alerts.'
    },
    {
      icon: BookOpen,
      title: 'Double-Entry Accounting',
      description: 'Automated journal vouchers, trial balance, P&L reports, and standard 16% VAT filing.'
    },
    {
      icon: Users,
      title: 'HR & Automated Payroll',
      description: '10 enterprise role permissions, employee attendance logging, and statutory deduction processing.'
    }
  ]

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${isScrolled ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              MSME BMS
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="px-4 py-2 rounded-lg border border-slate-800 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-900 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Center Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20 text-center flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Commercial Business Management System
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight mb-6 max-w-4xl mx-auto">
            Manage your sales, inventory, and accounting in one place.
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            A unified business operating system designed for retail and wholesale operations. Connect cashier till sessions, warehouse stock transfers, and automated general ledger journals without manual reconciliation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/auth/login')}
              className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-base flex items-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-base transition-colors"
            >
              Create Account
            </button>
          </div>
        </motion.div>

        {/* 4 Core Pillars Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left pt-10 border-t border-slate-800/80"
        >
          {coreCapabilities.map((item) => {
            const Icon = item.icon
            return (
              <div 
                key={item.title}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
