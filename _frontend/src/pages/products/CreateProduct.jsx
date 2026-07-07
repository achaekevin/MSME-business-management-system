import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { productService } from '@/services'
import { productSchema } from '@/validations'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea, Card, CardHeader, CardTitle, CardContent, Spinner } from '@/components/ui'

export default function CreateProduct() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const queryClient = useQueryClient()

  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.get(id),
    enabled: isEdit
  })

  const { data: categoriesData } = useQuery({ queryKey: ['product-categories'], queryFn: () => productService.getCategories() })
  const { data: unitsData } = useQuery({ queryKey: ['product-units'], queryFn: () => productService.getUnits() })

  const categories = categoriesData?.data || []
  const units = unitsData?.data || []

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { trackInventory: true, costPrice: 0, sellingPrice: 0, reorderPoint: 5 }
  })

  useEffect(() => {
    if (productData?.data) reset(productData.data)
  }, [productData, reset])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? productService.update(id, data) : productService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(isEdit ? 'Product updated' : 'Product created')
      navigate(`/products/${isEdit ? id : res.data.id}`)
    },
    onError: (err) => toast.error(err.message)
  })

  if (isEdit && loadingProduct) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit Product' : 'New Product'} — MSME BMS</title></Helmet>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/products"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit product' : 'Add product'}</h1>
        </div>

        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Product details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Product name *</Label>
                <Input placeholder="e.g. Laptop Pro 15-inch" className="mt-1" {...register('name')} />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU *</Label>
                  <Input placeholder="e.g. LPT-001" className="mt-1" {...register('sku')} />
                  {errors.sku && <p className="text-destructive text-xs mt-1">{errors.sku.message}</p>}
                </div>
                <div>
                  <Label>Barcode</Label>
                  <Input placeholder="e.g. 1234567890123" className="mt-1" {...register('barcode')} />
                </div>
                <div>
                  <Label>Category *</Label>
                  <select className="mt-1 w-full border rounded-md h-10 px-3 text-sm bg-background" {...register('categoryId')}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.categoryId && <p className="text-destructive text-xs mt-1">{errors.categoryId.message}</p>}
                </div>
                <div>
                  <Label>Unit *</Label>
                  <select className="mt-1 w-full border rounded-md h-10 px-3 text-sm bg-background" {...register('unitId')}>
                    <option value="">Select unit</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                  </select>
                  {errors.unitId && <p className="text-destructive text-xs mt-1">{errors.unitId.message}</p>}
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Product description..." rows={3} className="mt-1" {...register('description')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cost price *</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" className="mt-1" {...register('costPrice', { valueAsNumber: true })} />
                  {errors.costPrice && <p className="text-destructive text-xs mt-1">{errors.costPrice.message}</p>}
                </div>
                <div>
                  <Label>Selling price *</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" className="mt-1" {...register('sellingPrice', { valueAsNumber: true })} />
                  {errors.sellingPrice && <p className="text-destructive text-xs mt-1">{errors.sellingPrice.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="trackInventory" className="rounded" {...register('trackInventory')} />
                <Label htmlFor="trackInventory" className="font-normal cursor-pointer">Track inventory for this product</Label>
              </div>
              <div>
                <Label>Reorder point</Label>
                <Input type="number" min="0" placeholder="5" className="mt-1 max-w-[200px]" {...register('reorderPoint', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground mt-1">Alert when stock falls below this level</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" asChild><Link to="/products">Cancel</Link></Button>
            <Button type="submit" isLoading={isSubmitting} leftIcon={!isSubmitting && <Save className="h-4 w-4" />}>
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
