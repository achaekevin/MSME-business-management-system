import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, RefreshCw, Package, Tag, Layers, DollarSign, Settings } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton, Badge } from '@/components/ui'
import { productService } from '@/services'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.get(id).then(r => r.data),
    staleTime: 60_000
  })

  const prod = data?.data || {}

  const fmt = (n) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  }

  return (
    <>
      <Helmet><title>{prod.name || 'Product Details'} — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">Catalog Details</h1>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{prod.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">SKU: {prod.sku}</p>
                  </div>
                </div>
                <Badge variant={prod.trackInventory ? 'success' : 'secondary'}>
                  {prod.trackInventory ? 'Inventory Tracked' : 'Service Item'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-muted-foreground text-xs mb-1">Description</h4>
                  <p className="text-muted-foreground">{prod.description || 'No catalog description provided.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h4 className="font-semibold text-muted-foreground text-xs mb-0.5">Category</h4>
                    <p className="font-semibold flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {prod.category?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground text-xs mb-0.5">Unit of Measurement</h4>
                    <p className="font-semibold flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {prod.unit?.name || 'Units'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">Pricing & Margins</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Cost Price</span>
                  <span className="font-medium">{fmt(prod.costPrice)}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Selling Price</span>
                  <span className="font-medium text-green-600">{fmt(prod.sellingPrice)}</span>
                </div>
                {prod.sellingPrice > 0 && (
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Margin</span>
                    <span className="font-semibold text-indigo-600">
                      {(((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {prod.trackInventory && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reorder Point Alert</span>
                      <span className="font-semibold text-amber-600">{prod.reorderPoint || 0} Units</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
