import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Eye } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { salesService } from '@/services'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui'
import { useSearch, usePagination } from '@/hooks'
import { formatCurrency, formatDate } from '@/utils'
import { SALE_STATUSES } from '@/constants'

export default function SalesList() {
  const [statusFilter, setStatusFilter] = useState('')
  const { search, setSearch, debouncedSearch } = useSearch()
  const { page, limit, setPage, setLimit } = usePagination(0)

  const { data, isLoading } = useQuery({
    queryKey: ['sales', { page, limit, search: debouncedSearch, status: statusFilter }],
    queryFn: () => salesService.list({ page, limit, search: debouncedSearch, status: statusFilter }),
    placeholderData: prev => prev
  })

  const sales = data?.data?.data || []
  const total = data?.data?.total || 0

  const columns = [
    { header: 'Order #', accessorKey: 'orderNumber', cell: ({ row, getValue }) => <Link to={`/sales/${row.original.id}`} className="font-medium text-primary hover:underline">{getValue()}</Link> },
    { header: 'Customer', accessorKey: 'customer', cell: ({ row }) => row.original.customer?.name || 'Walk-in' },
    { header: 'Items', accessorKey: 'items', cell: ({ getValue }) => getValue()?.length || 0 },
    { header: 'Total', accessorKey: 'total', cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue())}</span> },
    { header: 'Paid', accessorKey: 'amountPaid', cell: ({ getValue }) => formatCurrency(getValue()) },
    { header: 'Balance', accessorKey: 'balance', cell: ({ getValue }) => getValue() > 0 ? <span className="text-red-600">{formatCurrency(getValue())}</span> : <span className="text-green-600">—</span> },
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => { const s = SALE_STATUSES.find(x => x.value === getValue()); return <Badge variant={s?.color}>{s?.label || getValue()}</Badge> } },
    { header: 'Date', accessorKey: 'createdAt', cell: ({ getValue }) => formatDate(getValue()) },
    { id: 'actions', header: '', cell: ({ row }) => <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link to={`/sales/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link></Button> }
  ]

  return (
    <>
      <Helmet><title>Sales — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{total.toLocaleString()} total orders</p>
          </div>
          <Button asChild><Link to="/sales/pos"><Plus className="h-4 w-4 mr-1" />New sale (POS)</Link></Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ value: '', label: 'All' }, ...SALE_STATUSES].map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`px-3 py-1 rounded-full text-sm ${statusFilter === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>{s.label}</button>
          ))}
        </div>
        <DataTable columns={columns} data={sales} isLoading={isLoading} total={total} page={page} limit={limit} onPageChange={setPage} onLimitChange={setLimit} searchPlaceholder="Search by order number..." onSearch={setSearch} />
      </div>
    </>
  )
}
