import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, ShoppingBag, Users, FileText, Package, AlertTriangle, Clock } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { StatCard, StatCardGrid } from '@/components/cards/StatCard'
import { RevenueChart, SalesBarChart, PieDonutChart } from '@/components/charts'
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Skeleton } from '@/components/ui'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils'
import { INVOICE_STATUSES, SALE_STATUSES } from '@/constants'

// Mock data for demo
const mockStats = {
  revenue: { value: 284500, change: 12.5, period: 'vs last month' },
  profit: { value: 89200, change: 8.3, period: 'vs last month' },
  expenses: { value: 195300, change: -3.2, period: 'vs last month' },
  sales: { value: 1247, change: 18.7, period: 'vs last month' },
  outstandingInvoices: { count: 24, amount: 67800 },
  lowStockProducts: 8,
  pendingPayments: { count: 12, amount: 34500 },
  activeCustomers: 3420
}

const mockRevenueData = [
  { name: 'Jan', revenue: 185000, expenses: 120000 },
  { name: 'Feb', revenue: 210000, expenses: 135000 },
  { name: 'Mar', revenue: 195000, expenses: 125000 },
  { name: 'Apr', revenue: 240000, expenses: 148000 },
  { name: 'May', revenue: 265000, expenses: 162000 },
  { name: 'Jun', revenue: 284500, expenses: 195300 }
]

const mockSalesData = [
  { name: 'Mon', sales: 42000, profit: 12000 },
  { name: 'Tue', sales: 38000, profit: 10500 },
  { name: 'Wed', sales: 51000, profit: 15200 },
  { name: 'Thu', sales: 46000, profit: 13800 },
  { name: 'Fri', sales: 63000, profit: 19400 },
  { name: 'Sat', sales: 71000, profit: 22100 },
  { name: 'Sun', sales: 29000, profit: 8700 }
]

const mockTopProducts = [
  { name: 'Laptop Pro 15"', sales: 145, revenue: 218000 },
  { name: 'Wireless Mouse', sales: 389, revenue: 19450 },
  { name: 'USB-C Hub 7-in-1', sales: 267, revenue: 26700 },
  { name: 'Monitor 27" 4K', sales: 89, revenue: 89000 },
  { name: 'Mechanical Keyboard', sales: 201, revenue: 40200 }
]

const mockOutstandingInvoices = [
  { id: 'INV-0088', customer: 'TechVision Ltd', amount: 15400, dueDate: '2024-07-05', status: 'overdue' },
  { id: 'INV-0089', customer: 'Sunrise Retail', amount: 8900, dueDate: '2024-07-10', status: 'sent' },
  { id: 'INV-0090', customer: 'Global Traders', amount: 22600, dueDate: '2024-07-15', status: 'sent' },
  { id: 'INV-0091', customer: 'Bright Solutions', amount: 5200, dueDate: '2024-07-20', status: 'sent' }
]

const Dashboard = memo(function Dashboard() {
  const { user } = useAuthStore()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <Helmet><title>Dashboard — MSME BMS</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{greeting}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
            <p className="text-muted-foreground mt-0.5">Here's what's happening with your business today.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1.5 bg-muted rounded-md text-muted-foreground">
              {formatDate(new Date(), 'EEEE, MMMM dd yyyy')}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <StatCardGrid cols={4}>
          <StatCard title="Revenue" value={mockStats.revenue.value} change={mockStats.revenue.change} period={mockStats.revenue.period} format="currency" icon={DollarSign} color="blue" />
          <StatCard title="Profit" value={mockStats.profit.value} change={mockStats.profit.change} period={mockStats.profit.period} format="currency" icon={TrendingUp} color="green" />
          <StatCard title="Expenses" value={mockStats.expenses.value} change={mockStats.expenses.change} period={mockStats.expenses.period} format="currency" icon={ShoppingBag} color="red" />
          <StatCard title="Total sales" value={mockStats.sales.value} change={mockStats.sales.change} period={mockStats.sales.period} icon={ShoppingBag} color="purple" />
        </StatCardGrid>

        {/* Alert cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/app/invoices?status=overdue">
            <Card className="hover:shadow-md transition-shadow border-orange-200 bg-orange-50 dark:bg-orange-900/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-300">Outstanding invoices</p>
                  <p className="text-lg font-bold text-orange-700">{mockStats.outstandingInvoices.count} · {formatCurrency(mockStats.outstandingInvoices.amount)}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/app/inventory/stock?filter=low">
            <Card className="hover:shadow-md transition-shadow border-red-200 bg-red-50 dark:bg-red-900/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-300">Low stock products</p>
                  <p className="text-lg font-bold text-red-700">{mockStats.lowStockProducts} products</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/app/payments?status=pending">
            <Card className="hover:shadow-md transition-shadow border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">Pending payments</p>
                  <p className="text-lg font-bold text-yellow-700">{mockStats.pendingPayments.count} · {formatCurrency(mockStats.pendingPayments.amount)}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/app/customers">
            <Card className="hover:shadow-md transition-shadow border-blue-200 bg-blue-50 dark:bg-blue-900/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Active customers</p>
                  <p className="text-lg font-bold text-blue-700">{mockStats.activeCustomers.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={mockRevenueData} title="Revenue vs Expenses" />
          </div>
          <SalesBarChart data={mockSalesData} title="This week's sales" />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Outstanding invoices */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">Outstanding invoices</CardTitle>
                <Link to="/app/invoices" className="text-xs text-primary hover:underline">View all</Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {mockOutstandingInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{inv.id}</p>
                        <p className="text-xs text-muted-foreground">{inv.customer} · Due {formatDate(inv.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={inv.status === 'overdue' ? 'destructive' : 'info'}>{inv.status}</Badge>
                        <span className="text-sm font-semibold">{formatCurrency(inv.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity - Real-time feed from backend */}
          <ActivityFeed limit={10} />
        </div>

        {/* Top products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base">Top products this month</CardTitle>
            <Link to="/app/reports" className="text-xs text-primary hover:underline">View report</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-6 py-2.5 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Product</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Units sold</th>
                    <th className="text-right px-6 py-2.5 text-xs font-medium text-muted-foreground">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTopProducts.map((p, i) => (
                    <tr key={p.name} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-6 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-right">{p.sales.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-medium">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
})

export default Dashboard
