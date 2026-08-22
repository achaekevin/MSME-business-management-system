import { DollarSign, TrendingUp, ShoppingBag, Users, FileText, Package, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, CreditCard, Sparkles, Building2 } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { memo, useMemo } from 'react'
import { RevenueChart, SalesBarChart } from '@/components/charts'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/utils'

// Accurate mock data modeled after enterprise MSME metrics
const mockStats = {
  revenue: { value: 845670, change: 12.4, period: 'vs last month' },
  expenses: { value: 512330, change: 9.1, period: 'vs last month' },
  netIncome: { value: 333340, change: 18.7, period: 'vs last month' },
  cashBalance: { value: 215900, change: -3.2, period: 'vs last month' },
  outstandingInvoices: { count: 24, amount: 67800 },
  lowStockProducts: 8,
  pendingPayments: { count: 12, amount: 34500 },
  activeCustomers: 1248
}

const mockRevenueData = [
  { name: 'Jan', revenue: 620000, expenses: 410000 },
  { name: 'Feb', revenue: 680000, expenses: 435000 },
  { name: 'Mar', revenue: 710000, expenses: 460000 },
  { name: 'Apr', revenue: 760000, expenses: 480000 },
  { name: 'May', revenue: 810000, expenses: 495000 },
  { name: 'Jun', revenue: 845670, expenses: 512330 }
]

const mockSalesData = [
  { name: 'Mon', sales: 112000, profit: 42000 },
  { name: 'Tue', sales: 98000, profit: 36500 },
  { name: 'Wed', sales: 141000, profit: 54200 },
  { name: 'Thu', sales: 126000, profit: 48800 },
  { name: 'Fri', sales: 183000, profit: 71400 },
  { name: 'Sat', sales: 210000, profit: 84100 },
  { name: 'Sun', sales: 89000, profit: 32700 }
]

const mockTopProducts = [
  { name: 'Samsung Galaxy S23 Ultra 256GB', sku: 'SKU-SAMS-S23U', sales: 48, revenue: 145000 * 48, stock: '14 in stock' },
  { name: 'HP Pavilion 15" Core i7 Laptop', sku: 'SKU-HP-PAV15', sales: 32, revenue: 95500 * 32, stock: '8 in stock' },
  { name: 'Sony WH-1000XM5 Wireless Headphones', sku: 'SKU-SONY-XM5', sales: 86, revenue: 39990 * 86, stock: '22 in stock' },
  { name: 'Logitech M720 Triathlon Multi-Device', sku: 'SKU-LOGI-M720', sales: 142, revenue: 3500 * 142, stock: '44 in stock' },
  { name: 'RGB Mechanical Gaming Keyboard', sku: 'SKU-KEY-RGB104', sales: 95, revenue: 6800 * 95, stock: '28 in stock' }
]

const mockRecentVouchers = [
  { id: 'JV-1045', date: '2026-08-22', type: 'DR Cash & Till', desc: 'POS Checkout Batch #9012', amount: 3500, status: 'Posted' },
  { id: 'JV-1044', date: '2026-08-22', type: 'CR Client Payment', desc: 'TechVision Ltd Invoice Settle', amount: 12800, status: 'Posted' },
  { id: 'JV-1043', date: '2026-08-21', type: 'DR Warehouse Supplies', desc: 'Cisco Gigabit Switch Restock', amount: 18000, status: 'Posted' },
  { id: 'JV-1042', date: '2026-08-20', type: 'DR Salaries Expense', desc: 'Staff Payroll Disbursement', amount: 98400, status: 'Reconciled' }
]

const Dashboard = memo(function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const hour = new Date().getHours()
  const greeting = useMemo(() => {
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  }, [hour])

  return (
    <>
      <Helmet><title>Dashboard — MSME BMS</title></Helmet>

      <div className="space-y-6">
        {/* Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Head Office Branch · {typeof user?.role === 'object' ? (user?.role?.displayName || user?.role?.name) : (user?.role || 'Administrator')}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{greeting}, {user?.name || 'Administrator'} 👋</h1>
            <p className="text-sm text-slate-400 mt-0.5">Enterprise financial overview and real-time operations summary.</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button onClick={() => navigate('/app/sales/pos')} className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9 px-4 rounded-xl shadow-md">
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              Open POS Till
            </Button>
            <Button onClick={() => navigate('/app/inventory')} variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-9 px-4 rounded-xl">
              <Package className="w-4 h-4 mr-1.5" />
              Stock Ledger
            </Button>
          </div>
        </div>

        {/* Top 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2 tracking-tight">
              {formatCurrency(mockStats.revenue.value)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{mockStats.revenue.change}% {mockStats.revenue.period}</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Expenses</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2 tracking-tight">
              {formatCurrency(mockStats.expenses.value)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-2">
              <span>+{mockStats.expenses.change}% {mockStats.expenses.period}</span>
            </div>
          </div>

          {/* Net Income */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Net Operating Income</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-2 tracking-tight">
              {formatCurrency(mockStats.netIncome.value)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{mockStats.netIncome.change}% Profit Margin</span>
            </div>
          </div>

          {/* Cash & Bank Balance */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Cash & Bank Liquidity</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2 tracking-tight">
              {formatCurrency(mockStats.cashBalance.value)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-2">
              <span>All Till Drawers & MPesa Float</span>
            </div>
          </div>
        </div>

        {/* Financial Revenue Trend & Weekly Volume Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Revenue vs Operating Expenses</h3>
                <p className="text-xs text-slate-400">Monthly fiscal trend comparison (FIFO accrual basis)</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium">
                2026 Fiscal Year
              </span>
            </div>
            <RevenueChart data={mockRevenueData} />
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Weekly POS Volume</h3>
                <p className="text-xs text-slate-400">Daily gross turnover & gross profit</p>
              </div>
            </div>
            <SalesBarChart data={mockSalesData} />
          </div>
        </div>

        {/* Bottom Split: Recent Journal Vouchers & Top Selling Catalog Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Journal Vouchers */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Recent Journal Vouchers</h3>
                <p className="text-xs text-slate-400">Automated double-entry general ledger postings</p>
              </div>
              <Link to="/app/accounting/journal-entries" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                View Ledger →
              </Link>
            </div>

            <div className="space-y-2.5">
              {mockRecentVouchers.map((jv) => (
                <div key={jv.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold font-mono">
                      JV
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{jv.id} · {jv.type}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{jv.desc} · {jv.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-white">{formatCurrency(jv.amount)}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                      {jv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Top Performing Products</h3>
                <p className="text-xs text-slate-400">High velocity inventory items by turnover</p>
              </div>
              <Link to="/app/products" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                View Catalog →
              </Link>
            </div>

            <div className="space-y-2.5">
              {mockTopProducts.map((prod, idx) => (
                <div key={prod.sku} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-4 text-center">#{idx + 1}</span>
                    <div>
                      <div className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{prod.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{prod.sku} · <span className="text-emerald-400">{prod.stock}</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-white">{formatCurrency(prod.revenue)}</div>
                    <div className="text-[10px] text-slate-400">{prod.sales} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
})

export default Dashboard
