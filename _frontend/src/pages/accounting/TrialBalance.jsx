import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { RefreshCw, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { accountingService } from '@/services'

export default function TrialBalance() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trial-balance', { asOfDate }],
    queryFn: () => accountingService.getTrialBalance({ asOfDate }).then(r => r.data),
    staleTime: 60_000
  })

  const rows = data?.rows || []
  const totalDebit = data?.totalDebit || 0
  const totalCredit = data?.totalCredit || 0

  const fmt = (n) => {
    if (!n && n !== 0) return '—'
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <>
      <Helmet><title>Trial Balance — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Trial Balance</h1>
            <p className="text-muted-foreground text-sm mt-1">Verification of ledger account balance equivalence</p>
          </div>
          <div className="flex gap-2">
            <Input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="w-40 h-9" />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
            <CardTitle className="text-base">Trial Balance Statement</CardTitle>
            <div className="text-sm text-muted-foreground">As of {asOfDate}</div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Account Code</th>
                      <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Account Name</th>
                      <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Debit</th>
                      <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20">
                        <td className="px-6 py-3 font-mono text-muted-foreground">{row.code}</td>
                        <td className="px-6 py-3 font-medium">{row.name}</td>
                        <td className="px-6 py-3 text-right text-green-600">{row.debit ? `$${fmt(row.debit)}` : '—'}</td>
                        <td className="px-6 py-3 text-right text-red-600">{row.credit ? `$${fmt(row.credit)}` : '—'}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          No accounting data for the selected date
                        </td>
                      </tr>
                    )}
                    {rows.length > 0 && (
                      <tr className="bg-muted/30 font-bold border-t-2 border-b-4">
                        <td colSpan={2} className="px-6 py-4">Total</td>
                        <td className="px-6 py-4 text-right text-green-700">${fmt(totalDebit)}</td>
                        <td className="px-6 py-4 text-right text-red-700">${fmt(totalCredit)}</td>
                      </tr>
                    )}
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
