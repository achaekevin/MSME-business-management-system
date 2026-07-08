import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Download, FileSpreadsheet, FileIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { reportService } from '@/services'
import toast from 'react-hot-toast'

export default function FinancialReport() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['financial-report', { startDate, endDate }],
    queryFn: () => reportService.getFinancial({ startDate, endDate }).then(r => r.data),
    staleTime: 60_000
  })

  const handleExport = async (format) => {
    try {
      const fn = format === 'pdf' ? reportService.exportPdf : reportService.exportExcel
      const res = await fn('financial', { startDate, endDate })
      const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const ext = format === 'pdf' ? 'pdf' : 'xlsx'
      const blob = new Blob([res.data], { type: mime })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Financial_VAT_Report_${startDate}_to_${endDate}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(`Exported ${format.toUpperCase()} successfully`)
    } catch {
      toast.error('Export failed')
    }
  }

  const vat = data?.vat || {}
  const summary = data?.summary || {}

  const fmt = (n) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  }

  return (
    <>
      <Helmet><title>Financial Reports — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports"><ArrowLeft className="h-4 w-4 mr-1" /> Reports</Link>
            </Button>
            <h1 className="text-xl font-bold">Financial & Tax Reports</h1>
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileIcon className="h-4 w-4 mr-2" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Excel
          </Button>
        </div>

        {/* VAT Report Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">VAT & Tax Obligations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2"><Skeleton className="h-20 w-full" /></div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Output Tax (On Sales)</span>
                    <span className="font-semibold text-green-600">+{fmt(vat.outputTax)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Input Tax (On Purchases)</span>
                    <span className="font-semibold text-red-600">-{fmt(vat.inputTax)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 text-base">
                    <span>Net Tax Liability</span>
                    <span className={vat.netTax >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {fmt(vat.netTax)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">General Activity Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2"><Skeleton className="h-20 w-full" /></div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Cash Payments Collected</span>
                    <span className="font-semibold">{fmt(summary.paymentsReceived)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Expenses Recorded</span>
                    <span className="font-semibold">{fmt(summary.expensesPaid)}</span>
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
