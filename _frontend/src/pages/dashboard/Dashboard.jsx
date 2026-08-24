import { memo, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Banknote, TrendingUp, ShoppingBag, Users, FileText, Package, AlertTriangle, 
  Clock, ArrowUpRight, ArrowDownRight, CreditCard, Sparkles, Building2, 
  Warehouse, Truck, UserCheck, CheckCircle2, Plus, ShoppingCart, 
  BarChart2, ShieldCheck, Calendar, Layers, Receipt, RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton } from '@/components/ui'
import { RevenueChart, SalesBarChart } from '@/components/charts'
import { useAuthStore } from '@/store/authStore'
import { dashboardService, productService, salesService, inventoryService, purchaseService, invoiceService } from '@/services'
import { formatCurrency, formatDate } from '@/utils'
import { DashboardHeader, DashboardKpiCard, DashboardAlertBanner, DashboardSection } from '@/components/dashboard'

const Dashboard = memo(function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  
  const hour = new Date().getHours()
  const greeting = useMemo(() => {
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  }, [hour])

  const userRoleRaw = typeof user?.role === 'object' ? (user?.role?.name || user?.role?.displayName) : (user?.role || 'business_owner')
  const userRoleDisplay = typeof user?.role === 'object' ? (user?.role?.displayName || user?.role?.name) : (user?.role || 'Administrator')

  // Real data queries from MySQL database
  const { data: dashData, isLoading: isDashLoading, refetch: refetchDash, isFetching: isDashFetching } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => dashboardService.getRoleDashboard().then(res => res.data?.data || res.data).catch(() => null),
    staleTime: 30_000
  })

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: () => productService.list({ limit: 6 }).then(res => res.data?.data || res.data || []).catch(() => []),
    staleTime: 30_000
  })

  const { data: salesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ['dashboard-recent-sales'],
    queryFn: () => salesService.list({ limit: 6 }).then(res => res.data?.data || res.data || []).catch(() => []),
    staleTime: 30_000
  })

  const roleKey = (userRoleRaw || '').toLowerCase()
  const overview = dashData?.overview || {}
  const stats = dashData?.stats || {}
  const financial = dashData?.financial || {}

  // -------------------------------------------------------------------------
  // 1. BUSINESS OWNER / SUPER ADMIN DASHBOARD
  // -------------------------------------------------------------------------
  const renderBusinessOwnerDashboard = () => {
    const revenue = overview.revenue?.value ?? 0
    const expenses = overview.expenses?.value ?? 0
    const profit = overview.profit?.value ?? (revenue - expenses)
    const salesCount = overview.sales?.value ?? (Array.isArray(salesData) ? salesData.length : 0)
    const lowStock = stats.lowStockProducts ?? 0
    const outstanding = financial.outstandingInvoices || {}
    const recentActivity = dashData?.recentActivity || (Array.isArray(salesData) ? salesData : [])
    const productsList = Array.isArray(productsData) ? productsData : (productsData?.items || [])

    const chartRevenueData = [
      { name: 'This Month', revenue: revenue, expenses: expenses }
    ]

    return (
      <div className="space-y-6">
        {lowStock > 0 && (
          <DashboardAlertBanner
            type="warning"
            title={`${lowStock} items are below minimum reorder level`}
            message="Restock immediately to prevent operational disruptions and lost sales."
            actionText="View Inventory"
            actionLink="/app/inventory"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            label="Total Revenue"
            value={formatCurrency(revenue)}
            subtext="This Month"
            icon={Banknote}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Operating Expenses"
            value={formatCurrency(expenses)}
            subtext="This Month"
            icon={ShoppingBag}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Net Operating Profit"
            value={formatCurrency(profit)}
            subtext="Gross Margin (Live)"
            icon={TrendingUp}
            iconColor={profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
            iconBg={profit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Active Customers"
            value={`${stats.totalCustomers ?? 0} Clients`}
            subtext={`${stats.totalBranches ?? 1} Branch Location(s)`}
            icon={Users}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            isLoading={isDashLoading}
          />
        </div>

        {/* Analytical Charts & Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardSection
            title="Revenue vs Operating Expenses"
            subtitle="Monthly fiscal comparison based on database records"
            className="lg:col-span-2"
          >
            <RevenueChart data={chartRevenueData} />
          </DashboardSection>

          <DashboardSection
            title="Receivables & Invoices"
            subtitle="Pending collections from accounts receivable"
            actionText="View Invoices"
            actionLink="/app/invoices"
          >
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="text-3xl font-extrabold font-mono text-foreground">
                {formatCurrency(outstanding.amount || 0)}
              </div>
              <p className="text-sm text-foreground/60 mt-1">
                {outstanding.count ?? 0} unpaid invoice(s) awaiting payment
              </p>
              <div className="w-full mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-sm text-foreground/60">
                <span>Completed Orders:</span>
                <span className="font-semibold text-foreground font-mono">{salesCount}</span>
              </div>
            </div>
          </DashboardSection>
        </div>

        {/* Recent Transactions & Catalog Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Recent Sales & Transactions"
            subtitle="Live recorded transactions from POS & Sales Invoices"
            actionText="All Sales"
            actionLink="/app/sales"
            className="lg:col-span-7"
            contentClassName="p-0"
          >
            {isSalesLoading ? (
              <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : recentActivity.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent transactions recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {recentActivity.slice(0, 5).map((order, idx) => (
                  <div key={order.id || idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono text-sm">
                        SO
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{order.orderNumber || `Order #${idx+1}`}</div>
                        <div className="text-sm text-foreground/60 mt-0.5">{order.customerName || 'Walk-in Customer'} · {formatDate(order.createdAt)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold font-mono text-foreground text-base">{formatCurrency(order.total)}</div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {order.status || 'Completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Inventory Catalog"
            subtitle="On-hand stock and active product SKUs"
            actionText="Manage Stock"
            actionLink="/app/inventory"
            className="lg:col-span-5"
            contentClassName="p-0"
          >
            {isProductsLoading ? (
              <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : productsList.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No catalog products registered.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {productsList.slice(0, 5).map((prod, idx) => (
                  <div key={prod.id || idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="truncate max-w-[170px] sm:max-w-xs">
                      <div className="font-semibold text-foreground truncate">{prod.name}</div>
                      <div className="text-sm text-foreground/60 font-mono mt-0.5">{prod.sku} · {prod.currentStock ?? 0} in stock</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold font-mono text-foreground text-base">{formatCurrency(prod.sellingPrice)}</div>
                      <div className="text-xs text-foreground/50 font-medium">Cost: {formatCurrency(prod.costPrice || 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 2. BRANCH MANAGER DASHBOARD
  // -------------------------------------------------------------------------
  const renderBranchManagerDashboard = () => {
    const branchInfo = dashData?.branch || {}
    const branchSales = overview.sales?.value ?? 0
    const branchRevenue = overview.revenue?.value ?? 0
    const branchEmployees = overview.employees?.value ?? 0
    const branchInventory = overview.inventory?.value ?? 0
    const recentSales = dashData?.recentSales || []

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            label="Branch Revenue"
            value={formatCurrency(branchRevenue)}
            subtext="This Month"
            icon={Banknote}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Branch Orders"
            value={`${branchSales} Orders`}
            subtext="This Month"
            icon={ShoppingCart}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Branch Staff"
            value={`${branchEmployees} Active`}
            subtext="Assigned to this branch"
            icon={UserCheck}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Stock Items"
            value={`${branchInventory} SKUs`}
            subtext="Local stock inventory"
            icon={Warehouse}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            isLoading={isDashLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Recent Branch Transactions"
            subtitle={`Direct sales fulfilled at ${branchInfo.name || 'this location'}`}
            actionText="View All Sales"
            actionLink="/app/sales"
            className="lg:col-span-8"
            contentClassName="p-0"
          >
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No branch transactions recorded yet this period.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {recentSales.map((sale, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">{sale.orderNumber}</div>
                      <div className="text-sm text-foreground/60">{sale.customerName} · {formatDate(sale.createdAt)}</div>
                    </div>
                    <div className="font-bold font-mono text-foreground text-sm">
                      {formatCurrency(sale.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Quick Branch Operations"
            subtitle="Common workflows for branch supervisors"
            className="lg:col-span-4"
          >
            <div className="space-y-2.5">
              <Button onClick={() => navigate('/app/sales/pos')} className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <ShoppingCart className="w-5 h-5 mr-2" /> Launch Point of Sale
              </Button>
              <Button onClick={() => navigate('/app/inventory')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Package className="w-5 h-5 mr-2" /> Local Stock Check
              </Button>
              <Button onClick={() => navigate('/app/employees/attendance')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <UserCheck className="w-5 h-5 mr-2" /> Daily Attendance Log
              </Button>
            </div>
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 3. SALES MANAGER DASHBOARD
  // -------------------------------------------------------------------------
  const renderSalesManagerDashboard = () => {
    const totalSales = overview.totalSales?.value ?? 0
    const todaySales = overview.todaySales?.value ?? 0
    const revenue = overview.revenue?.value ?? 0
    const customers = overview.customers?.value ?? 0
    const quotations = overview.pendingQuotations?.value ?? 0
    const topProducts = dashData?.topProducts || []

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            label="Month Revenue"
            value={formatCurrency(revenue)}
            subtext="Monthly Sales Revenue"
            icon={Banknote}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Today's Orders"
            value={`${todaySales} Orders`}
            subtext="Recorded Today"
            icon={ShoppingCart}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Active Customers"
            value={`${customers} Clients`}
            subtext="Registered in CRM"
            icon={Users}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Open Quotations"
            value={`${quotations} Quotes`}
            subtext="Awaiting client conversion"
            icon={FileText}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            isLoading={isDashLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Top Performing Products"
            subtitle="Best selling catalog products by sales volume"
            actionText="View Products"
            actionLink="/app/products"
            className="lg:col-span-7"
            contentClassName="p-0"
          >
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No product volume data recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-foreground/50 font-medium">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-foreground">{p.productName}</span>
                    </div>
                    <div className="font-extrabold font-mono text-foreground text-base">
                      {p.soldQuantity} units sold
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Sales Pipeline Actions"
            subtitle="Fast entry for commercial operations"
            className="lg:col-span-5"
          >
            <div className="space-y-2.5">
              <Button onClick={() => navigate('/app/sales/quotations')} className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <FileText className="w-5 h-5 mr-2" /> New Commercial Quotation
              </Button>
              <Button onClick={() => navigate('/app/sales')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <TrendingUp className="w-5 h-5 mr-2" /> View Sales Orders Ledger
              </Button>
              <Button onClick={() => navigate('/app/customers')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Users className="w-5 h-5 mr-2" /> Customer Accounts
              </Button>
            </div>
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 4. CASHIER / POS OPERATOR DASHBOARD
  // -------------------------------------------------------------------------
  const renderCashierDashboard = () => {
    const todaySales = overview.todaySales?.value ?? 0
    const todayRevenue = overview.todayRevenue?.value ?? 0
    const shift = dashData?.shift
    const recentTxns = dashData?.recentTransactions || []

    return (
      <div className="space-y-6">
        {shift ? (
          <DashboardAlertBanner
            type="info"
            title={`Active Register Shift: ${shift.shiftNumber || 'Current Till'}`}
            message={`Opened with opening cash of ${formatCurrency(shift.openingCash || 0)}. Processed ${shift.transactionCount || 0} order(s).`}
            actionText="Open POS Checkout"
            actionLink="/app/sales/pos"
          />
        ) : (
          <DashboardAlertBanner
            type="warning"
            title="No Active Till Shift"
            message="Please start a shift on the POS terminal to begin ringing up customer transactions."
            actionText="Launch POS"
            actionLink="/app/sales/pos"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardKpiCard
            label="Today's Cash Collected"
            value={formatCurrency(todayRevenue)}
            subtext="Your POS collections today"
            icon={Banknote}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Transactions Completed"
            value={`${todaySales} Orders`}
            subtext="Processed by your account"
            icon={Receipt}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Till Status"
            value={shift ? 'Shift Open' : 'Shift Closed'}
            subtext={shift ? `Started ${formatDate(shift.openedAt)}` : 'Ready to begin shift'}
            icon={CreditCard}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            isLoading={isDashLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Your Recent POS Transactions"
            subtitle="Latest receipts generated at your checkout till"
            actionText="POS Terminal"
            actionLink="/app/sales/pos"
            className="lg:col-span-8"
            contentClassName="p-0"
          >
            {recentTxns.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No orders rung up yet today.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {recentTxns.map((t, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">{t.orderNumber}</div>
                      <div className="text-sm text-foreground/60">{t.customerName} · {formatDate(t.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold font-mono text-foreground text-base">{formatCurrency(t.total)}</div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {t.status || 'Paid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="POS Quick Access"
            subtitle="Immediate register shortcuts"
            className="lg:col-span-4"
          >
            <div className="space-y-3">
              <Button onClick={() => navigate('/app/sales/pos')} className="w-full text-sm h-12 rounded-xl shadow-md font-semibold">
                <ShoppingCart className="w-5 h-5 mr-2" /> Start Checkout Till
              </Button>
              <Button onClick={() => navigate('/app/sales/returns')} variant="outline" className="w-full text-sm h-11 rounded-xl font-semibold">
                <Receipt className="w-5 h-5 mr-2" /> Customer Sales Returns
              </Button>
            </div>
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 5. INVENTORY OFFICER DASHBOARD
  // -------------------------------------------------------------------------
  const renderInventoryOfficerDashboard = () => {
    const totalProducts = overview.totalProducts?.value ?? 0
    const lowStock = overview.lowStock?.value ?? 0
    const movements = overview.transactions?.value ?? 0
    const recentTxns = dashData?.recentTransactions || []

    return (
      <div className="space-y-6">
        {lowStock > 0 && (
          <DashboardAlertBanner
            type="warning"
            title={`${lowStock} SKUs are below critical threshold`}
            message="Reorder stock immediately or adjust bin locations to maintain minimum buffer."
            actionText="Stock Level Ledger"
            actionLink="/app/inventory/levels"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardKpiCard
            label="Active SKUs in Catalog"
            value={`${totalProducts} Products`}
            subtext="Available in database"
            icon={Package}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Low Stock Items"
            value={`${lowStock} Critical`}
            subtext="Below reorder threshold"
            icon={AlertTriangle}
            iconColor={lowStock > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}
            iconBg={lowStock > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"}
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Stock Movements"
            value={`${movements} Actions`}
            subtext="This month's ledger operations"
            icon={Warehouse}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            isLoading={isDashLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Recent Stock Adjustments & Movements"
            subtitle="Inbound receiving, write-offs, and warehouse audits"
            actionText="Inventory Dashboard"
            actionLink="/app/inventory"
            className="lg:col-span-8"
            contentClassName="p-0"
          >
            {recentTxns.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <Warehouse className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No inventory movements recorded yet this period.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {recentTxns.map((t, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">{t.productName}</div>
                      <div className="text-sm text-foreground/60 font-mono mt-0.5">{t.productSku} · {t.reason || 'Inventory Adjustment'} · {formatDate(t.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold font-mono text-foreground text-base">{t.quantity > 0 ? `+${t.quantity}` : t.quantity}</span>
                      <span className="block text-xs text-foreground/50 font-medium uppercase">{t.type || 'Adjustment'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Warehouse Shortcuts"
            subtitle="Direct tools for stock officers"
            className="lg:col-span-4"
          >
            <div className="space-y-2.5">
              <Button onClick={() => navigate('/app/inventory/adjustments')} className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Package className="w-5 h-5 mr-2" /> Record Stock Adjustment
              </Button>
              <Button onClick={() => navigate('/app/inventory/transfers')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Truck className="w-5 h-5 mr-2" /> Warehouse Stock Transfer
              </Button>
              <Button onClick={() => navigate('/app/products/new')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Plus className="w-5 h-5 mr-2" /> Register New SKU
              </Button>
            </div>
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 6. PROCUREMENT OFFICER DASHBOARD
  // -------------------------------------------------------------------------
  const renderProcurementOfficerDashboard = () => {
    const purchaseOrders = overview.purchaseOrders?.value ?? 0
    const pendingOrders = overview.pendingOrders?.value ?? 0
    const totalSpend = overview.totalSpend?.value ?? 0
    const suppliers = overview.suppliers?.value ?? 0
    const recentOrders = dashData?.recentOrders || []

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            label="Total Spend"
            value={formatCurrency(totalSpend)}
            subtext="Purchasing spend this month"
            icon={Banknote}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Purchase Orders"
            value={`${purchaseOrders} POs`}
            subtext="Created this month"
            icon={ShoppingBag}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Pending Supplier Orders"
            value={`${pendingOrders} Awaiting`}
            subtext="In draft or sent state"
            icon={Clock}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Active Suppliers"
            value={`${suppliers} Vendors`}
            subtext="Registered in directory"
            icon={Truck}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            isLoading={isDashLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Recent Purchase Orders"
            subtitle="Procurement logs with suppliers"
            actionText="All Purchases"
            actionLink="/app/purchases"
            className="lg:col-span-8"
            contentClassName="p-0"
          >
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No purchase orders created yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {recentOrders.map((po, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">{po.orderNumber}</div>
                      <div className="text-sm text-foreground/60">{po.supplierName} · {formatDate(po.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold font-mono text-foreground text-base">{formatCurrency(po.total)}</div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                        {po.status || 'Sent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Procurement Shortcuts"
            subtitle="Vendor and purchasing workflows"
            className="lg:col-span-4"
          >
            <div className="space-y-2.5">
              <Button onClick={() => navigate('/app/purchases')} className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Plus className="w-5 h-5 mr-2" /> Create Purchase Order
              </Button>
              <Button onClick={() => navigate('/app/purchases/grn')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Package className="w-5 h-5 mr-2" /> Goods Received (GRN)
              </Button>
              <Button onClick={() => navigate('/app/suppliers')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Truck className="w-5 h-5 mr-2" /> Supplier Directory
              </Button>
            </div>
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 7. ACCOUNTANT / FINANCE OFFICER DASHBOARD
  // -------------------------------------------------------------------------
  const renderAccountantDashboard = () => {
    const pendingInvoices = overview.pendingInvoices || {}
    const paidInvoices = overview.paidInvoices?.value ?? 0
    const expenses = overview.expenses?.value ?? 0
    const revenue = overview.revenue?.value ?? 0
    const netProfit = overview.netProfit?.value ?? (revenue - expenses)
    const unpaidList = dashData?.pendingInvoicesList || []
    const recentExpenses = dashData?.recentExpenses || []

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            label="Outstanding AR"
            value={formatCurrency(pendingInvoices.amount || 0)}
            subtext={`${pendingInvoices.count || 0} unpaid invoices`}
            icon={FileText}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Total Revenue"
            value={formatCurrency(revenue)}
            subtext="This month's recognized sales"
            icon={Banknote}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Operating Expenses"
            value={formatCurrency(expenses)}
            subtext="Recorded expenses this month"
            icon={ShoppingBag}
            iconColor="text-rose-600 dark:text-rose-400"
            iconBg="bg-rose-500/10 border-rose-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Net Operating Profit"
            value={formatCurrency(netProfit)}
            subtext="Revenue minus expenses"
            icon={TrendingUp}
            iconColor={netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
            iconBg={netProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}
            isLoading={isDashLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Outstanding Invoices Awaiting Payment"
            subtitle="Aging accounts receivable"
            actionText="All Invoices"
            actionLink="/app/invoices"
            className="lg:col-span-7"
            contentClassName="p-0"
          >
            {unpaidList.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending unpaid invoices.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {unpaidList.map((inv, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">{inv.invoiceNumber}</div>
                      <div className="text-sm text-foreground/60">{inv.customerName} · Due {formatDate(inv.dueDate)}</div>
                    </div>
                    <div className="font-bold font-mono text-amber-600 dark:text-amber-400">
                      {formatCurrency(inv.balance)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Recent Expense Records"
            subtitle="Latest cash disbursements and vouchers"
            actionText="Expenses Ledger"
            actionLink="/app/finance/expenses"
            className="lg:col-span-5"
            contentClassName="p-0"
          >
            {recentExpenses.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No expenses recorded this period.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {recentExpenses.map((exp, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground capitalize">{exp.category || 'General'}</div>
                      <div className="text-sm text-foreground/60 truncate max-w-[140px]">{exp.description || 'Expense entry'}</div>
                    </div>
                    <div className="font-bold font-mono text-rose-600 dark:text-rose-400">
                      -{formatCurrency(exp.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 8. HR MANAGER DASHBOARD
  // -------------------------------------------------------------------------
  const renderHRManagerDashboard = () => {
    const totalEmployees = overview.totalEmployees?.value ?? 0
    const activeEmployees = overview.activeEmployees?.value ?? 0
    const newHires = overview.newHires?.value ?? 0
    const departments = overview.departments?.value ?? 0
    const recentHires = dashData?.recentHires || []

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            label="Total Workforce"
            value={`${totalEmployees} Staff`}
            subtext="Registered staff records"
            icon={Users}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Active Employees"
            value={`${activeEmployees} Active`}
            subtext="Currently employed"
            icon={UserCheck}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="New Onboardings"
            value={`${newHires} Hires`}
            subtext="Joined this month"
            icon={Sparkles}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Departments"
            value={`${departments} Depts`}
            subtext="Active divisions"
            icon={Layers}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            isLoading={isDashLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Recent Staff Onboardings"
            subtitle="Newly added employee profiles"
            actionText="Employees Registry"
            actionLink="/app/employees"
            className="lg:col-span-8"
            contentClassName="p-0"
          >
            {recentHires.length === 0 ? (
              <div className="p-8 text-center text-foreground/50 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent staff hires recorded.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-sm">
                {recentHires.map((h, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">{h.name}</div>
                      <div className="text-sm text-foreground/60">{h.email} · {h.role}</div>
                    </div>
                    <div className="text-right text-muted-foreground text-sm">
                      Joined {formatDate(h.joinedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="HR & Payroll Actions"
            subtitle="Personnel management tools"
            className="lg:col-span-4"
          >
            <div className="space-y-2.5">
              <Button onClick={() => navigate('/app/employees')} className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <UserCheck className="w-5 h-5 mr-2" /> Add Employee Profile
              </Button>
              <Button onClick={() => navigate('/app/employees/attendance')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Calendar className="w-5 h-5 mr-2" /> Clock-in Attendance
              </Button>
              <Button onClick={() => navigate('/app/payroll')} variant="outline" className="w-full justify-start text-sm h-11 rounded-xl font-semibold">
                <Banknote className="w-5 h-5 mr-2" /> Monthly Payroll Run
              </Button>
            </div>
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 9. OPERATIONS MANAGER DASHBOARD
  // -------------------------------------------------------------------------
  const renderOperationsManagerDashboard = () => {
    const sales = overview.sales?.value ?? 0
    const inventoryMovements = overview.inventoryMovements?.value ?? 0
    const purchases = overview.purchases?.value ?? 0
    const activeEmployees = overview.activeEmployees?.value ?? 0
    const warehouses = overview.warehouses?.value ?? 0
    const branches = overview.branches?.value ?? 0

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardKpiCard
            label="Sales Orders"
            value={`${sales} Orders`}
            subtext="This month's completed sales"
            icon={ShoppingCart}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Inventory Movements"
            value={`${inventoryMovements} Movements`}
            subtext="Stock receiving and adjustments"
            icon={Warehouse}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Purchase Orders"
            value={`${purchases} POs`}
            subtext="Procurement volume"
            icon={Truck}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Active Personnel"
            value={`${activeEmployees} Staff`}
            subtext="On-duty workforce"
            icon={UserCheck}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Warehouses"
            value={`${warehouses} Active`}
            subtext="Storage facilities"
            icon={Package}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10 border-purple-500/20"
            isLoading={isDashLoading}
          />
          <DashboardKpiCard
            label="Branch Locations"
            value={`${branches} Branches`}
            subtext="Operating enterprise branches"
            icon={Building2}
            iconColor="text-cyan-600 dark:text-cyan-400"
            iconBg="bg-cyan-500/10 border-cyan-500/20"
            isLoading={isDashLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <DashboardSection
            title="Operational Overview & Quick Navigation"
            subtitle="Cross-functional controls across departments"
            className="lg:col-span-12"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={() => navigate('/app/inventory')} variant="outline" className="h-14 justify-start text-xs rounded-xl p-3">
                <Warehouse className="w-5 h-5 mr-2.5 text-primary shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">Inventory Ledger</div>
                  <div className="text-xs text-foreground/50 font-medium">Monitor stock & levels</div>
                </div>
              </Button>
              <Button onClick={() => navigate('/app/sales')} variant="outline" className="h-14 justify-start text-xs rounded-xl p-3">
                <TrendingUp className="w-5 h-5 mr-2.5 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">Sales Operations</div>
                  <div className="text-xs text-foreground/50 font-medium">Review orders and quotes</div>
                </div>
              </Button>
              <Button onClick={() => navigate('/app/purchases')} variant="outline" className="h-14 justify-start text-xs rounded-xl p-3">
                <Truck className="w-5 h-5 mr-2.5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">Procurement</div>
                  <div className="text-xs text-foreground/50 font-medium">Track POs and deliveries</div>
                </div>
              </Button>
              <Button onClick={() => navigate('/app/employees')} variant="outline" className="h-14 justify-start text-xs rounded-xl p-3">
                <Users className="w-5 h-5 mr-2.5 text-indigo-600 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">Staff & Shifts</div>
                  <div className="text-xs text-foreground/50 font-medium">Manage workforce & attendance</div>
                </div>
              </Button>
            </div>
          </DashboardSection>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Select which role layout to render
  // -------------------------------------------------------------------------
  const renderContentByRole = () => {
    if (roleKey.includes('branch_manager') || roleKey.includes('branch manager')) {
      return renderBranchManagerDashboard()
    }
    if (roleKey.includes('sales_manager') || roleKey.includes('sales manager')) {
      return renderSalesManagerDashboard()
    }
    if (roleKey.includes('cashier') || roleKey.includes('pos')) {
      return renderCashierDashboard()
    }
    if (roleKey.includes('inventory_officer') || roleKey.includes('inventory officer')) {
      return renderInventoryOfficerDashboard()
    }
    if (roleKey.includes('procurement') || roleKey.includes('procurement officer')) {
      return renderProcurementOfficerDashboard()
    }
    if (roleKey.includes('accountant') || roleKey.includes('finance')) {
      return renderAccountantDashboard()
    }
    if (roleKey.includes('hr_manager') || roleKey.includes('hr manager')) {
      return renderHRManagerDashboard()
    }
    if (roleKey.includes('operation') || roleKey.includes('operations')) {
      return renderOperationsManagerDashboard()
    }

    // Default to Business Owner / Super Admin overview
    return renderBusinessOwnerDashboard()
  }

  return (
    <>
      <Helmet><title>Dashboard — MSME BMS</title></Helmet>

      <div className="space-y-6">
        <DashboardHeader
          greeting={greeting}
          userName={user?.name || 'Administrator'}
          userRole={userRoleDisplay}
          branchName={user?.branch?.name || 'Main Enterprise'}
          onRefresh={() => refetchDash()}
          isRefreshing={isDashFetching}
          actions={
            <Button 
              onClick={() => navigate('/app/sales/pos')} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-9 px-4 rounded-xl shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Open POS
            </Button>
          }
        />

        {renderContentByRole()}
      </div>
    </>
  )
})

export default Dashboard
