import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, RefreshCw, Truck, Mail, Phone, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Tabs, TabsList, TabsTrigger, TabsContent, Skeleton } from '@/components/ui'
import { supplierService } from '@/services'
import { format } from 'date-fns'

export default function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.get(id).then(r => r.data),
    staleTime: 60_000
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['supplier-purchases', id],
    queryFn: () => supplierService.getPurchaseHistory(id).then(r => r.data),
    staleTime: 60_000
  })

  const { data: statementData, isLoading: statementLoading } = useQuery({
    queryKey: ['supplier-statement', id],
    queryFn: () => supplierService.getStatement(id).then(r => r.data),
    staleTime: 60_000
  })

  const sup = data?.data || {}
  const purchases = historyData?.data || []
  const statement = statementData?.data || []

  const fmt = (n) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  }

  return (
    <>
      <Helmet><title>{sup.name || 'Supplier Detail'} — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">{sup.name || 'Supplier Detail'}</h1>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary card */}
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Terms</p>
                    <p className="font-semibold">{sup.paymentTerms} Days</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Email</p>
                    <p className="font-semibold">{sup.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Phone</p>
                    <p className="font-semibold">{sup.phone || '—'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium">Balance Owed</p>
                  <p className="text-2xl font-bold text-red-600">{fmt(sup.balance)}</p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="purchases">
              <TabsList>
                <TabsTrigger value="purchases">Purchase Orders</TabsTrigger>
                <TabsTrigger value="statement">Account Statement</TabsTrigger>
              </TabsList>

              <TabsContent value="purchases">
                <Card>
                  <CardHeader><CardTitle className="text-base">Order History</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {historyLoading ? (
                      <div className="p-6"><Skeleton className="h-20 w-full" /></div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Order #</th>
                            <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Date</th>
                            <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Amount</th>
                            <th className="px-4 py-2 text-center font-semibold text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchases.map(p => (
                            <tr key={p.id} className="border-b">
                              <td className="px-4 py-3 font-semibold text-primary">{p.orderNumber}</td>
                              <td className="px-4 py-3">{format(new Date(p.createdAt), 'MMM dd, yyyy')}</td>
                              <td className="px-4 py-3 text-right">{fmt(p.total)}</td>
                              <td className="px-4 py-3 text-center capitalize">{p.status}</td>
                            </tr>
                          ))}
                          {purchases.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No purchase history</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statement">
                <Card>
                  <CardHeader><CardTitle className="text-base">Ledger Statement</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {statementLoading ? (
                      <div className="p-6"><Skeleton className="h-20 w-full" /></div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Date</th>
                            <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Reference</th>
                            <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Debit (Payments)</th>
                            <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Credit (Purchases)</th>
                            <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statement.map((item, i) => (
                            <tr key={i} className="border-b">
                              <td className="px-4 py-3">{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                              <td className="px-4 py-3 font-mono text-xs">{item.reference}</td>
                              <td className="px-4 py-3 text-right text-green-600">{item.debit > 0 ? fmt(item.debit) : '—'}</td>
                              <td className="px-4 py-3 text-right text-red-600">{item.credit > 0 ? fmt(item.credit) : '—'}</td>
                              <td className="px-4 py-3 text-right font-semibold">{fmt(item.runningBalance)}</td>
                            </tr>
                          ))}
                          {statement.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No statement history</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </>
  )
}
