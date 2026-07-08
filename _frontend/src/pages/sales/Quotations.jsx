import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { PlusCircle, Search, RefreshCw, FileText, Check } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { saleSchema } from '@/validations'
import { salesService, customerService, productService, businessService } from '@/services'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = (onConvert) => [
  { accessorKey: 'quotationNumber', header: 'Quotation #', cell: ({ row }) => (
    <span className="font-semibold">{row.original.quotationNumber || `QT-${row.original.id.substring(0, 8)}`}</span>
  )},
  { accessorKey: 'customer.name', header: 'Customer', cell: ({ row }) => row.original.customer?.name || 'Walk-in Customer' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const statuses = {
      draft: { label: 'Draft', color: 'secondary' },
      sent: { label: 'Sent', color: 'blue' },
      converted: { label: 'Converted', color: 'success' },
      expired: { label: 'Expired', color: 'destructive' }
    }
    const s = statuses[row.original.status] || { label: row.original.status, color: 'secondary' }
    return <Badge variant={s.color}>{s.label.toUpperCase()}</Badge>
  }},
  { accessorKey: 'total', header: 'Total Value', cell: ({ row }) => (
    <span>${Number(row.original.total).toLocaleString()}</span>
  )},
  { accessorKey: 'createdAt', header: 'Created At', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { id: 'actions', header: 'Actions', cell: ({ row }) => {
    if (row.original.status === 'converted') return <Badge variant="success">SALES MATCHED</Badge>
    return (
      <Button variant="outline" size="sm" onClick={() => onConvert(row.original.id)}>
        <Check className="h-4 w-4 mr-1" /> Convert to Sale
      </Button>
    )
  }}
]

export default function Quotations() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => customerService.list({ limit: 500 }).then(r => r.data) })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productService.list({ limit: 500 }).then(r => r.data) })
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: () => businessService.getBranches().then(r => r.data) })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['quotations', { page }],
    queryFn: () => salesService.getQuotations({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const formItems = watch('items') || []
  const subtotal = formItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0)

  const createMutation = useMutation({
    mutationFn: (d) => salesService.createQuotation(d),
    onSuccess: () => {
      toast.success('Sales quotation generated successfully')
      qc.invalidateQueries({ queryKey: ['quotations'] })
      reset({ items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }] })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create quotation')
  })

  const convertMutation = useMutation({
    mutationFn: (id) => salesService.convertToSale(id),
    onSuccess: () => {
      toast.success('Quotation converted to active POS sale successfully')
      qc.invalidateQueries({ queryKey: ['quotations'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Conversion failed')
  })

  const customersList = customers?.data || []
  const productsList = products?.data || []
  const branchesList = branches?.data || []
  const quotations = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Sales Quotations — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sales Quotations</h1>
            <p className="text-muted-foreground text-sm mt-1">Raise and convert invoices quotes for customers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Create Quotation
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Quotations List</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(id => {
                if (confirm('Are you sure you want to convert this quotation into an active cash sale?')) {
                  convertMutation.mutate(id)
                }
              })}
              data={quotations}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No quotations raised yet"
            />
          </CardContent>
        </Card>

        {/* Create Quotation Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Sales Quotation</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select onValueChange={v => setValue('customerId', v)}>
                    <SelectTrigger><SelectValue placeholder="Walk-in Customer" /></SelectTrigger>
                    <SelectContent>
                      {customersList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select onValueChange={v => setValue('branchId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                    <SelectContent>
                      {branchesList.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.branchId && <p className="text-xs text-destructive">{errors.branchId.message}</p>}
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold">Quote Items</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 })}>
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
                            {productsList.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-16">
                        <Input type="number" step="1" placeholder="Qty" {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                      </div>
                      <div className="w-20">
                        <Input type="number" step="0.01" placeholder="Price" {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })} />
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
                  Subtotal: ${subtotal.toFixed(2)}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Generating...' : 'Generate Quote'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
