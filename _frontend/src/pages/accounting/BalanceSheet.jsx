import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { accountingService } from '@/services'

export default function BalanceSheet() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['balance-sheet', { asOfDate }],
    queryFn: () => accountingService.getBalanceSheet({ asOfDate }).then(r => r.data),
    staleTime: 60_000
  })

  const assets = data?.assets || []
  const liabilities = data?.liabilities || []
  const equity = data?.equity || []
  const totalAssets = data?.totalAssets || 0
  const totalLiabilities = data?.totalLiabilities || 0
  const totalEquity = data?.totalEquity || 0

  const fmt = (n) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  }

  return (
    <>
      <Helmet><title>Balance Sheet — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Balance Sheet</h1>
            <p className="text-muted-foreground text-sm mt-1">Financial position showing assets, liabilities and equity</p>
          </div>
          <div className="flex gap-2">
            <Input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="w-40 h-9" />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <Card>
              <CardHeader><CardTitle className="text-base">Assets</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {assets.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{fmt(item.balance)}</span>
                    </div>
                  ))}
                  {assets.length === 0 && <p className="text-sm text-muted-foreground">No assets recorded</p>}
                </div>
                <div className="flex justify-between font-bold border-t pt-2 text-sm">
                  <span>Total Assets</span>
                  <span className="text-green-600">{fmt(totalAssets)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities & Equity */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Liabilities</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {liabilities.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1 border-b">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium">{fmt(item.balance)}</span>
                      </div>
                    ))}
                    {liabilities.length === 0 && <p className="text-sm text-muted-foreground">No liabilities recorded</p>}
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 text-sm">
                    <span>Total Liabilities</span>
                    <span className="text-red-600">{fmt(totalLiabilities)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Equity</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {equity.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1 border-b">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium">{fmt(item.balance)}</span>
                      </div>
                    ))}
                    {equity.length === 0 && <p className="text-sm text-muted-foreground">No equity recorded</p>}
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 text-sm">
                    <span>Total Equity</span>
                    <span>{fmt(totalEquity)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Equivalence check */}
              <div className="p-4 rounded-lg border bg-muted/50 flex justify-between font-bold text-sm">
                <span>Total Liabilities + Equity</span>
                <span>{fmt(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
