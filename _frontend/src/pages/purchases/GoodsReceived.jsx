import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { RefreshCw, FileText, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { purchaseService } from '@/services'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = [
  { accessorKey: 'grnNumber', header: 'GRN Number', cell: ({ row }) => (
    <span className="font-mono font-semibold">{row.original.grnNumber || '—'}</span>
  )},
  { accessorKey: 'purchaseOrder.purchaseNumber', header: 'Purchase Order', cell: ({ row }) => (
    <Link to={`/purchases/${row.original.purchaseOrderId}`} className="font-semibold text-primary hover:underline">
      {row.original.purchaseOrder?.purchaseNumber || `PO-${row.original.purchaseOrderId.substring(0, 8)}`}
    </Link>
  )},
  { accessorKey: 'purchaseOrder.supplier.name', header: 'Supplier', cell: ({ row }) => row.original.purchaseOrder?.supplier?.name || '—' },
  { accessorKey: 'createdAt', header: 'Received Date', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm') } catch { return '—' }
  }},
  { accessorKey: 'notes', header: 'Delivery Notes', cell: ({ row }) => row.original.notes || '—' },
]

export default function GoodsReceived() {
  const [page, setPage] = useState(1)

  // Fetch POs and extract all GRNs from them since there is no separate GRN list endpoint
  const { data: poData, isLoading, refetch } = useQuery({
    queryKey: ['purchases-grns', { page }],
    queryFn: () => purchaseService.list({ page, limit: 100 }).then(r => r.data),
  })

  // Extract all goodsReceived records and inject the parent purchase order context
  const pos = poData?.data || []
  const grns = pos.flatMap(po => {
    const list = po.goodsReceived || []
    return list.map(grn => ({
      ...grn,
      purchaseOrder: {
        purchaseNumber: po.orderNumber,
        supplier: po.supplier
      }
    }))
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <>
      <Helmet><title>Goods Received (GRN) — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Goods Received Notes (GRN)</h1>
            <p className="text-muted-foreground text-sm mt-1">Logs of stock orders received into warehouses</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">GRN Registry</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={grns}
              isLoading={isLoading}
              total={grns.length}
              page={page}
              limit={25}
              onPageChange={setPage}
              searchable={false}
              emptyMessage="No goods received notes found"
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
