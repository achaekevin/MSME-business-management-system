import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Card, CardHeader, CardTitle, CardContent, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Skeleton, Badge } from '@/components/ui'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { axiosInstance } from '@/lib/axios'
import { formatCurrency, formatNumber } from '@/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function AnalyticsDashboard() {
  const [revenuePeriod, setRevenuePeriod] = useState('6')
  const [salesPeriod, setSalesPeriod] = useState('30')
  const [topProductsDays, setTopProductsDays] = useState('30')
  const [topCustomersDays, setTopCustomersDays] = useState('30')

  // KPI Summary
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics-kpi'],
    queryFn: async () => {
      const res = await axiosInstance.get('/analytics/kpi')
      return res.data.data
    }
  })

  // Revenue Trend
  const { data: revenueTrend, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics-revenue', revenuePeriod],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/revenue-trend?months=${revenuePeriod}`)
      return res.data.data
    }
  })

  // Sales Trend
  const { data: salesTrend, isLoading: salesLoading } = useQuery({
    queryKey: ['analytics-sales', salesPeriod],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/sales-trend?days=${salesPeriod}&groupBy=day`)
      return res.data.data
    }
  })

  // Top Products
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['analytics-products', topProductsDays],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/top-products?limit=10&days=${topProductsDays}`)
      return res.data.data
    }
  })

  // Top Customers
  const { data: topCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ['analytics-customers', topCustomersDays],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/top-customers?limit=10&days=${topCustomersDays}`)
      return res.data.data
    }
  })

  // Customer Growth
  const { data: customerGrowth, isLoading: growthLoading } = useQuery({
    queryKey: ['analytics-customer-growth'],
    queryFn: async () => {
      const res = await axiosInstance.get('/analytics/customer-growth?months=6')
      return res.data.data
    }
  })

  // Cash Flow
  const { data: cashFlow, isLoading: cashFlowLoading } = useQuery({
    queryKey: ['analytics-cash-flow'],
    queryFn: async () => {
      const res = await axiosInstance.get('/analytics/cash-flow?months=6')
      return res.data.data
    }
  })

  // Inventory Analytics
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['analytics-inventory'],
    queryFn: async () => {
      const res = await axiosInstance.get('/analytics/inventory')
      return res.data.data
    }
  })

  const StatCard = ({ title, value, change, icon: Icon, format = 'currency' }) => {
    const isPositive = change >= 0
    const formattedValue = format === 'currency' ? formatCurrency(value) : formatNumber(value)

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold">{formattedValue}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(change)}% vs last month
              </div>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
              <Icon className={`h-6 w-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Helmet><title>Business Analytics — MSME BMS</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Business Analytics & Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics, KPIs, and data-driven insights for your business.
          </p>
        </div>

        {/* KPI Cards */}
        {kpiLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : kpiData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Revenue" value={kpiData.revenue.value} change={kpiData.revenue.change} icon={DollarSign} />
            <StatCard title="Total Expenses" value={kpiData.expenses.value} change={kpiData.expenses.change} icon={TrendingDown} />
            <StatCard title="Net Profit" value={kpiData.profit.value} change={kpiData.profit.change} icon={TrendingUp} />
            <StatCard title="Sales Orders" value={kpiData.salesOrders.value} change={kpiData.salesOrders.change} icon={ShoppingCart} format="number" />
          </div>
        )}

        {/* Revenue & Profit Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Performance</CardTitle>
              <Select value={salesPeriod} onValueChange={setSalesPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Sales Amount" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {cashFlowLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={cashFlow}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="inflow" fill="#10b981" name="Cash Inflow" />
                    <Bar dataKey="outflow" fill="#ef4444" name="Cash Outflow" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Products</CardTitle>
              <Select value={topProductsDays} onValueChange={setTopProductsDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-3">
                  {topProducts?.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">{item.qty} units sold</p>
                        </div>
                      </div>
                      <span className="font-semibold">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Customers</CardTitle>
              <Select value={topCustomersDays} onValueChange={setTopCustomersDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-3">
                  {topCustomers?.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.customer.name}</p>
                          <p className="text-sm text-muted-foreground">{item.count} orders</p>
                        </div>
                      </div>
                      <span className="font-semibold">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Growth & Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth</CardTitle>
            </CardHeader>
            <CardContent>
              {growthLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <LineChart data={customerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="newCustomers" stroke="#8b5cf6" strokeWidth={2} name="New Customers" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Products</p>
                        <p className="text-2xl font-bold">{inventory?.totalProducts || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Low Stock Items</p>
                        <p className="text-2xl font-bold">{inventory?.lowStockCount || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Out of Stock</p>
                        <p className="text-2xl font-bold">{inventory?.outOfStockCount || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Inventory Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(inventory?.inventoryValue || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
