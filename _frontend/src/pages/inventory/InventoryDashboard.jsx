import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, TrendingDown, Warehouse, ArrowRight, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton } from '@/components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { inventoryService } from '@/services'
import toast from 'react-hot-toast'

function StatCard({ label, value, icon: Icon, color, isLoading }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InventoryDashboard() {
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['inventory-dashboard'],
    queryFn: () => inventoryService.getDashboard().then(r => r.data),
    staleTime: 60_000
  })

  const { data: lowStock, isLoading: lowLoading } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: () => inventoryService.getLowStock({ limit: 10 }).then(r => r.data),
    staleTime: 60_000
  })

  const stats = dashboard?.stats || {}
  const movements = dashboard?.recentMovements || []

  return (
    <>
      <Helmet><title>Inventory Dashboard — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor stock levels and movements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button size="sm" asChild>
              <Link to="/inventory/adjust">Adjust Stock</Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total SKUs" value={stats.totalSkus ?? '—'} icon={Package} color="bg-blue-500" isLoading={isLoading} />
          <StatCard label="Low Stock Alerts" value={stats.lowStockCount ?? '—'} icon={AlertTriangle} color="bg-amber-500" isLoading={isLoading} />
          <StatCard label="Out of Stock" value={stats.outOfStockCount ?? '—'} icon={TrendingDown} color="bg-red-500" isLoading={isLoading} />
          <StatCard label="Warehouses" value={stats.warehouseCount ?? '—'} icon={Warehouse} color="bg-green-500" isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Movement Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Stock Movements (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : movements.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={movements} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="in" name="Stock In" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="out" name="Stock Out" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No movement data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'View Stock Levels', to: '/inventory/stock', icon: Package },
                { label: 'Adjust Stock', to: '/inventory/adjust', icon: RefreshCw },
                { label: 'Transfer Stock', to: '/inventory/transfer', icon: ArrowRight },
                { label: 'Manage Warehouses', to: '/inventory/warehouses', icon: Warehouse },
              ].map(({ label, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/inventory/stock?filter=low">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !lowStock?.data?.length ? (
              <p className="text-center text-muted-foreground text-sm py-8">🎉 No low stock alerts!</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Reorder At</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.data.map(item => (
                      <tr key={item.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.product?.sku}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{item.product?.reorderPoint}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={item.quantity === 0 ? 'destructive' : 'warning'}>
                            {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
