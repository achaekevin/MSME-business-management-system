import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ShoppingCart, 
  Package, 
  BookOpen, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Building2, 
  Sun, 
  Moon, 
  Barcode, 
  Check, 
  Sparkles, 
  Clock, 
  Database,
  ArrowUpRight,
  Layers
} from 'lucide-react'

export default function HeroShowcase() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pos')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Interactive POS simulation state
  const [posItems, setPosItems] = useState([
    { id: 1, name: 'Logitech M720 Triathlon Mouse', sku: 'SKU-LOGI-M720', price: 3500, qty: 1 },
    { id: 2, name: 'RGB Mechanical Keyboard 104-Key', sku: 'SKU-KEY-RGB104', price: 6800, qty: 1 }
  ])
  const [stockCount, setStockCount] = useState(45)
  const [simulatingSale, setSimulatingSale] = useState(false)
  const [saleCompleted, setSaleCompleted] = useState(false)
  const [todayRevenue, setTodayRevenue] = useState(148500)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Trigger realistic sale animation
  const handleSimulateSale = () => {
    if (simulatingSale) return
    setSimulatingSale(true)
    setSaleCompleted(false)

    setTimeout(() => {
      setStockCount((prev) => Math.max(0, prev - 1))
      setTodayRevenue((prev) => prev + 3500)
      setSimulatingSale(false)
      setSaleCompleted(true)
      setTimeout(() => setSaleCompleted(false), 4000)
    }, 1200)
  }

  const subtotal = posItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  const vat = Math.round(subtotal * 0.16)
  const grandTotal = subtotal + vat

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Background Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] bg-blue-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-[60%] -right-[200px] w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                MSME <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">BMS</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('pos')}
              className={`text-sm font-medium transition-colors ${activeTab === 'pos' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}
            >
              POS Register
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}
            >
              Stock Ledger
            </button>
            <button 
              onClick={() => setActiveTab('accounting')}
              className={`text-sm font-medium transition-colors ${activeTab === 'accounting' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}
            >
              Double-Entry Accounting
            </button>
            <button 
              onClick={() => setActiveTab('hr')}
              className={`text-sm font-medium transition-colors ${activeTab === 'hr' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}
            >
              HR & Payroll
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900/80 text-sm font-medium text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-20 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Multi-Tenant Business OS · Kenyan Shillings Ready
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] mb-6"
          >
            From POS checkout to double-entry ledger in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              one unified flow.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8"
          >
            Everything a growing MSME needs: cashier till sessions, warehouse bin transfers, balanced accounting entries, and localized payroll — built on MySQL with zero disconnected modules.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/auth/login')}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              <span>Access System</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#interactive-demo"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-base transition-all hover:border-slate-600 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Explore Live Engine</span>
            </a>
          </motion.div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800/80">
            <div className="text-center">
              <div className="text-2xl font-bold text-white tracking-tight">10 Roles</div>
              <div className="text-xs text-slate-400 mt-1">RBAC Security Hierarchy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">100%</div>
              <div className="text-xs text-slate-400 mt-1">Debit & Credit Balance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 tracking-tight">Real-Time</div>
              <div className="text-xs text-slate-400 mt-1">Multi-Branch Sync</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400 tracking-tight">KES + USD</div>
              <div className="text-xs text-slate-400 mt-1">Multi-Currency & VAT</div>
            </div>
          </div>
        </div>

        {/* ── Interactive Engine Showcase Section ── */}
        <div id="interactive-demo" className="mt-8">
          {/* Module Selection Pills */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-6">
            {[
              { id: 'pos', label: 'Point of Sale & Till', icon: ShoppingCart },
              { id: 'inventory', label: 'Warehouse & Stock', icon: Package },
              { id: 'accounting', label: 'General Ledger', icon: BookOpen },
              { id: 'hr', label: 'HR & Payroll', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40 scale-105'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Interactive Showcase Window */}
          <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Window Topbar */}
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-medium text-slate-400 ml-3 hidden sm:inline-block">
                  MSME BMS Enterprise · Head Office Branch · Session: Active
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  MySQL Live Connected
                </span>
                <span className="text-xs font-mono text-slate-400 hidden md:inline-block">
                  DB: msme_db
                </span>
              </div>
            </div>

            {/* Window Content Tab Switching */}
            <div className="p-6 sm:p-8 min-h-[480px]">
              <AnimatePresence mode="wait">
                {activeTab === 'pos' && (
                  <motion.div
                    key="pos-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid lg:grid-cols-12 gap-6"
                  >
                    {/* POS Register Left (Order Items) */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-blue-400" />
                            <span>Active POS Checkout</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Till #01 · Cashier: Jane (Head Office)</p>
                        </div>

                        <button
                          onClick={handleSimulateSale}
                          disabled={simulatingSale}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          <Barcode className="w-4 h-4" />
                          <span>{simulatingSale ? 'Processing...' : 'Scan & Record Sale'}</span>
                        </button>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2.5">
                        {posItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Package className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                                <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>{item.sku}</span>
                                  <span>·</span>
                                  <span className="text-emerald-400">Stock: {stockCount} pcs</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-white">KES {item.price.toLocaleString()}</div>
                              <div className="text-xs text-slate-500">Qty: {item.qty}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Live Action Alert Notice */}
                      {saleCompleted && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <div>
                              <div className="font-bold text-white">Sale Completed & Reconciled</div>
                              <div className="text-[11px] text-emerald-300/90 mt-0.5">
                                Stock decremented to {stockCount} · Invoice #INV-{Date.now().toString().slice(-4)} created · Journal Entry balanced
                              </div>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-emerald-300">+KES 3,500</span>
                        </motion.div>
                      )}
                    </div>

                    {/* POS Register Right (Totals & Instant Ledger Link) */}
                    <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-950/90 border border-slate-800">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">
                          Order Breakdown & Automatic Tax
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between text-slate-300">
                            <span>Subtotal (Net)</span>
                            <span className="font-mono font-medium text-white">KES {subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="flex items-center gap-1">
                              <span>VAT (16.00%)</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Standard</span>
                            </span>
                            <span className="font-mono font-medium text-white">KES {vat.toLocaleString()}</span>
                          </div>
                          <div className="h-px bg-slate-800 my-2" />
                          <div className="flex justify-between text-base font-bold text-white">
                            <span>Total Payable</span>
                            <span className="font-mono text-emerald-400 text-lg">KES {grandTotal.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="mt-6">
                          <div className="text-xs text-slate-400 mb-2 font-medium">Payment Mode:</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500 text-center cursor-pointer">
                              <Smartphone className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                              <span className="text-xs font-semibold text-white">M-Pesa</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-slate-700 cursor-pointer">
                              <Zap className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                              <span className="text-xs text-slate-300">Cash Till</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-slate-700 cursor-pointer">
                              <Building2 className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                              <span className="text-xs text-slate-300">Card</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Today's Total Shift Revenue:</span>
                          <span className="font-mono font-bold text-white">KES {todayRevenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'inventory' && (
                  <motion.div
                    key="inventory-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Package className="w-5 h-5 text-emerald-400" />
                          <span>Multi-Warehouse Real-Time Stock Ledger</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Bin-level tracking, reorder thresholds, and inter-branch transfers
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                          Warehouse: Main HQ (Nairobi)
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="text-xs text-slate-400">Total Catalog Items</div>
                        <div className="text-2xl font-bold text-white mt-1">1,248 SKUs</div>
                        <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          All Barcodes Verified
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="text-xs text-slate-400">Total Stock Valuation</div>
                        <div className="text-2xl font-bold text-blue-400 mt-1">KES 4,890,500</div>
                        <div className="text-[11px] text-slate-400 mt-1">FIFO Costing Basis</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="text-xs text-slate-400">Active Stock Alerts</div>
                        <div className="text-2xl font-bold text-yellow-400 mt-1">2 Low Stock</div>
                        <div className="text-[11px] text-yellow-300/80 mt-1">Automatic PO Triggered</div>
                      </div>
                    </div>

                    {/* Stock Table */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4 font-semibold">Product Name</th>
                            <th className="py-3 px-4 font-semibold">SKU / Barcode</th>
                            <th className="py-3 px-4 font-semibold">Cost Price</th>
                            <th className="py-3 px-4 font-semibold">Selling Price</th>
                            <th className="py-3 px-4 font-semibold">On Hand</th>
                            <th className="py-3 px-4 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          <tr>
                            <td className="py-3 px-4 font-medium text-white">Logitech M720 Triathlon Mouse</td>
                            <td className="py-3 px-4 font-mono text-slate-400">SKU-LOGI-M720</td>
                            <td className="py-3 px-4 font-mono">KES 2,200</td>
                            <td className="py-3 px-4 font-mono text-white font-semibold">KES 3,500</td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">{stockCount} pcs</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">In Stock</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium text-white">RGB Mechanical Keyboard 104-Key</td>
                            <td className="py-3 px-4 font-mono text-slate-400">SKU-KEY-RGB104</td>
                            <td className="py-3 px-4 font-mono">KES 4,500</td>
                            <td className="py-3 px-4 font-mono text-white font-semibold">KES 6,800</td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">28 pcs</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">In Stock</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium text-white">Gigabit 24-Port Managed Switch</td>
                            <td className="py-3 px-4 font-mono text-slate-400">SKU-NET-SW24G</td>
                            <td className="py-3 px-4 font-mono">KES 18,000</td>
                            <td className="py-3 px-4 font-mono text-white font-semibold">KES 26,500</td>
                            <td className="py-3 px-4 font-mono font-bold text-yellow-400">3 pcs</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-semibold">Reorder Soon</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'accounting' && (
                  <motion.div
                    key="accounting-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                          <span>Strict Double-Entry General Ledger</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Total Debits strictly equal Total Credits. Zero unbalanced journal entries.
                        </p>
                      </div>
                      <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ledger Balanced</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Journal Voucher Preview */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-300">Journal Entry #JE-2026-088</span>
                          <span className="text-[10px] font-mono text-slate-500">Source: POS Sale #9012</span>
                        </div>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="p-2 rounded-lg bg-slate-900 flex justify-between">
                            <span className="text-slate-300">DR 1000 - Cash & Till Account</span>
                            <span className="font-bold text-emerald-400">KES 3,500.00</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 flex justify-between">
                            <span className="text-slate-300">CR 4000 - Sales Revenue</span>
                            <span className="font-bold text-blue-400">KES 3,017.24</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 flex justify-between">
                            <span className="text-slate-300">CR 2200 - VAT Output Tax (16%)</span>
                            <span className="font-bold text-indigo-400">KES 482.76</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-xs font-bold text-white">
                          <span>Total Balanced Leg:</span>
                          <span className="font-mono text-emerald-400">KES 3,500.00 = KES 3,500.00</span>
                        </div>
                      </div>

                      {/* Chart of Accounts Summary */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="text-xs font-semibold text-slate-300 mb-3">Chart of Accounts Real-Time Status</div>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">1000 - Assets (Cash, Bank, Inventory)</span>
                            <span className="font-mono font-bold text-white">KES 6,240,000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">2000 - Liabilities (Accounts Payable)</span>
                            <span className="font-mono font-bold text-yellow-400">KES 820,000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">3000 - Owner's Equity</span>
                            <span className="font-mono font-bold text-blue-400">KES 4,500,000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">4000 - Net Operating Revenue</span>
                            <span className="font-mono font-bold text-emerald-400">KES 1,280,000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'hr' && (
                  <motion.div
                    key="hr-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-400" />
                          <span>HR, Attendance & Automated Payroll</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          10 primary system roles, shift tracking, and statutory salary deduction calculator
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/30">
                        Payroll Period: August 2026
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="text-xs text-slate-400">Active Staff Members</div>
                        <div className="text-2xl font-bold text-white mt-1">9 Team Roles</div>
                        <div className="text-[11px] text-emerald-400 mt-1">100% Present Today</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="text-xs text-slate-400">Gross Monthly Payroll</div>
                        <div className="text-2xl font-bold text-purple-400 mt-1">KES 645,000</div>
                        <div className="text-[11px] text-slate-400 mt-1">PAYE & Statutory Configured</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="text-xs text-slate-400">Leave Requests</div>
                        <div className="text-2xl font-bold text-blue-400 mt-1">1 Approved</div>
                        <div className="text-[11px] text-slate-400 mt-1">Annual Paid Leave</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-slate-300 font-medium">Auto Journal Integration:</span>
                        <span className="text-slate-400">Posting payroll run automatically debits Salaries Expense and credits Net Payables.</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">Status: Ready</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
