import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Search, Package, Filter, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Skeleton } from '@/components/ui'
import { inventoryService } from '@/services'
import { usePagination } from '@/hooks'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = [
  { accessorKey: 'product.name', header: 'Product', cell: ({ row }) => (
    <div>
      <div className="font-medium">{row.original.product?.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.product?.sku}</div>
    </div>
  )},
  { accessorKey: 'product.category.name', header: 'Category', cell: ({ row }) => row.original.product?.category?.name || '—' },
  { accessorKey: 'warehouse.name', header: 'Warehouse', cell: ({ row }) => row.original.warehouse?.name || 'Main' },
  { accessorKey: 'quantity', header: 'Quantity', cell: ({ row }) => {
    const qty = row.original.quantity
    const reorder = row.original.product?.reorderPoint || 0
    return (
      <span className={qty <= reorder ? 'text-red-600 font-medium' : qty <= reorder * 1.5 ? 'text-amber-600 font-medium' : ''}>
        {qty}
      </span>
    )
  }},
  { accessorKey: 'product.unit.name', header: 'Unit', cell: ({ row }) => row.original.product?.unit?.name || '—' },
  { accessorKey: 'product.reorderPoint', header: 'Reorder At', cell: ({ row }) => row.original.product?.reorderPoint ?? '—' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const qty = row.original.quantity
    const rp = row.original.product?.reorderPoint || 0
    if (qty === 0) return <Badge variant="destructive">Out of Stock</Badge>
    if (qty <= rp) return <Badge variant="warning">Low Stock</Badge>
    return <Badge variant="success">In Stock</Badge>
  }},
  { accessorKey: 'updatedAt', header: 'Last Updated', cell: ({ row }) => {
    try { return format(new Date(row.original.updatedAt), 'MMM dd, yyyy') } catch { return '—' }
  }},
]

export default function StockLevels() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | low | out
  const { page, limit, setPage, setLimit } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['stock-levels', { page, limit, search, filter }],
    queryFn: () => inventoryService.getStock({ page, limit, search, filter }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 30_000
  })

  const items = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Stock Levels — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stock Levels</h1>
            <p className="text-muted-foreground text-sm mt-1">View and monitor inventory across all locations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button size="sm" asChild>
              <Link to="/inventory/adjust">Adjust Stock</Link>
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Items', value: total, color: 'text-blue-600' },
            { label: 'Low Stock', value: items.filter(i => i.quantity > 0 && i.quantity <= (i.product?.reorderPoint || 0)).length, color: 'text-amber-600' },
            { label: 'Out of Stock', value: items.filter(i => i.quantity === 0).length, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle className="text-base">Inventory Items</CardTitle>
              <div className="flex gap-2 flex-wrap">
                {['all', 'low', 'out'].map(f => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filter === f ? 'default' : 'outline'}
                    onClick={() => { setFilter(f); setPage(1) }}
                  >
                    {f === 'all' ? 'All Items' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={items}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
              searchable
              searchPlaceholder="Search products..."
              onSearch={v => { setSearch(v); setPage(1) }}
              emptyMessage="No stock items found"
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
