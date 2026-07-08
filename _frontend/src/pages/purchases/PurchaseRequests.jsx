import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { PlusCircle, ShoppingBag, Truck, RefreshCw, FileText } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Badge
} from '@/components/ui'
import { productService, supplierService } from '@/services'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

export default function PurchaseRequests() {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState([
    { id: '1', item: 'Office Stationeries', quantity: 15, expectedCost: 200, status: 'approved', createdAt: new Date() },
    { id: '2', item: 'Packaging Material Box', quantity: 500, expectedCost: 1500, status: 'pending', createdAt: new Date() }
  ])

  const [form, setForm] = useState({ item: '', quantity: 1, expectedCost: 0 })

  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productService.list({ limit: 500 }).then(r => r.data) })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.item) return toast.error('Item name required')
    setRequests(prev => [
      ...prev,
      {
        id: String(prev.length + 1),
        item: form.item,
        quantity: Number(form.quantity),
        expectedCost: Number(form.expectedCost),
        status: 'pending',
        createdAt: new Date()
      }
    ])
    toast.success('Purchase request submitted for approval')
    setForm({ item: '', quantity: 1, expectedCost: 0 })
    setOpen(false)
  }

  const columns = [
    { accessorKey: 'item', header: 'Requested Item' },
    { accessorKey: 'quantity', header: 'Quantity' },
    { accessorKey: 'expectedCost', header: 'Estimated Cost', cell: ({ row }) => `$${row.original.expectedCost.toLocaleString()}` },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status
      return (
        <Badge variant={s === 'approved' ? 'success' : 'warning'}>
          {s.toUpperCase()}
        </Badge>
      )
    }},
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy') }
  ]

  return (
    <>
      <Helmet><title>Purchase Requests — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Internal Purchase Requests</h1>
            <p className="text-muted-foreground text-sm mt-1">Submit and track requests for internal inventory purchasing</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> New Request
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Requests List</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={requests}
              searchable={false}
              emptyMessage="No purchase requests logged"
            />
          </CardContent>
        </Card>

        {/* Dialog form */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Purchase Request</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Item Name / Product *</Label>
                <Input placeholder="e.g. Printer Cartridges" value={form.item} onChange={e => setForm(p => ({ ...p, item: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Total Cost ($)</Label>
                  <Input type="number" step="0.01" value={form.expectedCost} onChange={e => setForm(p => ({ ...p, expectedCost: e.target.value }))} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
