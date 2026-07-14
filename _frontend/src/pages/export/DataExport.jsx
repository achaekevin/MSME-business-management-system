import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Download, FileDown, Database, Calendar, Filter } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Badge } from '@/components/ui'
import { axiosInstance } from '@/lib/axios'
import { formatDate } from '@/utils'
import { toast } from 'sonner'

export default function DataExport() {
  const [exportType, setExportType] = useState('sales')
  const [exportFormat, setExportFormat] = useState('csv')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [limit, setLimit] = useState(1000)

  // Get export types and formats
  const { data: config } = useQuery({
    queryKey: ['export-config'],
    queryFn: async () => {
      const res = await axiosInstance.get('/export/types')
      return res.data.data
    }
  })

  // Get export statistics
  const { data: stats } = useQuery({
    queryKey: ['export-stats'],
    queryFn: async () => {
      const res = await axiosInstance.get('/export/stats')
      return res.data.data
    }
  })

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post('/export', payload, {
        responseType: payload.format === 'csv' || payload.format === 'json' ? 'blob' : 'json'
      })
      return { data: res.data, format: payload.format, type: payload.type }
    },
    onSuccess: ({ data, format, type }) => {
      if (format === 'csv' || format === 'json') {
        // Create download link for CSV/JSON
        const blob = new Blob([data], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const timestamp = new Date().toISOString().split('T')[0]
        link.download = `${type}_export_${timestamp}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        toast.success(`${type} data exported successfully as ${format.toUpperCase()}`)
      } else {
        // Excel format - would need frontend library like xlsx
        toast.success('Export completed successfully')
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Export failed')
    }
  })

  const handleExport = () => {
    const payload = {
      type: exportType,
      format: exportFormat,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: parseInt(limit)
    }
    exportMutation.mutate(payload)
  }

  const exportTypeIcons = {
    sales: '💰',
    invoices: '📄',
    customers: '👥',
    products: '📦',
    employees: '👤',
    expenses: '💸',
    payments: '💳',
    purchase_orders: '🛒',
    inventory: '📊',
    all: '🗂️'
  }

  return (
    <>
      <Helmet><title>Data Export — MSME BMS</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Data Export & Backup
          </h1>
          <p className="text-muted-foreground mt-1">
            Export your business data in multiple formats for backup, reporting, or compliance purposes.
          </p>
        </div>

        {/* Statistics cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Object.entries(stats).map(([key, count]) => (
              <Card key={key} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{exportTypeIcons[key] || '📋'}</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Export form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Export Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Type</label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config?.types?.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {exportTypeIcons[type.value]} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {stats && stats[exportType] 
                    ? `${stats[exportType].toLocaleString()} records available`
                    : 'Select a data type to export'}
                </p>
              </div>

              {/* Export format */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config?.formats?.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {exportFormat === 'csv' && 'Compatible with Excel, Google Sheets'}
                  {exportFormat === 'json' && 'For programmatic access and backup'}
                  {exportFormat === 'excel' && 'Native Excel format (.xlsx)'}
                </p>
              </div>
            </div>

            {/* Date filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || undefined}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Limit */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Record Limit
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  min="1"
                  max="10000"
                  className="max-w-xs"
                />
                <span className="text-sm text-muted-foreground">records (max: 10,000)</span>
              </div>
            </div>

            {/* Export button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                size="lg"
                className="w-full md:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportMutation.isPending ? 'Exporting...' : `Export ${exportType.replace(/_/g, ' ')}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              💡 Export Tips
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• CSV format is recommended for spreadsheet applications (Excel, Google Sheets)</li>
              <li>• JSON format is ideal for data backup and programmatic access</li>
              <li>• Use date range filters to export specific time periods</li>
              <li>• Export "All" to create a complete backup of your business data</li>
              <li>• Exported files include all related data (items, customer info, etc.)</li>
              <li>• Large exports may take a few moments to process</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
