import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Eye, Package } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { productService } from '@/services'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/button'
import { Badge, EmptyState } from '@/components/ui'
import { useSearch, usePagination } from '@/hooks'
import { formatCurrency } from '@/utils'

export default function ProductsList() {
  const queryClient = useQueryClient()
  const { search, setSearch, debouncedSearch } = useSearch()
  const [categoryFilter, setCategoryFilter] = useState('')
  const { page, limit, setPage, setLimit } = usePagination(0)

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, limit, search: debouncedSearch, category: categoryFilter }],
    queryFn: () => productService.list({ page, limit, search: debouncedSearch, categoryId: categoryFilter }),
    placeholderData: prev => prev
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => productService.getCategories()
  })

  const deleteMutation = useMutation({
    mutationFn: productService.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted') },
    onError: (err) => toast.error(err.message)
  })

  const products = data?.data?.data || []
  const total = data?.data?.total || 0
  const categories = categoriesData?.data || []

  const columns = [
    {
      header: 'Product',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.images?.[0] ? (
            <img src={row.original.images[0]} alt={row.original.name} className="h-8 w-8 rounded object-cover" />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <Link to={`/products/${row.original.id}`} className="font-medium hover:text-primary">{row.original.name}</Link>
            <p className="text-xs text-muted-foreground">SKU: {row.original.sku}</p>
          </div>
        </div>
      )
    },
    { header: 'Category', accessorKey: 'categoryId', cell: ({ getValue }) => getValue() || '—' },
    { header: 'Cost price', accessorKey: 'costPrice', cell: ({ getValue }) => formatCurrency(getValue()) },
    { header: 'Selling price', accessorKey: 'sellingPrice', cell: ({ getValue }) => formatCurrency(getValue()) },
    {
      header: 'Stock',
      accessorKey: 'currentStock',
      cell: ({ row }) => {
        const stock = row.original.currentStock
        const reorder = row.original.reorderPoint
        return (
          <span className={stock <= reorder ? 'text-red-600 font-medium' : ''}>
            {stock.toLocaleString()} {stock <= reorder && '⚠️'}
          </span>
        )
      }
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ getValue }) => <Badge variant={getValue() ? 'success' : 'secondary'}>{getValue() ? 'Active' : 'Inactive'}</Badge>
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link to={`/products/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link to={`/products/${row.original.id}/edit`}><Edit className="h-3.5 w-3.5" /></Link></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(row.original.id) }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <>
      <Helmet><title>Products — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{total.toLocaleString()} total products</p>
          </div>
          <Button asChild><Link to="/products/new"><Plus className="h-4 w-4 mr-1" />Add product</Link></Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter('')} className={`px-3 py-1 rounded-full text-sm ${!categoryFilter ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setCategoryFilter(cat.id)} className={`px-3 py-1 rounded-full text-sm ${categoryFilter === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
              {cat.name}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          searchPlaceholder="Search products by name or SKU..."
          onSearch={setSearch}
          emptyMessage="No products yet. Add your first product to get started."
        />
      </div>
    </>
  )
}
