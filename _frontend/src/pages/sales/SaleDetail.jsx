import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, RefreshCw, Printer, AlertTriangle, FileText } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { salesService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function SaleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesService.get(id).then(r => r.data),
    staleTime: 30_000
  })

  const voidMutation = useMutation({
    mutationFn: (reason) => salesService.void(id, reason),
    onSuccess: () => {
      toast.success('Sale voided successfully and inventory returned')
      qc.invalidateQueries({ queryKey: ['sale', id] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['stock-levels'] })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to void sale')
  })

  const sale = data?.data || {}
  const items = sale.items || []

  return (
    <>
      <Helmet><title>Sale Detail — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/sales')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">Sale Details</h1>
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
              {/* Sale Info */}
              <Card>
                <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-semibold">Sale #{sale.invoiceNumber || sale.id?.substring(0, 8)}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Recorded on {format(new Date(sale.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <Badge variant={sale.status === 'paid' ? 'success' : sale.status === 'voided' ? 'destructive' : 'warning'}>
                    {sale.status?.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-semibold">{sale.customer?.name || 'Walk-in Customer'}</p>
                      {sale.customer?.phone && <p className="text-xs text-muted-foreground">{sale.customer.phone}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Served By</p>
                      <p className="font-semibold">{sale.user?.name || 'Cashier'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card>
                <CardHeader><CardTitle className="text-base">Sold Items</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Product</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Qty</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Price</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Discount</th>
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
                          <td className="px-4 py-3 text-right text-red-600">-${Number(item.discount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold">${Number(item.total).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/20">
                        <td colSpan={4} className="px-4 py-3 text-right">Subtotal</td>
                        <td className="px-4 py-3 text-right">${Number(sale.subtotal).toLocaleString()}</td>
                      </tr>
                      {Number(sale.discountAmount) > 0 && (
                        <tr className="font-semibold text-red-600">
                          <td colSpan={4} className="px-4 py-3 text-right">Order Discount</td>
                          <td className="px-4 py-3 text-right">-${Number(sale.discountAmount).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="font-bold border-b-2">
                        <td colSpan={4} className="px-4 py-3 text-right text-base">Grand Total</td>
                        <td className="px-4 py-3 text-right text-base">${Number(sale.total).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Actions Card */}
            <div>
              <Card>
                <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" /> Print Receipt
                  </Button>
                  {sale.status !== 'voided' && (
                    <Button className="w-full" variant="destructive" onClick={() => setOpen(true)}>
                      <AlertTriangle className="h-4 w-4 mr-2" /> Void Sale
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Void Sale Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Void Sale</DialogTitle></DialogHeader>
            <div className="space-y-4 my-2">
              <p className="text-sm text-muted-foreground">
                Voiding this sale will return all items back into stock, reverse the double-entry accounting ledger entries, and mark the invoice as cancelled.
              </p>
              <div className="space-y-2">
                <Label>Reason for Voiding *</Label>
                <Input placeholder="e.g. Input error, Customer refund..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => voidMutation.mutate(reason)} disabled={voidMutation.isPending || !reason}>
                {voidMutation.isPending ? 'Processing...' : 'Confirm Void'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
