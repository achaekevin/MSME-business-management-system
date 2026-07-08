import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui'
import { inventoryService, productService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DataTable } from '@/components/tables/DataTable'

const schema = z.object({
  productId: z.string().min(1, 'Product required'),
  warehouseId: z.string().optional(),
  type: z.enum(['in', 'out', 'set']),
  quantity: z.coerce.number().min(1, 'Must be at least 1'),
  reason: z.string().min(2, 'Reason required'),
  notes: z.string().optional()
})

const columns = [
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm') } catch { return '—' }
  }},
  { accessorKey: 'product.name', header: 'Product', cell: ({ row }) => (
    <div>
      <div className="font-medium">{row.original.product?.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.product?.sku}</div>
    </div>
  )},
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => {
    const icons = { in: <ArrowUpCircle className="h-4 w-4 text-green-500" />, out: <ArrowDownCircle className="h-4 w-4 text-red-500" />, set: <MinusCircle className="h-4 w-4 text-blue-500" /> }
    const labels = { in: 'Stock In', out: 'Stock Out', set: 'Set Quantity' }
    return (
      <div className="flex items-center gap-2">
        {icons[row.original.type]}
        <span className="text-sm">{labels[row.original.type]}</span>
      </div>
    )
  }},
  { accessorKey: 'quantity', header: 'Quantity', cell: ({ row }) => {
    const t = row.original.type
    const q = row.original.quantity
    return <span className={t === 'in' ? 'text-green-600 font-medium' : t === 'out' ? 'text-red-600 font-medium' : 'text-blue-600 font-medium'}>
      {t === 'in' ? '+' : t === 'out' ? '-' : ''}{q}
    </span>
  }},
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'user.name', header: 'By', cell: ({ row }) => row.original.user?.name || '—' },
]

export default function StockAdjustments() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 25

  const { data: products } = useQuery({ queryKey: ['products-list'], queryFn: () => productService.list({ limit: 500 }).then(r => r.data) })
  const { data: warehouses } = useQuery({ queryKey: ['warehouses-list'], queryFn: () => inventoryService.getWarehouses().then(r => r.data) })
  const { data, isLoading } = useQuery({
    queryKey: ['stock-transactions', { page, limit }],
    queryFn: () => inventoryService.getTransactions({ page, limit }).then(r => r.data),
    keepPreviousData: true
  })

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'in', quantity: 1, reason: '' }
  })

  const adjustMutation = useMutation({
    mutationFn: (data) => inventoryService.adjust(data),
    onSuccess: () => {
      toast.success('Stock adjusted successfully')
      qc.invalidateQueries({ queryKey: ['stock-transactions'] })
      qc.invalidateQueries({ queryKey: ['stock-levels'] })
      qc.invalidateQueries({ queryKey: ['inventory-dashboard'] })
      reset()
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Adjustment failed')
  })

  const productsList = products?.data || []
  const warehousesList = warehouses?.data || []
  const transactions = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Stock Adjustments — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stock Adjustments</h1>
            <p className="text-muted-foreground text-sm mt-1">Record stock in, out, or set operations</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> New Adjustment
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Adjustment History</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={transactions}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={limit}
              onPageChange={setPage}
              emptyMessage="No adjustments recorded yet"
            />
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Stock Adjustment</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => adjustMutation.mutate(d))} className="space-y-4">
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

              {warehousesList.length > 0 && (
                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Select onValueChange={v => setValue('warehouseId', v)}>
                    <SelectTrigger><SelectValue placeholder="Default warehouse" /></SelectTrigger>
                    <SelectContent>
                      {warehousesList.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Type *</Label>
                <Select defaultValue="in" onValueChange={v => setValue('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (Add)</SelectItem>
                    <SelectItem value="out">Stock Out (Remove)</SelectItem>
                    <SelectItem value="set">Set Quantity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" min="1" {...register('quantity')} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Reason *</Label>
                <Input placeholder="e.g. Purchase received, Damaged goods..." {...register('reason')} />
                {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Additional details..." {...register('notes')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || adjustMutation.isPending}>
                  {adjustMutation.isPending ? 'Saving...' : 'Save Adjustment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
