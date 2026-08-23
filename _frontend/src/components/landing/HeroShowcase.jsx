import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useLiveSystemData } from '@/hooks/useLiveSystemData'
import { 
  Building2, 
  ArrowRight, 
  Sun, 
  Moon, 
  ShoppingCart, 
  Package, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Truck, 
  Receipt, 
  Layers, 
  TrendingUp, 
  Lock, 
  Menu, 
  X, 
  RefreshCw 
} from 'lucide-react'

export default function HeroShowcase() {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { isAuthenticated } = useAuthStore()
  const { stats, isLoading, refreshData } = useLiveSystemData()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Showcase', href: '#showcase' },
    { name: 'Workflow', href: '#workflow' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'Security', href: '#security' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' }
  ]

  const handleNavClick = (href) => {
    setIsMobileMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const coreCapabilities = [
    {
      icon: ShoppingCart,
      title: 'Point of Sale & Tills',
      description: 'Barcode checkout, cash drawer sessions, split payments, and instant M-Pesa receipt reconciliation.'
    },
    {
      icon: Package,
      title: 'Multi-Warehouse Inventory',
      description: 'Stock batch movements, bin transfers, automated reorder thresholds, and FIFO/weighted valuation.'
    },
    {
      icon: BookOpen,
      title: 'Double-Entry General Ledger',
      description: 'Automated trial balance, balance sheets, and tax invoices complying with KRA accounting standards.'
    },
    {
      icon: Users,
      title: 'HR & Payroll Processing',
      description: 'Automatic PAYE, NHIF, NSSF statutory tax deductions, and itemized pay slip generations.'
    },
    {
      icon: Truck,
      title: 'Procurement & Supplier Bills',
      description: 'Purchase orders, Goods Received Notes (GRN) matching, and supplier payment aging tracking.'
    },
    {
      icon: Receipt,
      title: 'Invoicing & Receivables',
      description: 'Tax-compliant invoices, automated customer statement reconciliations, and aging credit control.'
    },
    {
      icon: Layers,
      title: 'Multi-Branch Management',
      description: 'Centralized headquarters oversight, inter-branch stock requisitions, and consolidated reporting.'
    },
    {
      icon: ShieldCheck,
      title: 'Role-Based Access & Audit',
      description: 'Granular cashier and accountant permissions with immutable activity and transaction audit logs.'
    }
  ]

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800 py-3.5' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">MSME BMS</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.href)}
                className="px-3.5 py-1.5 rounded-lg text-sm sm:text-base font-medium text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="px-4 py-2 rounded-lg border border-slate-800 text-sm sm:text-base font-medium text-slate-200 hover:text-white hover:bg-slate-900 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base font-medium transition-all shadow-sm"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 lg:hidden rounded-lg border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-5 backdrop-blur-xl"
            >
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.href)}
                    className="text-left px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                  >
                    {link.name}
                  </button>
                ))}
                <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      navigate('/auth/register')
                    }}
                    className="w-full py-3 rounded-lg bg-blue-600 text-white text-base font-semibold flex items-center justify-center gap-2"
                  >
                    <span>Sign Up</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Center Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20 text-center flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200 text-xs sm:text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Commercial Business Management System
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight mb-6 max-w-4xl mx-auto">
            Manage your sales, inventory, and accounting in one place.
          </h1>

          <p className="text-base sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-10 font-normal">
            A unified business operating system designed for retail and wholesale operations. Connect cashier till sessions, warehouse stock transfers, and automated general ledger journals without manual reconciliation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <button
              onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/auth/register')}
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base sm:text-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Live Interactive Product Dashboard Preview Frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto w-full max-w-5xl mb-16"
        >
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-blue-600/20 blur-xl opacity-60 pointer-events-none" />

          {/* Browser / App Mockup Window */}
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-left">
            {/* Top Window Bar */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
                <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
                <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
                <div className="ml-3 hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>app.msmebms.co.ke/dashboard</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                <button 
                  onClick={refreshData} 
                  title="Refresh Live Metrics"
                  className="hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono font-medium text-slate-200">Live System Sync</span>
                </div>
              </div>
            </div>

            {/* Dashboard Content With Live Figures */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* Top Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300 text-xs sm:text-sm font-medium mb-1.5">
                    <span>Today's Sales Revenue</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    KES {Number(stats.todayRevenue).toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1">
                    {stats.revenueGrowth} from previous period
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300 text-xs sm:text-sm font-medium mb-1.5">
                    <span>Active Branches / Tills</span>
                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    {stats.activeTills}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Cashier drawer sessions open
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300 text-xs sm:text-sm font-medium mb-1.5">
                    <span>Stock Reorder Alerts</span>
                    <Package className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    {stats.lowStockCount} Items Low
                  </div>
                  <div className="text-xs text-amber-400 mt-1 font-medium">
                    Automated reorder triggers
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300 text-xs sm:text-sm font-medium mb-1.5">
                    <span>Operating Margin</span>
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    {stats.netMargin}
                  </div>
                  <div className="text-xs text-emerald-400 mt-1 font-medium">
                    Gross KES {Number(stats.mtdGross).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Chart & Live Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Sales Volume Trends */}
                <div className="lg:col-span-7 p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-bold text-white">Daily Sales & Settlement Volume</div>
                      <div className="text-xs text-slate-300">Cash vs M-Pesa automated reconciliation</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      Real-time Feed
                    </span>
                  </div>

                  {/* Visual Bar Graph */}
                  <div className="h-36 flex items-end justify-between gap-3 pt-4">
                    {stats.dailyBars.map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div className="w-full max-w-[32px] flex items-end justify-center gap-1 h-full">
                          <div 
                            style={{ height: bar.h1 }} 
                            className="w-1/2 bg-blue-600 rounded-t-sm transition-all hover:bg-blue-500" 
                          />
                          <div 
                            style={{ height: bar.h2 }} 
                            className="w-1/2 bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-400" 
                          />
                        </div>
                        <span className="text-xs text-slate-300 font-mono font-medium">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Transactions Feed */}
                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold text-white">Live System Events</div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="space-y-2.5">
                    {stats.recentTransactions.map((tx, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${
                            tx.type === 'sale' ? 'bg-emerald-400' : tx.type === 'stock' ? 'bg-blue-400' : 'bg-amber-400'
                          }`} />
                          <div>
                            <div className="font-medium text-white truncate max-w-[170px] sm:max-w-[200px]">{tx.text}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{tx.id} · {tx.time}</div>
                          </div>
                        </div>
                        <span className={`font-mono text-xs sm:text-sm font-bold ${
                          tx.type === 'sale' ? 'text-emerald-400' : tx.type === 'stock' ? 'text-blue-400' : 'text-slate-200'
                        }`}>
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 1: Core Capabilities (8 Cards) with Large Crisp Typography */}
        <div id="features" className="pt-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Comprehensive Enterprise Capabilities
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
              Every tool your commercial enterprise needs to manage procurement, sales, stock batches, and double-entry accounting.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left"
          >
            {coreCapabilities.map((item) => {
              const Icon = item.icon
              return (
                <div 
                  key={item.title}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-105 group-hover:bg-blue-600/20 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">{item.description}</p>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
