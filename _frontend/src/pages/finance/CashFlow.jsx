import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, Landmark } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { financeService } from '@/services'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

export default function CashFlow() {
  const [range, setRange] = useState('6m') // 6m | 1y

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cash-flow', { range }],
    queryFn: () => financeService.getCashFlow({ range }).then(r => r.data),
    staleTime: 60_000
  })

  const cashFlowData = data?.cashFlow || []
  const summary = data?.summary || {}

  const fmt = (n) => {
    if (!n && n !== 0) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
  }

  return (
    <>
      <Helmet><title>Cash Flow — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cash Flow</h1>
            <p className="text-muted-foreground text-sm mt-1">Detailed analysis of cash inflows and outflows</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <div className="flex rounded-md border overflow-hidden">
              <Button
                variant={range === '6m' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-r"
                onClick={() => setRange('6m')}
              >
                6 Months
              </Button>
              <Button
                variant={range === '1y' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setRange('1y')}
              >
                1 Year
              </Button>
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cash In</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">
                    {isLoading ? <Skeleton className="h-8 w-24" /> : fmt(summary.totalInflow)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cash Out</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {isLoading ? <Skeleton className="h-8 w-24" /> : fmt(summary.totalOutflow)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-2xl font-bold mt-1 ${(summary.netFlow >= 0) ? 'text-indigo-600' : 'text-amber-600'}`}>
                    {isLoading ? <Skeleton className="h-8 w-24" /> : fmt(summary.netFlow)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/20">
                  <Landmark className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash flow trend area chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Inflow vs Outflow Trend</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : cashFlowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="inflow" name="Cash Inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2} />
                  <Area type="monotone" dataKey="outflow" name="Cash Outflow" stroke="#ef4444" fillOpacity={1} fill="url(#colorOutflow)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">No trend data available</div>
            )}
          </CardContent>
        </Card>

        {/* Detailed table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Statement</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Month</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cash In</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cash Out</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlowData.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{row.month}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">+{fmt(row.inflow)}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">-{fmt(row.outflow)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${row.net >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                          {fmt(row.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
