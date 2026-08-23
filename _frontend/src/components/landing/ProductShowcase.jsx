import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveSystemData } from '@/hooks/useLiveSystemData'
import { 
  ShoppingCart, 
  Package, 
  BookOpen, 
  Truck, 
  Users, 
  CheckCircle2, 
  QrCode
} from 'lucide-react'

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState('pos')
  const { stats } = useLiveSystemData()

  const tabs = [
    {
      id: 'pos',
      label: 'Point of Sale & Tills',
      icon: ShoppingCart,
      badge: 'Cashier Terminal'
    },
    {
      id: 'inventory',
      label: 'Warehouse & Stock',
      icon: Package,
      badge: 'Multi-Location'
    },
    {
      id: 'accounting',
      label: 'General Ledger (GL)',
      icon: BookOpen,
      badge: 'Double-Entry'
    },
    {
      id: 'procurement',
      label: 'Procurement & Bills',
      icon: Truck,
      badge: 'Supply Chain'
    },
    {
      id: 'hr',
      label: 'HR & Statutory Payroll',
      icon: Users,
      badge: 'KRA / NSSF / NHIF'
    }
  ]

  // Calculate live POS total from stats.posProducts
  const posTotal = stats.posProducts.reduce((sum, item) => {
    const val = Number(String(item.total).replace(/,/g, '')) || 0
    return sum + val
  }, 0)

  return (
    <section id="showcase" className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Large Crisp Typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            Modular Enterprise Engine
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Everything connected in one platform
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal">
            Experience a unified workspace where cashier till sessions automatically post general ledger debits and credits, update warehouse batch levels, and generate financial reports.
          </p>
        </motion.div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {activeTab === 'pos' && (
            <motion.div
              key="pos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl"
            >
              {/* Left Info */}
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs sm:text-sm font-mono border border-blue-500/20">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Real-Time Cashier Checkout</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  High-Speed POS & Till Drawer Control
                </h3>
                <p className="text-base text-slate-300 leading-relaxed font-normal">
                  Engineered for busy retail desks, supermarket lanes, and wholesale counter sales. Barcode scanning with instant till session opening, cash floating, and M-Pesa automatic reference validation.
                </p>

                <div className="space-y-3.5 pt-2">
                  {[
                    'Instant Barcode search & hotkey quantity incrementing',
                    'Split payments: Cash, M-Pesa STK Push, and Bank Card',
                    'Automated cashier till shift opening, closing, & variance audits',
                    'Direct thermal receipt printing & SMS/Email digital copies'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Mock UI */}
              <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-mono font-semibold text-white">Till #01 · Live POS Session</span>
                  </div>
                  <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                    System Active
                  </span>
                </div>

                {/* POS Items Table */}
                <div className="space-y-2.5 text-sm">
                  <div className="grid grid-cols-12 text-slate-400 font-mono text-xs font-semibold px-2">
                    <div className="col-span-6">Item Name</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {stats.posProducts.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 items-center p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                      <div className="col-span-6 font-medium text-white truncate">{item.name}</div>
                      <div className="col-span-2 text-center font-mono text-slate-300">{item.qty}</div>
                      <div className="col-span-2 text-right font-mono text-slate-300">{item.price}</div>
                      <div className="col-span-2 text-right font-mono font-bold text-white">{item.total}</div>
                    </div>
                  ))}
                </div>

                {/* POS Total & Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Total Payable (16% VAT Incl.)</div>
                    <div className="text-2xl font-bold font-mono text-white">KES {posTotal.toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="px-3.5 py-2 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" /> M-Pesa Ready
                    </span>
                    <button className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-500 transition-colors shadow-md">
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl"
            >
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs sm:text-sm font-mono border border-blue-500/20">
                  <Package className="w-4 h-4" />
                  <span>Warehouse Inventory Control</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  Multi-Warehouse & Batch Movements
                </h3>
                <p className="text-base text-slate-300 leading-relaxed font-normal">
                  Track stock across multiple storage warehouses, store branch floors, and quarantine bins. Automated minimum threshold alerts ensure you never experience stock-outs.
                </p>

                <div className="space-y-3.5 pt-2">
                  {[
                    'Inter-warehouse stock requisitions & transit verification',
                    'Batch & expiry date tracking with FIFO/FEFO rules',
                    'Automated purchase reorder point calculations',
                    'Stocktake reconciliation & adjustment audit trail'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm">
                  <div className="text-white font-semibold">Live Warehouse Stock Extract</div>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    Live Status
                  </span>
                </div>

                <div className="space-y-2.5 text-sm">
                  {stats.inventoryItems.map((item, i) => (
                    <div key={i} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-xs text-slate-400">{item.sku}</div>
                        <div className="text-white font-semibold text-base">{item.name}</div>
                        <div className="text-xs text-slate-400 font-mono">Valuation: {item.val}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-base">{item.stock}</div>
                        <div className={`text-xs font-semibold ${
                          item.status === 'Healthy' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>{item.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'accounting' && (
            <motion.div
              key="accounting"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl"
            >
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs sm:text-sm font-mono border border-blue-500/20">
                  <BookOpen className="w-4 h-4" />
                  <span>Double-Entry General Ledger</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  Automated Journal Entries & Balance Sheet
                </h3>
                <p className="text-base text-slate-300 leading-relaxed font-normal">
                  Eliminate manual month-end bookkeeping. Every sale, purchase invoice, payroll payout, and stock write-off generates automated, balanced debit and credit entries according to standard Chart of Accounts.
                </p>

                <div className="space-y-3.5 pt-2">
                  {[
                    'Instant real-time Trial Balance, P&L, & Balance Sheet',
                    'KRA VAT (16%), Withholding Tax, and Exempt classification',
                    'Customer & Supplier Accounts Aging ledgers',
                    'Multi-bank reconciliation and cash flow statements'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm">
                  <div className="text-white font-semibold">Real-Time Trial Balance Extract</div>
                  <span className="font-mono text-emerald-400 text-xs font-bold">Debit = Credit (Balanced)</span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="grid grid-cols-12 text-slate-400 font-mono text-xs font-semibold px-2">
                    <div className="col-span-6">Account Title</div>
                    <div className="col-span-3 text-right">Debit (KES)</div>
                    <div className="col-span-3 text-right">Credit (KES)</div>
                  </div>
                  {stats.ledgerAccounts.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 items-center p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm">
                      <div className="col-span-6 text-white font-medium truncate">{row.acc}</div>
                      <div className="col-span-3 text-right text-emerald-400 font-bold">{row.dr}</div>
                      <div className="col-span-3 text-right text-blue-400 font-bold">{row.cr}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-between text-sm">
                  <span className="text-slate-200 font-semibold">Total Balanced Ledger Volume</span>
                  <span className="font-mono font-bold text-white text-base">KES 4,688,000.00</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'procurement' && (
            <motion.div
              key="procurement"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl"
            >
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs sm:text-sm font-mono border border-blue-500/20">
                  <Truck className="w-4 h-4" />
                  <span>Procurement & Supplier Relations</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  Purchase Orders & GRN Receiving
                </h3>
                <p className="text-base text-slate-300 leading-relaxed font-normal">
                  Manage vendor quotes, issue approved purchase orders, record incoming Goods Received Notes (GRN), and verify supplier invoices before releasing payment.
                </p>

                <div className="space-y-3.5 pt-2">
                  {[
                    '3-way matching: Purchase Order vs GRN vs Vendor Bill',
                    'Supplier performance & pricing comparison history',
                    'Automated stock bin allocation upon delivery receipt',
                    'Payment terms and supplier credit limit monitoring'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm">
                  <div className="text-white font-semibold">Active Purchase Orders & GRNs</div>
                  <span className="font-mono text-blue-400 text-xs font-bold">Live Supplier Feeds</span>
                </div>

                <div className="space-y-2.5 text-sm">
                  {stats.purchaseOrders.map((po, i) => (
                    <div key={i} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-blue-400 font-bold">{po.id}</div>
                        <div className="text-white font-semibold text-base">{po.vendor}</div>
                        <div className="text-xs text-slate-400 font-mono">{po.items}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-base">{po.total}</div>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-200">
                          {po.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'hr' && (
            <motion.div
              key="hr"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl"
            >
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs sm:text-sm font-mono border border-blue-500/20">
                  <Users className="w-4 h-4" />
                  <span>Human Resources & Statutory Payroll</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  Employee Payroll, PAYE, NSSF, & NHIF
                </h3>
                <p className="text-base text-slate-300 leading-relaxed font-normal">
                  Run compliant monthly payroll in minutes. Automated statutory tax brackets for Kenyan PAYE, Housing Levy, NSSF Tier I/II, and SHIF/NHIF deductions with itemized payslip generation.
                </p>

                <div className="space-y-3.5 pt-2">
                  {[
                    'Automated Kenyan statutory tax & deduction calculations',
                    'Shift scheduling, clock-in logs, and leave approval workflow',
                    'Itemized employee digital payslips with instant PDF export',
                    'Direct accounting journal generation for wage liabilities'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm">
                  <div className="text-white font-semibold">Monthly Payroll Run Summary</div>
                  <span className="font-mono text-emerald-400 text-xs font-bold">Staff Processed</span>
                </div>

                <div className="space-y-2.5 text-sm">
                  {stats.employees.map((emp, i) => (
                    <div key={i} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold text-base">{emp.name}</div>
                        <div className="text-xs text-slate-300 font-mono">{emp.role}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-emerald-400 font-bold text-base">Net: KES {emp.net}</div>
                        <div className="text-xs text-slate-300">Gross {emp.gross} · PAYE {emp.paye}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
