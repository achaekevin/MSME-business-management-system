import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { RefreshCw, RotateCcw, Search, CheckCircle2 } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { salesService } from '@/services'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = (onReturn) => [
  { accessorKey: 'invoiceNumber', header: 'Receipt / Invoice #', cell: ({ row }) => (
    <span className="font-semibold">{row.original.invoiceNumber || `INV-${row.original.id.substring(0, 8)}`}</span>
  )},
  { accessorKey: 'customer.name', header: 'Customer', cell: ({ row }) => row.original.customer?.name || 'Walk-in Customer' },
  { accessorKey: 'total', header: 'Total Value', cell: ({ row }) => (
    <span>${Number(row.original.total).toLocaleString()}</span>
  )},
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const s = row.original.status
    return <Badge variant={s === 'paid' ? 'success' : s === 'voided' ? 'destructive' : 'warning'}>{s.toUpperCase()}</Badge>
  }},
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { id: 'actions', header: 'Actions', cell: ({ row }) => {
    if (row.original.status === 'voided') return <Badge variant="secondary">VOIDED</Badge>
    return (
      <Button variant="outline" size="sm" onClick={() => onReturn(row.original)}>
        <RotateCcw className="h-4 w-4 mr-1" /> Process Return
      </Button>
    )
  }}
]

export default function SalesReturns() {
  const [open, setOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sales-returns-lookup', { page, search }],
    queryFn: () => salesService.list({ page, limit: 25, search }).then(r => r.data),
    keepPreviousData: true
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, body }) => salesService.createReturn({ id, ...body }), // wait, our service lists: createReturn: (data) => api.post(`/sales/${data.id}/returns`, data)
    onSuccess: () => {
      toast.success('Return/Refund recorded and stock reversed successfully')
      qc.invalidateQueries({ queryKey: ['sales-returns-lookup'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['stock-levels'] })
      setOpen(false)
      setSelectedSale(null)
      setReason('')
      setAmount(0)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to process return')
  })

  const handleOpenReturn = (sale) => {
    setSelectedSale(sale)
    setAmount(sale.total)
    setOpen(true)
  }

  const sales = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Sales Returns — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sales Returns & Refunds</h1>
            <p className="text-muted-foreground text-sm mt-1">Process customer refunds and reverse product inventory</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Select Sale for Refund</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(handleOpenReturn)}
              data={sales}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              searchable
              searchPlaceholder="Search invoices/receipts..."
              onSearch={v => { setSearch(v); setPage(1) }}
              emptyMessage="No sales orders found"
            />
          </CardContent>
        </Card>

        {/* Return Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Process Return</DialogTitle></DialogHeader>
            <div className="space-y-4 my-2">
              <p className="text-xs text-muted-foreground">
                Refunding Sale #{selectedSale?.invoiceNumber || selectedSale?.id.substring(0, 8)}. This will reverse quantity stock items back to the warehouse.
              </p>

              <div className="space-y-2">
                <Label>Return Reason *</Label>
                <Input placeholder="e.g. Damaged item, Customer changed mind..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Refund Amount ($) *</Label>
                <Input type="number" step="0.01" max={selectedSale?.total} value={amount} onChange={e => setAmount(Number(e.target.value))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => returnMutation.mutate({ id: selectedSale.id, body: { reason, amount } })} disabled={returnMutation.isPending || !reason || amount <= 0}>
                {returnMutation.isPending ? 'Processing...' : 'Complete Return'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
