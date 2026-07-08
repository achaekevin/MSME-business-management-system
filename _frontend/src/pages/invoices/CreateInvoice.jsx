import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/components/ui'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { invoiceSchema } from '@/validations'
import { invoiceService, customerService, productService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function CreateInvoice() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => customerService.list({ limit: 500 }).then(r => r.data) })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productService.list({ limit: 500 }).then(r => r.data) })

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
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
    mutationFn: (d) => invoiceService.create(d),
    onSuccess: (res) => {
      toast.success('Invoice created successfully')
      qc.invalidateQueries({ queryKey: ['invoices'] })
      navigate(`/invoices/${res.data.data.id}`)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create invoice')
  })

  const customersList = customers?.data || []
  const productsList = products?.data || []

  return (
    <>
      <Helmet><title>New Invoice — MSME BMS</title></Helmet>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Invoices
          </Button>
          <h1 className="text-2xl font-bold font-heading">Create Invoice</h1>
        </div>

        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">General Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select onValueChange={v => setValue('customerId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                  <SelectContent>
                    {customersList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" {...register('dueDate')} />
                {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 })}>
                Add Line Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label className="text-xs">Product *</Label>
                      <Select onValueChange={v => {
                        setValue(`items.${idx}.productId`, v)
                        const p = productsList.find(prod => prod.id === v)
                        if (p) setValue(`items.${idx}.unitPrice`, p.sellingPrice || 0)
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                        <SelectContent>
                          {productsList.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (${p.sellingPrice})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-20">
                      <Label className="text-xs">Qty *</Label>
                      <Input type="number" step="1" {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                    </div>

                    <div className="w-24">
                      <Label className="text-xs">Unit Price *</Label>
                      <Input type="number" step="0.01" {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })} />
                    </div>

                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="mb-0.5" onClick={() => remove(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {errors.items?.root && (
                <p className="text-xs text-destructive">{errors.items.root.message}</p>
              )}

              <div className="border-t pt-4 flex justify-between items-center text-sm font-semibold">
                <div>Items: {fields.length}</div>
                <div className="text-base font-bold text-indigo-600">Total Invoice: ${subtotal.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Generating...' : 'Save & View'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
