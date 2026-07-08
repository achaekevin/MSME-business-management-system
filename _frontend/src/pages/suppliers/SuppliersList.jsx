import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, RefreshCw, Trash2, Edit2, Phone, Mail } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supplierSchema } from '@/validations'
import { supplierService } from '@/services'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'

const columns = (onDelete) => [
  { accessorKey: 'name', header: 'Supplier Name', cell: ({ row }) => (
    <div>
      <Link to={`/suppliers/${row.original.id}`} className="font-semibold text-primary hover:underline">
        {row.original.name}
      </Link>
      {row.original.taxNumber && <div className="text-xs text-muted-foreground">VAT: {row.original.taxNumber}</div>}
    </div>
  )},
  { accessorKey: 'email', header: 'Contact Email', cell: ({ row }) => row.original.email || '—' },
  { accessorKey: 'phone', header: 'Phone Number', cell: ({ row }) => row.original.phone || '—' },
  { accessorKey: 'paymentTerms', header: 'Terms', cell: ({ row }) => (
    <span>{row.original.paymentTerms} Days</span>
  )},
  { accessorKey: 'balance', header: 'Outstanding Balance', cell: ({ row }) => (
    <span className="font-semibold text-red-600">${Number(row.original.balance).toLocaleString()}</span>
  )},
  { id: 'actions', header: 'Actions', cell: ({ row }) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/suppliers/${row.original.id}`}>
          <Edit2 className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(row.original.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )}
]

export default function SuppliersList() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suppliers', { page, search }],
    queryFn: () => supplierService.list({ page, limit: 25, search }).then(r => r.data),
    keepPreviousData: true
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: { paymentTerms: 30 }
  })

  const createMutation = useMutation({
    mutationFn: (d) => supplierService.create(d),
    onSuccess: () => {
      toast.success('Supplier added successfully')
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      reset()
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add supplier')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => supplierService.delete(id),
    onSuccess: () => {
      toast.success('Supplier deleted successfully')
      qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete supplier')
  })

  const suppliers = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Suppliers — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage vendor directory and payment details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Supplier
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">All Suppliers</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(id => {
                if (confirm('Are you sure you want to delete this supplier?')) {
                  deleteMutation.mutate(id)
                }
              })}
              data={suppliers}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              searchable
              searchPlaceholder="Search suppliers..."
              onSearch={v => { setSearch(v); setPage(1) }}
              emptyMessage="No suppliers found"
            />
          </CardContent>
        </Card>

        {/* Dialog Add Form */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier Name *</Label>
                <Input placeholder="e.g. Acme Corp" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="contact@acme.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="+254..." {...register('phone')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>VAT / Tax Number</Label>
                  <Input placeholder="PIN number..." {...register('taxNumber')} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms (Days) *</Label>
                  <Input type="number" {...register('paymentTerms', { valueAsNumber: true })} />
                  {errors.paymentTerms && <p className="text-xs text-destructive">{errors.paymentTerms.message}</p>}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Supplier'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
