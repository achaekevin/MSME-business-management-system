import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Warehouse, 
  ArrowRight, 
  RefreshCw, 
  ArrowUpRight, 
  CheckCircle2, 
  Plus
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton, Spinner } from '@/components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { inventoryService, productService } from '@/services'
import { formatCurrency } from '@/utils'

export default function InventoryDashboard() {
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['inventory-dashboard'],
    queryFn: () => inventoryService.getDashboard().then(r => r.data?.data || r.data || {}).catch(() => ({})),
    staleTime: 30_000
  })

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products-list-inventory'],
    queryFn: () => productService.list({ limit: 10 }).then(r => r.data?.data || r.data || []).catch(() => []),
    staleTime: 30_000
  })

  const { data: lowStockData } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: () => inventoryService.getLowStock({ limit: 5 }).then(r => r.data?.data || r.data || []).catch(() => []),
    staleTime: 30_000
  })

  const stats = dashboard?.stats || {}
  const movements = dashboard?.recentMovements || []
  const items = Array.isArray(productsData) ? productsData : (productsData?.items || [])
  const lowStockList = Array.isArray(lowStockData) ? lowStockData : (lowStockData?.items || [])

  // Calculate live total stock valuation
  const totalValuation = items.reduce((acc, p) => acc + (Number(p.costPrice || p.sellingPrice || 0) * Number(p.currentStock || 0)), 0)

  return (
    <>
      <Helmet><title>Inventory Dashboard — MSME BMS</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <Warehouse className="w-3.5 h-3.5" />
              <span>Main Inventory & Warehouse · Real-time Tracking</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Warehouse & Inventory Ledger</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Live stock catalog, on-hand quantities, and stock alerts.</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button onClick={() => refetch()} variant="outline" className="border-border text-foreground hover:bg-muted text-xs h-9 px-3 rounded-xl">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 rounded-xl shadow-md">
              <Link to="/app/products/new">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Products</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-2 tracking-tight">
              {stats.totalSkus ?? items.length} SKUs
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mt-2">
              <span>Active in Database</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Stock Valuation</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Warehouse className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-2 tracking-tight">
              {formatCurrency(totalValuation)}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-2">
              On-hand Valuation
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Warehouses</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-2 tracking-tight">
              {stats.warehouseCount ?? 1} Locations
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-2">
              Storage Branches
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Low Stock Alerts</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 tracking-tight">
              {stats.lowStockCount ?? lowStockList.length} Items
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-2">
              Requires Reordering
            </div>
          </div>
        </div>

        {/* Chart & Reorder Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stock Movement Trends */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Stock Movement Trends</h3>
                <p className="text-xs text-muted-foreground">Live inbound vs outbound stock movements</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-primary font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Inbound
                </span>
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Outbound
                </span>
              </div>
            </div>

            {movements.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={movements} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="in" name="Stock In" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="out" name="Stock Out" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-xs">
                <Package className="w-8 h-8 mb-2 opacity-30" />
                <p>No recent stock movement records.</p>
                <p className="mt-0.5">Movements will display automatically as purchases and sales occur.</p>
              </div>
            )}
          </div>

          {/* Reorder Alerts */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Reorder Alerts</span>
                </h3>
                <span className="text-[11px] text-muted-foreground font-mono">Live Alerts</span>
              </div>

              {lowStockList.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-60" />
                  <p>All stock levels are optimal.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockList.slice(0, 3).map((prod) => (
                    <div key={prod.id || prod.sku} className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">{prod.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">Stock: {prod.currentStock} / Min: {prod.reorderPoint || 10}</div>
                      </div>
                      <Button asChild size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg">
                        <Link to={`/app/purchases?reorder=${prod.id}`}>Reorder</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <Link to="/app/purchases" className="text-xs text-primary hover:underline font-medium flex items-center justify-between">
                <span>Create Purchase Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Real-Time Inventory Stock Levels Table */}
        <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Inventory Stock Levels</h3>
              <p className="text-xs text-muted-foreground">Live quantities and product inventory in database</p>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/app/products" className="text-xs text-primary hover:underline font-medium">
                View Full Catalog →
              </Link>
            </div>
          </div>

          {isProductsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No products found in inventory.</p>
              <Link to="/app/products/new" className="mt-2 inline-block text-primary font-semibold hover:underline">
                + Add New Product
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product Name</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">SKU</th>
                    <th className="py-3 px-4 font-semibold">Stock Level</th>
                    <th className="py-3 px-4 font-semibold">Unit Price</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {items.slice(0, 8).map((prod) => {
                    const stock = prod.currentStock ?? 0
                    const isLow = stock <= (prod.reorderPoint ?? 10)
                    return (
                      <tr key={prod.id || prod.sku} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{prod.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{prod.category?.name || prod.category || 'General'}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{prod.sku}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-primary'}`} 
                                style={{ width: `${Math.min(100, (stock / 40) * 100)}%` }} 
                              />
                            </div>
                            <span className="font-mono text-xs text-foreground font-semibold">{stock} pcs</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          {formatCurrency(prod.sellingPrice)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isLow ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
