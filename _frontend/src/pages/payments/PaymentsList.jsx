import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { RefreshCw, CreditCard, Landmark, DollarSign } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton, Badge } from '@/components/ui'
import { paymentService } from '@/services'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = [
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm') } catch { return '—' }
  }},
  { accessorKey: 'paymentNumber', header: 'Receipt #', cell: ({ row }) => (
    <span className="font-mono font-semibold">{row.original.paymentNumber || `REC-${row.original.id.substring(0, 8)}`}</span>
  )},
  { accessorKey: 'invoice.invoiceNumber', header: 'Invoice Reference', cell: ({ row }) => (
    row.original.invoice?.invoiceNumber || '—'
  )},
  { accessorKey: 'paymentMethod', header: 'Method', cell: ({ row }) => {
    const val = row.original.paymentMethod
    return val ? val.replace('_', ' ').toUpperCase() : '—'
  }},
  { accessorKey: 'amount', header: 'Amount Received', cell: ({ row }) => (
    <span className="font-bold text-green-600">${Number(row.original.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
  )},
  { accessorKey: 'status', header: 'Status', cell: () => <Badge variant="success">SUCCESS</Badge> }
]

export default function PaymentsList() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', { page }],
    queryFn: () => paymentService.list({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const payments = data?.data || []
  const total = data?.total || 0

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return (
    <>
      <Helmet><title>Cash Book Ledger — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cash Book Ledger</h1>
            <p className="text-muted-foreground text-sm mt-1">Audit trail of all payment collections and customer cash receipts</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cash Collected (This Page)</p>
                <p className="text-3xl font-bold mt-1 text-green-600">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Count</p>
                <p className="text-3xl font-bold mt-1">{total}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Payment Transactions</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={payments}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No payment transactions audit log found"
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
