import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Download, FileSpreadsheet, FileIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { reportService } from '@/services'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function SalesReport() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sales-report', { startDate, endDate }],
    queryFn: () => reportService.getSales({ startDate, endDate }).then(r => r.data),
    staleTime: 60_000
  })

  const handleExport = async (format) => {
    try {
      const fn = format === 'pdf' ? reportService.exportPdf : reportService.exportExcel
      const res = await fn('sales', { startDate, endDate })
      const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const ext = format === 'pdf' ? 'pdf' : 'xlsx'
      const blob = new Blob([res.data], { type: mime })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Sales_Report_${startDate}_to_${endDate}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(`Exported ${format.toUpperCase()} successfully`)
    } catch {
      toast.error('Export failed')
    }
  }

  const salesData = data?.salesTrend || []
  const summary = data?.summary || {}

  const fmt = (n) => {
    if (!n && n !== 0) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  }

  return (
    <>
      <Helmet><title>Sales Reports — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports"><ArrowLeft className="h-4 w-4 mr-1" /> Reports</Link>
            </Button>
            <h1 className="text-xl font-bold">Sales Analysis Reports</h1>
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

        {/* Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {isLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : fmt(summary.totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : summary.totalCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-2xl font-bold mt-1 text-indigo-600">
                {isLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : fmt(summary.avgOrderValue)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-60 w-full" />
            ) : salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={salesData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No sales data for the selected range</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
