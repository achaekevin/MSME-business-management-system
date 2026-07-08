import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { accountingService } from '@/services'

export default function ProfitLoss() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['profit-loss', { startDate, endDate }],
    queryFn: () => accountingService.getPnL({ startDate, endDate }).then(r => r.data),
    staleTime: 60_000
  })

  const revenues = data?.revenues || []
  const expenses = data?.expenses || []
  const totalRevenue = data?.totalRevenue || 0
  const totalExpense = data?.totalExpense || 0
  const netIncome = data?.netIncome || 0

  const fmt = (n) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  }

  return (
    <>
      <Helmet><title>Profit & Loss Statement — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profit & Loss (P&L)</h1>
            <p className="text-muted-foreground text-sm mt-1">Income statement showing revenues, expenses, and net profit</p>
          </div>
          <div className="flex gap-2 items-center">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36 h-9" />
            <span className="text-muted-foreground text-xs">to</span>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36 h-9" />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {revenues.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium text-green-600">+{fmt(item.balance)}</span>
                    </div>
                  ))}
                  {revenues.length === 0 && <p className="text-sm text-muted-foreground">No revenues recorded</p>}
                </div>
                <div className="flex justify-between font-bold border-t pt-2 text-sm text-green-700">
                  <span>Total Revenue</span>
                  <span>{fmt(totalRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Expenses</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {expenses.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium text-red-600">-{fmt(item.balance)}</span>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-sm text-muted-foreground">No expenses recorded</p>}
                </div>
                <div className="flex justify-between font-bold border-t pt-2 text-sm text-red-700">
                  <span>Total Expenses</span>
                  <span>{fmt(totalExpense)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className={`p-6 rounded-lg border flex justify-between font-bold text-lg ${netIncome >= 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 text-green-700' : 'bg-red-50 dark:bg-red-950/20 border-red-200 text-red-700'}`}>
              <span>Net Income / (Loss)</span>
              <span>{fmt(netIncome)}</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
