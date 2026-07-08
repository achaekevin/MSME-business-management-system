import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, RefreshCw, ShoppingBag, Truck, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { purchaseService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function PurchaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => purchaseService.get(id).then(r => r.data),
    staleTime: 30_000
  })

  const receiveMutation = useMutation({
    mutationFn: (body) => purchaseService.receive(id, body),
    onSuccess: () => {
      toast.success('Goods received successfully and inventory updated')
      qc.invalidateQueries({ queryKey: ['purchase', id] })
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['stock-levels'] })
      qc.invalidateQueries({ queryKey: ['inventory-dashboard'] })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to receive goods')
  })

  const po = data?.data || {}
  const items = po.items || []
  const grns = po.goodsReceived || []

  return (
    <>
      <Helmet><title>Purchase Order Detail — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">{po.orderNumber || 'Purchase Order'}</h1>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Order Info */}
              <Card>
                <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-semibold">Order Information</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">PO generated on {format(new Date(po.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                  <Badge variant={po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'destructive' : 'warning'}>
                    {po.status?.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Supplier</p>
                      <p className="font-semibold">{po.supplier?.name}</p>
                      <p className="text-xs text-muted-foreground">{po.supplier?.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery Branch</p>
                      <p className="font-semibold">{po.branch?.name || 'Main Branch'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card>
                <CardHeader><CardTitle className="text-base">Ordered Items</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Product</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Qty</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Unit Cost</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-4 py-3 font-medium">
                            {item.product?.name}
                            <span className="block text-xs text-muted-foreground">{item.product?.sku}</span>
                          </td>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">${Number(item.unitPrice).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold">${Number(item.total).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/20">
                        <td colSpan={3} className="px-4 py-3 text-right">Subtotal</td>
                        <td className="px-4 py-3 text-right">${Number(po.subtotal).toLocaleString()}</td>
                      </tr>
                      {Number(po.discountAmount) > 0 && (
                        <tr className="font-semibold text-red-600">
                          <td colSpan={3} className="px-4 py-3 text-right">Discount</td>
                          <td className="px-4 py-3 text-right">-${Number(po.discountAmount).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="font-bold border-b-2">
                        <td colSpan={3} className="px-4 py-3 text-right text-base">Total Order Value</td>
                        <td className="px-4 py-3 text-right text-base">${Number(po.total).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Goods Received Notes (GRN) */}
              <Card>
                <CardHeader><CardTitle className="text-base">Goods Received Notes (GRNs)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {grns.map((grn, i) => (
                    <div key={i} className="p-3 border rounded-lg flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold">{grn.grnNumber}</p>
                        <p className="text-xs text-muted-foreground">Received on {format(new Date(grn.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                        {grn.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {grn.notes}</p>}
                      </div>
                      <Badge variant="success">Received</Badge>
                    </div>
                  ))}
                  {grns.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">No goods received logs yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions Card */}
            <div>
              <Card>
                <CardHeader><CardTitle className="text-base">Order Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {po.status !== 'received' && po.status !== 'cancelled' ? (
                    <>
                      <Button className="w-full" onClick={() => setOpen(true)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Receive Goods (GRN)
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground">This order is completed and closed</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Receive Goods Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Receive Goods & Update Inventory</DialogTitle></DialogHeader>
            <div className="space-y-4 my-2">
              <p className="text-sm text-muted-foreground">
                This will record a Goods Received Note (GRN), increment stock levels in your warehouse, and update the supplier statement balance.
              </p>
              <div className="space-y-2">
                <Label>Receipt Notes</Label>
                <Input placeholder="e.g. Delivered on time, all items intact..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => receiveMutation.mutate({ notes })} disabled={receiveMutation.isPending}>
                {receiveMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
