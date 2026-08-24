import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Landmark, CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw, Banknote, ShoppingBag, FileText, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton } from '@/components/ui'
import { financeService } from '@/services'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, formatDate } from '@/utils'
import { DashboardHeader, DashboardKpiCard, DashboardSection } from '@/components/dashboard'

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: () => financeService.getDashboard().then(r => r.data?.data || r.data || {}).catch(() => ({})),
    staleTime: 60_000
  })

  const stats = data?.stats || {}
  const cashFlow = data?.cashFlow || []
  const topReceivables = data?.topReceivables || []
  const topPayables = data?.topPayables || []

  const fmt = (n) => {
    if (!n && n !== 0) return '—'
    return formatCurrency(n)
  }

  return (
    <>
      <Helmet><title>Finance Dashboard — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <DashboardHeader
          greeting="Financial Workspace"
          userName="Finance Officer"
          userRole="Fiscal Controller"
          branchName="Accounts & Treasury"
          subtitle="Real-time fiscal cash flow, aging receivables, and payables ledger."
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          actions={
            <Button 
              onClick={() => navigate('/app/finance/expenses')} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-9 px-4 rounded-xl shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Record Expense
            </Button>
          }
        />

        {/* 4 Core Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard 
            label="Total Revenue" 
            value={fmt(stats.totalRevenue)} 
            subtext="This month's recognized sales" 
            icon={Banknote}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            isLoading={isLoading} 
          />
          <DashboardKpiCard 
            label="Total Expenses" 
            value={fmt(stats.totalExpenses)} 
            subtext="Operational disbursements" 
            icon={ShoppingBag}
            iconColor="text-rose-600 dark:text-rose-400"
            iconBg="bg-rose-500/10 border-rose-500/20"
            isLoading={isLoading} 
          />
          <DashboardKpiCard 
            label="Net Operating Profit" 
            value={fmt(stats.netProfit)} 
            subtext="Gross earnings margin" 
            icon={TrendingUp}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            isLoading={isLoading} 
          />
          <DashboardKpiCard 
            label="Outstanding AR" 
            value={fmt(stats.totalReceivables)} 
            subtext="Uncollected client invoices" 
            icon={FileText}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            isLoading={isLoading} 
          />
        </div>

        {/* Cash Flow Line Chart & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardSection
            title="Cash Flow & Profitability Trend"
            subtitle="Monthly income vs operational expenses"
            className="lg:col-span-2"
          >
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
              <div className="h-56 flex flex-col items-center justify-center text-muted-foreground text-xs">
                <Banknote className="w-8 h-8 mb-2 opacity-30" />
                <p>No cash flow history available yet.</p>
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Finance Ledgers"
            subtitle="Quick access to treasury modules"
            className="lg:col-span-1"
          >
            <div className="space-y-2">
              {[
                { label: 'Expenses', to: '/app/finance/expenses', icon: TrendingDown, desc: 'Track business expenses' },
                { label: 'Bank Accounts', to: '/app/finance/bank-accounts', icon: CreditCard, desc: 'Manage treasury accounts' },
                { label: 'Cash Flow Statement', to: '/app/finance/cash-flow', icon: Landmark, desc: 'Detailed liquidity analysis' },
                { label: 'Accounts Receivable', to: '/app/finance/receivables', icon: TrendingUp, desc: 'Outstanding client invoices' },
                { label: 'Accounts Payable', to: '/app/finance/payables', icon: TrendingDown, desc: 'Vendor payables ledger' },
              ].map(({ label, to, icon: Icon, desc }) => (
                <Link 
                  key={to} 
                  to={to} 
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors group text-xs border border-transparent hover:border-border/60"
                >
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </DashboardSection>
        </div>

        {/* Receivables & Payables Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardSection
            title="Top Aging Receivables"
            subtitle="Outstanding invoices needing collection"
            actionText="View Receivables"
            actionLink="/app/finance/receivables"
            contentClassName="p-0"
          >
            {isLoading ? (
              <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : topReceivables.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p>All client invoices are fully paid.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-xs">
                {topReceivables.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{item.customer?.name || 'Walk-in Client'}</p>
                      <p className="text-[11px] text-muted-foreground">Due {formatDate(item.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-foreground">{fmt(item.balance)}</p>
                      <Badge variant={item.isOverdue ? 'destructive' : 'warning'} className="text-[10px] px-1.5 py-0">
                        {item.isOverdue ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Accounts Payable"
            subtitle="Upcoming obligations to suppliers"
            actionText="View Payables"
            actionLink="/app/finance/payables"
            contentClassName="p-0"
          >
            {isLoading ? (
              <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : topPayables.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p>No outstanding supplier payables recorded.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-xs">
                {topPayables.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{item.supplier?.name || 'Vendor'}</p>
                      <p className="text-[11px] text-muted-foreground">Due {formatDate(item.dueDate)}</p>
                    </div>
                    <p className="font-bold font-mono text-rose-600 dark:text-rose-400">{fmt(item.balance)}</p>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    </>
  )
}
