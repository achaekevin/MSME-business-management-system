import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, ArrowLeftRight, Warehouse } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Badge
} from '@/components/ui'
import { inventoryService, productService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DataTable } from '@/components/tables/DataTable'

const schema = z.object({
  productId: z.string().min(1, 'Product required'),
  fromWarehouseId: z.string().min(1, 'Source warehouse required'),
  toWarehouseId: z.string().min(1, 'Destination warehouse required'),
  quantity: z.coerce.number().min(1, 'Must be at least 1'),
  notes: z.string().optional()
})

const columns = [
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm') } catch { return '—' }
  }},
  { accessorKey: 'product.name', header: 'Product', cell: ({ row }) => row.original.product?.name || '—' },
  { accessorKey: 'from', header: 'From', cell: ({ row }) => row.original.fromWarehouse?.name || '—' },
  { accessorKey: 'to', header: 'To', cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
      {row.original.toWarehouse?.name || '—'}
    </div>
  )},
  { accessorKey: 'quantity', header: 'Quantity', cell: ({ row }) => <span className="font-medium">{row.original.quantity}</span> },
  { accessorKey: 'status', header: 'Status', cell: () => <Badge variant="success">Completed</Badge> },
  { accessorKey: 'user.name', header: 'By', cell: ({ row }) => row.original.user?.name || '—' },
]

export default function StockTransfer() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data: products } = useQuery({ queryKey: ['products-list'], queryFn: () => productService.list({ limit: 500 }).then(r => r.data) })
  const { data: warehouses } = useQuery({ queryKey: ['warehouses-list'], queryFn: () => inventoryService.getWarehouses().then(r => r.data) })
  const { data, isLoading } = useQuery({
    queryKey: ['stock-transfers', { page }],
    queryFn: () => inventoryService.getTransactions({ page, limit: 25, type: 'transfer' }).then(r => r.data),
    keepPreviousData: true
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  const transferMutation = useMutation({
    mutationFn: (data) => inventoryService.transfer(data),
    onSuccess: () => {
      toast.success('Stock transferred successfully')
      qc.invalidateQueries({ queryKey: ['stock-transfers'] })
      qc.invalidateQueries({ queryKey: ['stock-levels'] })
      reset()
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Transfer failed')
  })

  const productsList = products?.data || []
  const warehousesList = warehouses?.data || []
  const transfers = data?.data || []

  return (
    <>
      <Helmet><title>Stock Transfers — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stock Transfers</h1>
            <p className="text-muted-foreground text-sm mt-1">Move stock between warehouses</p>
          </div>
          <Button onClick={() => setOpen(true)} disabled={warehousesList.length < 2}>
            <PlusCircle className="h-4 w-4 mr-2" /> New Transfer
          </Button>
        </div>

        {warehousesList.length < 2 && (
          <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
            You need at least 2 warehouses to transfer stock. <a href="/inventory/warehouses" className="underline font-medium">Add a warehouse</a>
          </div>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Transfer History</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={transfers}
              isLoading={isLoading}
              total={data?.total || 0}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No transfers recorded yet"
            />
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => transferMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Product *</Label>
                <Select onValueChange={v => setValue('productId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {productsList.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>From Warehouse *</Label>
                  <Select onValueChange={v => setValue('fromWarehouseId', v)}>
                    <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                      {warehousesList.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.fromWarehouseId && <p className="text-xs text-destructive">{errors.fromWarehouseId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>To Warehouse *</Label>
                  <Select onValueChange={v => setValue('toWarehouseId', v)}>
                    <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                    <SelectContent>
                      {warehousesList.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.toWarehouseId && <p className="text-xs text-destructive">{errors.toWarehouseId.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" min="1" {...register('quantity')} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Optional transfer notes..." {...register('notes')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={transferMutation.isPending}>
                  {transferMutation.isPending ? 'Transferring...' : 'Transfer Stock'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
