import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Upload, Eye, Edit, Trash2, Phone, Mail } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { customerService } from '@/services'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/button'
import { Badge, Avatar, EmptyState } from '@/components/ui'
import { useSearch, usePagination } from '@/hooks'
import { formatCurrency, formatDate } from '@/utils'

export default function CustomersList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { search, setSearch, debouncedSearch } = useSearch()
  const [typeFilter, setTypeFilter] = useState('')
  const { page, limit, setPage, setLimit } = usePagination(0)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, limit, search: debouncedSearch, type: typeFilter }],
    queryFn: () => customerService.list({ page, limit, search: debouncedSearch, type: typeFilter }),
    placeholderData: prev => prev
  })

  const deleteMutation = useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted')
    },
    onError: (err) => toast.error(err.message)
  })

  const customers = data?.data?.data || []
  const total = data?.data?.total || 0

  const columns = [
    {
      header: 'Customer',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.name} size="sm" />
          <div>
            <Link to={`/customers/${row.original.id}`} className="font-medium hover:text-primary">
              {row.original.name}
            </Link>
            <p className="text-xs text-muted-foreground">{row.original.email || '—'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: ({ getValue }) => getValue() || '—'
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'business' ? 'blue' : 'secondary'}>
          {getValue()}
        </Badge>
      )
    },
    {
      header: 'Balance',
      accessorKey: 'balance',
      cell: ({ getValue }) => (
        <span className={getValue() > 0 ? 'text-red-600 font-medium' : getValue() < 0 ? 'text-green-600 font-medium' : ''}>
          {formatCurrency(Math.abs(getValue()))}
          {getValue() > 0 ? ' owed' : getValue() < 0 ? ' credit' : ''}
        </span>
      )
    },
    {
      header: 'Total purchases',
      accessorKey: 'totalPurchases',
      cell: ({ getValue }) => formatCurrency(getValue())
    },
    {
      header: 'Since',
      accessorKey: 'createdAt',
      cell: ({ getValue }) => formatDate(getValue())
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ getValue }) => <Badge variant={getValue() ? 'success' : 'secondary'}>{getValue() ? 'Active' : 'Inactive'}</Badge>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to={`/customers/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to={`/customers/${row.original.id}/edit`}><Edit className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button
            variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm('Delete this customer?')) deleteMutation.mutate(row.original.id)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <>
      <Helmet><title>Customers — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{total.toLocaleString()} total customers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => customerService.exportExcel().then(r => { const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = 'customers.xlsx'; a.click() })}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button asChild>
              <Link to="/customers/new"><Plus className="h-4 w-4 mr-1" /> Add customer</Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['', 'individual', 'business'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
            >
              {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={customers}
          isLoading={isLoading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          searchPlaceholder="Search customers..."
          onSearch={setSearch}
          emptyMessage="No customers yet. Add your first customer to get started."
        />
      </div>
    </>
  )
}
