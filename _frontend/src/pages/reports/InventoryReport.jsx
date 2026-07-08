import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Download, FileSpreadsheet, FileIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { reportService } from '@/services'
import toast from 'react-hot-toast'

export default function InventoryReport() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => reportService.getInventory().then(r => r.data),
    staleTime: 60_000
  })

  const handleExport = async (format) => {
    try {
      const fn = format === 'pdf' ? reportService.exportPdf : reportService.exportExcel
      const res = await fn('inventory', {})
      const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const ext = format === 'pdf' ? 'pdf' : 'xlsx'
      const blob = new Blob([res.data], { type: mime })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Inventory_Status_Report.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(`Exported ${format.toUpperCase()} successfully`)
    } catch {
      toast.error('Export failed')
    }
  }

  const summary = data?.summary || {}
  const items = data?.data || []

  return (
    <>
      <Helmet><title>Inventory Reports — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports"><ArrowLeft className="h-4 w-4 mr-1" /> Reports</Link>
            </Button>
            <h1 className="text-xl font-bold">Inventory Status Reports</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
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
              <p className="text-sm text-muted-foreground">Total Stock Value</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {isLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : `$${(summary.totalValue || 0).toLocaleString()}`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total SKUs</p>
              <p className="text-2xl font-bold mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : summary.totalSkus || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : summary.lowStockCount || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Details Table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Valuation breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-2"><Skeleton className="h-10 w-full" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Product</th>
                    <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Stock Qty</th>
                    <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Cost Price</th>
                    <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-3 font-medium">
                        {item.name}
                        <span className="block text-xs text-muted-foreground">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">${Number(item.costPrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold">${(Number(item.quantity) * Number(item.costPrice)).toFixed(2)}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No inventory items found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
