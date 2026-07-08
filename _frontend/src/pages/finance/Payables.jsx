import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { RefreshCw, ArrowDownRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { financeService } from '@/services'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = [
  { accessorKey: 'purchaseNumber', header: 'Purchase Order', cell: ({ row }) => (
    <Link to={`/purchases/${row.original.id}`} className="font-semibold text-primary hover:underline">
      {row.original.purchaseNumber || `PO-${row.original.id.substring(0, 8)}`}
    </Link>
  )},
  { accessorKey: 'supplier.name', header: 'Supplier', cell: ({ row }) => row.original.supplier?.name || '—' },
  { accessorKey: 'dueDate', header: 'Due Date', cell: ({ row }) => {
    try { return format(new Date(row.original.dueDate), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { accessorKey: 'total', header: 'Total Amount', cell: ({ row }) => {
    return <span>${row.original.total.toLocaleString()}</span>
  }},
  { accessorKey: 'balance', header: 'Balance Owed', cell: ({ row }) => {
    return <span className="font-semibold text-red-600">${row.original.balance.toLocaleString()}</span>
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

export default function Payables() {
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payables', { page }],
    queryFn: () => financeService.getPayables({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const items = data?.data || []
  const total = data?.total || 0

  const totalOwed = items.reduce((sum, item) => sum + (item.balance || 0), 0)

  return (
    <>
      <Helmet><title>Accounts Payable — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Accounts Payable (AP)</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor supplier bills and outstanding balances you owe</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payables</p>
                <p className="text-3xl font-bold mt-1 text-red-600">${totalOwed.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Bills</p>
                <p className="text-3xl font-bold mt-1">{total}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Outstanding Supplier Bills</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={items}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No payables pending! 🎉"
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
