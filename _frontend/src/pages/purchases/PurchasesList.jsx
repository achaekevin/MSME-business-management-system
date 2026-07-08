import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, RefreshCw, ShoppingBag, Truck, Trash2 } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { purchaseSchema } from '@/validations'
import { purchaseService, supplierService, productService } from '@/services'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = [
  { accessorKey: 'purchaseNumber', header: 'PO #', cell: ({ row }) => (
    <Link to={`/purchases/${row.original.id}`} className="font-semibold text-primary hover:underline">
      {row.original.purchaseNumber || `PO-${row.original.id.substring(0, 8)}`}
    </Link>
  )},
  { accessorKey: 'supplier.name', header: 'Supplier', cell: ({ row }) => row.original.supplier?.name || '—' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const statuses = {
      draft: { label: 'Draft', color: 'secondary' },
      sent: { label: 'Sent', color: 'blue' },
      partial: { label: 'Partial', color: 'warning' },
      received: { label: 'Received', color: 'success' },
      cancelled: { label: 'Cancelled', color: 'destructive' }
    }
    const s = statuses[row.original.status] || { label: row.original.status, color: 'secondary' }
    return <Badge variant={s.color}>{s.label.toUpperCase()}</Badge>
  }},
  { accessorKey: 'total', header: 'Total Amount', cell: ({ row }) => (
    <span>${row.original.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
  )},
  { accessorKey: 'createdAt', header: 'Order Date', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy') } catch { return '—' }
  }},
]

export default function PurchasesList() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => supplierService.list({ limit: 500 }).then(r => r.data) })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productService.list({ limit: 500 }).then(r => r.data) })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['purchases', { page }],
    queryFn: () => purchaseService.list({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const formItems = watch('items') || []
  const orderTotal = formItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0)

  const createMutation = useMutation({
    mutationFn: (d) => purchaseService.create(d),
    onSuccess: () => {
      toast.success('Purchase Order created successfully')
      qc.invalidateQueries({ queryKey: ['purchases'] })
      reset({
        supplierId: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }]
      })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create PO')
  })

  const suppliersList = suppliers?.data || []
  const productsList = products?.data || []
  const purchases = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Purchase Orders — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage stock replenishment purchase orders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Create PO
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Purchase Orders List</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={purchases}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No purchase orders created yet"
            />
          </CardContent>
        </Card>

        {/* Create PO Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select onValueChange={v => setValue('supplierId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliersList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.supplierId && <p className="text-xs text-destructive">{errors.supplierId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Expected Date</Label>
                  <Input type="date" {...register('expectedDate')} />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold">Order Items</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}>
                    Add Item
                  </Button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Select onValueChange={v => setValue(`items.${idx}.productId`, v)}>
                          <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                          <SelectContent>
                            {productsList.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Input type="number" step="1" placeholder="Qty" {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                      </div>
                      <div className="w-24">
                        <Input type="number" step="0.01" placeholder="Cost" {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })} />
                      </div>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.items?.root && (
                  <p className="text-xs text-destructive mt-1">{errors.items.root.message}</p>
                )}

                <div className="flex justify-end border-t pt-2 mt-2 text-sm font-semibold">
                  Total Amount: ${orderTotal.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Additional comments..." {...register('notes')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting...' : 'Create Order'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
