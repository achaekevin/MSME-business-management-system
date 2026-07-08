import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { RefreshCw, ArrowUpRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { financeService } from '@/services'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = [
  { accessorKey: 'invoiceNumber', header: 'Invoice', cell: ({ row }) => (
    <Link to={`/invoices/${row.original.id}`} className="font-semibold text-primary hover:underline">
      {row.original.invoiceNumber || `INV-${row.original.id.substring(0, 8)}`}
    </Link>
  )},
  { accessorKey: 'customer.name', header: 'Customer', cell: ({ row }) => row.original.customer?.name || '—' },
  { accessorKey: 'dueDate', header: 'Due Date', cell: ({ row }) => {
    try { return format(new Date(row.original.dueDate), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { accessorKey: 'total', header: 'Invoice Total', cell: ({ row }) => {
    return <span>${row.original.total.toLocaleString()}</span>
  }},
  { accessorKey: 'balance', header: 'Outstanding Balance', cell: ({ row }) => {
    return <span className="font-semibold text-amber-600">${row.original.balance.toLocaleString()}</span>
  }},
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const isOverdue = new Date(row.original.dueDate) < new Date() && row.original.balance > 0
    return (
      <Badge variant={isOverdue ? 'destructive' : 'warning'}>
        {isOverdue ? 'Overdue' : 'Pending'}
      </Badge>
    )
  }}
]

export default function Receivables() {
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['receivables', { page }],
    queryFn: () => financeService.getReceivables({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const items = data?.data || []
  const total = data?.total || 0

  const totalOutstanding = items.reduce((sum, item) => sum + (item.balance || 0), 0)

  return (
    <>
      <Helmet><title>Accounts Receivable — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Accounts Receivable (AR)</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor unpaid invoices and money owed by customers</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receivables</p>
                <p className="text-3xl font-bold mt-1 text-amber-600">${totalOutstanding.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/20">
                <ArrowUpRight className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Invoices</p>
                <p className="text-3xl font-bold mt-1">{total}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Unpaid Invoices</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={items}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="All invoices are fully paid! 🎉"
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
