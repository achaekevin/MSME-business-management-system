import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, RefreshCw, Send, CheckCircle2, Download, CreditCard } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { invoiceService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.get(id).then(r => r.data),
    staleTime: 30_000
  })

  const sendMutation = useMutation({
    mutationFn: () => invoiceService.send(id),
    onSuccess: () => {
      toast.success('Invoice email sent to customer successfully')
      qc.invalidateQueries({ queryKey: ['invoice', id] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to send invoice')
  })

  const paymentMutation = useMutation({
    mutationFn: (body) => invoiceService.recordPayment(id, body),
    onSuccess: () => {
      toast.success('Payment recorded successfully')
      qc.invalidateQueries({ queryKey: ['invoice', id] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      setOpen(false)
      setAmount(0)
      setNotes('')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to record payment')
  })

  const handleDownloadPdf = async () => {
    try {
      const res = await invoiceService.getPdf(id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice_${inv.invoiceNumber || id.substring(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      toast.error('Failed to download invoice PDF')
    }
  }

  const inv = data?.data || {}
  const items = inv.items || []
  const payments = inv.payments || []

  return (
    <>
      <Helmet><title>Invoice Detail — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">Invoice Details</h1>
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
              {/* General details */}
              <Card>
                <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-semibold">{inv.invoiceNumber || `INV-${inv.id?.substring(0, 8)}`}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Due {format(new Date(inv.dueDate), 'MMM dd, yyyy')}</p>
                  </div>
                  <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'destructive' : 'warning'}>
                    {inv.status?.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-semibold">{inv.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.customer?.email}</p>
                      <p className="text-xs text-muted-foreground">{inv.customer?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Invoice</p>
                      <p className="text-2xl font-bold text-indigo-600">${Number(inv.total).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-2">Balance Due</p>
                      <p className="text-lg font-semibold text-amber-600">${Number(inv.balance).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              <Card>
                <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Product</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Qty</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Price</th>
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
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Payments Ledger */}
              <Card>
                <CardHeader><CardTitle className="text-base">Payments Ledger</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {payments.map((p, i) => (
                    <div key={i} className="p-3 border rounded-lg flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold">Payment Received</p>
                        <p className="text-xs text-muted-foreground">Recorded on {format(new Date(p.createdAt), 'MMM dd, yyyy')}</p>
                        {p.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {p.notes}</p>}
                      </div>
                      <span className="font-semibold text-green-600">${Number(p.amount).toLocaleString()}</span>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">No payments recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions Side */}
            <div>
              <Card>
                <CardHeader><CardTitle className="text-base">Invoice Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline" onClick={handleDownloadPdf}>
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  {inv.status !== 'paid' && (
                    <>
                      <Button className="w-full font-semibold" onClick={() => { setAmount(inv.balance); setOpen(true) }}>
                        <CreditCard className="h-4 w-4 mr-2" /> Record Payment
                      </Button>
                      <Button className="w-full" variant="outline" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                        <Send className="h-4 w-4 mr-2" /> Send by Email
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Record Payment Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Invoice Payment</DialogTitle></DialogHeader>
            <div className="space-y-4 my-2">
              <div className="space-y-2">
                <Label>Amount ($) *</Label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} />
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select defaultValue="cash" onValueChange={v => setPaymentMethod(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Receipt notes..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => paymentMutation.mutate({ amount, paymentMethod, notes })} disabled={paymentMutation.isPending || amount <= 0}>
                {paymentMutation.isPending ? 'Saving...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
