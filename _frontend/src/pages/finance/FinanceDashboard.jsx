import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton } from '@/components/ui'
import { financeService } from '@/services'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

function KpiCard({ label, value, subtext, trend, isLoading }) {
  return (
    <Card>
      <CardContent className="p-6">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtext && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {subtext}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function FinanceDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: () => financeService.getDashboard().then(r => r.data),
    staleTime: 60_000
  })

  const stats = data?.stats || {}
  const cashFlow = data?.cashFlow || []

  const fmt = (n) => {
    if (!n && n !== 0) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
  }

  return (
    <>
      <Helmet><title>Finance Dashboard — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Finance</h1>
            <p className="text-muted-foreground text-sm mt-1">Financial overview and health</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={fmt(stats.totalRevenue)} subtext={`${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth?.toFixed(1)}% vs last month`} trend={stats.revenueGrowth} isLoading={isLoading} />
          <KpiCard label="Total Expenses" value={fmt(stats.totalExpenses)} subtext="This month" trend={-1} isLoading={isLoading} />
          <KpiCard label="Net Profit" value={fmt(stats.netProfit)} subtext={`${stats.profitMargin?.toFixed(1)}% margin`} trend={stats.netProfit} isLoading={isLoading} />
          <KpiCard label="Outstanding AR" value={fmt(stats.totalReceivables)} subtext="Accounts receivable" trend={0} isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Cash Flow (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : cashFlow.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={cashFlow} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Links</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Expenses', to: '/finance/expenses', icon: TrendingDown, desc: 'Track business expenses' },
                { label: 'Bank Accounts', to: '/finance/bank-accounts', icon: CreditCard, desc: 'Manage accounts' },
                { label: 'Cash Flow', to: '/finance/cash-flow', icon: DollarSign, desc: 'Detailed view' },
                { label: 'Receivables', to: '/finance/receivables', icon: TrendingUp, desc: 'Outstanding invoices' },
                { label: 'Payables', to: '/finance/payables', icon: TrendingDown, desc: 'Amounts owed' },
              ].map(({ label, to, icon: Icon, desc }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Accounts Receivable</CardTitle>
              <Button variant="outline" size="sm" asChild><Link to="/finance/receivables">View All</Link></Button>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="space-y-2">
                  {(data?.topReceivables || []).slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.customer?.name}</p>
                        <p className="text-xs text-muted-foreground">Due {format(new Date(item.dueDate), 'MMM dd')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{fmt(item.balance)}</p>
                        <Badge variant={item.isOverdue ? 'destructive' : 'warning'} className="text-xs">
                          {item.isOverdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {!(data?.topReceivables?.length) && <p className="text-center text-muted-foreground text-sm py-4">All invoices are paid 🎉</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Accounts Payable</CardTitle>
              <Button variant="outline" size="sm" asChild><Link to="/finance/payables">View All</Link></Button>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="space-y-2">
                  {(data?.topPayables || []).slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.supplier?.name}</p>
                        <p className="text-xs text-muted-foreground">Due {format(new Date(item.dueDate), 'MMM dd')}</p>
                      </div>
                      <p className="text-sm font-medium text-red-600">{fmt(item.balance)}</p>
                    </div>
                  ))}
                  {!(data?.topPayables?.length) && <p className="text-center text-muted-foreground text-sm py-4">No outstanding payables</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
