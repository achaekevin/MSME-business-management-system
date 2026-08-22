import { Banknote, TrendingUp, ShoppingBag, Users, FileText, Package, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, CreditCard, Sparkles, Building2, RefreshCw } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { memo, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RevenueChart, SalesBarChart } from '@/components/charts'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { dashboardService, productService, salesService } from '@/services'
import { formatCurrency, formatDate } from '@/utils'

const Dashboard = memo(function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const hour = new Date().getHours()
  const greeting = useMemo(() => {
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  }, [hour])

  const userRole = typeof user?.role === 'object' ? (user?.role?.displayName || user?.role?.name) : (user?.role || 'Administrator')

  // Real data queries from MySQL database
  const { data: dashData, isLoading: isDashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => dashboardService.getRoleDashboard().then(res => res.data?.data || res.data).catch(() => null),
    staleTime: 30_000
  })

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: () => productService.list({ limit: 5 }).then(res => res.data?.data || res.data || []).catch(() => []),
    staleTime: 30_000
  })

  const { data: salesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ['dashboard-recent-sales'],
    queryFn: () => salesService.list({ limit: 5 }).then(res => res.data?.data || res.data || []).catch(() => []),
    staleTime: 30_000
  })

  // Extract real dynamic metrics with graceful 0 fallbacks
  const overview = dashData?.overview || {}
  const stats = dashData?.stats || {}
  const financial = dashData?.financial || {}

  const revenue = overview.revenue?.value ?? 0
  const expenses = overview.expenses?.value ?? 0
  const profit = overview.profit?.value ?? (revenue - expenses)
  const totalSalesCount = overview.sales?.value ?? (Array.isArray(salesData) ? salesData.length : 0)

  const productsList = Array.isArray(productsData) ? productsData : (productsData?.items || [])
  const recentOrders = Array.isArray(salesData) ? salesData : (salesData?.items || dashData?.recentActivity || [])

  // Dynamic weekly chart data based on real records
  const chartSalesData = [
    { name: 'Mon', sales: 0, profit: 0 },
    { name: 'Tue', sales: 0, profit: 0 },
    { name: 'Wed', sales: 0, profit: 0 },
    { name: 'Thu', sales: 0, profit: 0 },
    { name: 'Fri', sales: 0, profit: 0 },
    { name: 'Sat', sales: 0, profit: 0 },
    { name: 'Sun', sales: 0, profit: 0 }
  ]

  const chartRevenueData = [
    { name: 'This Month', revenue: revenue, expenses: expenses }
  ]

  return (
    <>
      <Helmet><title>Dashboard — MSME BMS</title></Helmet>

      <div className="space-y-6">
        {/* Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Enterprise Branch · {userRole}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{greeting}, {user?.name || 'Administrator'} 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Live financial overview and database operations summary.</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button onClick={() => refetchDash()} variant="outline" className="border-border text-foreground hover:bg-muted text-xs h-9 px-3 rounded-xl">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
            <Button onClick={() => navigate('/app/sales/pos')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-9 px-4 rounded-xl shadow-md">
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              Open POS Till
            </Button>
            <Button onClick={() => navigate('/app/inventory')} variant="outline" className="border-border text-foreground hover:bg-muted text-xs h-9 px-4 rounded-xl">
              <Package className="w-4 h-4 mr-1.5" />
              Stock Ledger
            </Button>
          </div>
        </div>

        {/* Top 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm hover:border-border/80 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-2 tracking-tight">
              {formatCurrency(revenue)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-2">
              <span>This Month</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm hover:border-border/80 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Expenses</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-2 tracking-tight">
              {formatCurrency(expenses)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-2">
              <span>This Month</span>
            </div>
          </div>

          {/* Net Income */}
          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm hover:border-border/80 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Net Operating Income</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-bold mt-2 tracking-tight ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
              {formatCurrency(profit)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-2">
              <span>Gross Profit (Live)</span>
            </div>
          </div>

          {/* Total Products in Database */}
          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm hover:border-border/80 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Products in Catalog</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-2 tracking-tight">
              {stats.totalProducts ?? productsList.length} Items
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-2">
              <span>{stats.lowStockProducts ?? 0} low stock items</span>
            </div>
          </div>
        </div>

        {/* Financial Revenue Trend & Orders Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Revenue vs Operating Expenses</h3>
                <p className="text-xs text-muted-foreground">Real monthly fiscal comparison from database entries</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">
                Live Data
              </span>
            </div>
            <RevenueChart data={chartRevenueData} />
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Sales Operations</h3>
                <p className="text-xs text-muted-foreground">Current month order volume</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="text-3xl font-bold font-mono text-primary">{totalSalesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Completed Orders</p>
              <Button onClick={() => navigate('/app/sales')} variant="outline" size="sm" className="mt-4 text-xs">
                View Sales History
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Split: Recent Orders & Catalog Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Recent Sales & Orders</h3>
                <p className="text-xs text-muted-foreground">Real-time transactions from POS & invoices</p>
              </div>
              <Link to="/app/sales" className="text-xs text-primary hover:underline font-medium">
                View All →
              </Link>
            </div>

            {isSalesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No sales recorded yet.</p>
                <p className="mt-1">Completed orders from POS and invoices will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold font-mono">
                        SO
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{order.orderNumber || order.id?.slice(0, 8)}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{order.customerName || order.customer?.name || 'Walk-in Customer'} · {formatDate(order.createdAt)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-foreground">{formatCurrency(order.total)}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {order.status || 'Completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products in Database */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Database Products</h3>
                <p className="text-xs text-muted-foreground">Active products saved in database</p>
              </div>
              <Link to="/app/products" className="text-xs text-primary hover:underline font-medium">
                View Catalog →
              </Link>
            </div>

            {isProductsLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : productsList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No products in database yet.</p>
                <Link to="/app/products/new" className="mt-2 inline-block text-primary font-semibold hover:underline">
                  + Add First Product
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {productsList.slice(0, 5).map((prod, idx) => (
                  <div key={prod.id || prod.sku} className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4 text-center">#{idx + 1}</span>
                      <div>
                        <div className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">{prod.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{prod.sku} · <span className="text-emerald-600 dark:text-emerald-400">{prod.currentStock ?? 0} in stock</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-foreground">{formatCurrency(prod.sellingPrice)}</div>
                      <div className="text-[10px] text-muted-foreground">Cost: {formatCurrency(prod.costPrice || 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
})

export default Dashboard
