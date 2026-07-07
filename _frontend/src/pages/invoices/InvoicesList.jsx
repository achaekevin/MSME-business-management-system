import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Eye, Download } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { invoiceService } from '@/services'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui'
import { useSearch, usePagination } from '@/hooks'
import { formatCurrency, formatDate } from '@/utils'
import { INVOICE_STATUSES } from '@/constants'

export default function InvoicesList() {
  const [statusFilter, setStatusFilter] = useState('')
  const { search, setSearch } = useSearch()
  const { page, limit, setPage, setLimit } = usePagination(0)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { page, limit, search, status: statusFilter }],
    queryFn: () => invoiceService.list({ page, limit, search, status: statusFilter }),
    placeholderData: prev => prev
  })

  const invoices = data?.data?.data || []
  const total = data?.data?.total || 0

  const columns = [
    { header: 'Invoice #', accessorKey: 'invoiceNumber', cell: ({ row, getValue }) => <Link to={`/invoices/${row.original.id}`} className="font-medium text-primary hover:underline">{getValue()}</Link> },
    { header: 'Customer', accessorKey: 'customer', cell: ({ row }) => row.original.customer?.name || '—' },
    { header: 'Total', accessorKey: 'total', cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue())}</span> },
    { header: 'Paid', accessorKey: 'amountPaid', cell: ({ getValue }) => formatCurrency(getValue()) },
    { header: 'Balance', accessorKey: 'balance', cell: ({ getValue }) => getValue() > 0 ? <span className="text-red-600 font-medium">{formatCurrency(getValue())}</span> : '—' },
    { header: 'Due date', accessorKey: 'dueDate', cell: ({ row, getValue }) => { const overdue = row.original.status !== 'paid' && new Date(getValue()) < new Date(); return <span className={overdue ? 'text-red-600 font-medium' : ''}>{formatDate(getValue())}</span> } },
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => { const s = INVOICE_STATUSES.find(x => x.value === getValue()); return <Badge variant={s?.color}>{s?.label || getValue()}</Badge> } },
    { header: 'Created', accessorKey: 'createdAt', cell: ({ getValue }) => formatDate(getValue()) },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex gap-1 justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link to={`/invoices/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => invoiceService.getPdf(row.original.id)}><Download className="h-3.5 w-3.5" /></Button>
      </div>
    )}
  ]

  return (
    <>
      <Helmet><title>Invoices — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground text-sm">{total.toLocaleString()} total invoices</p>
          </div>
          <Button asChild><Link to="/invoices/new"><Plus className="h-4 w-4 mr-1" />New invoice</Link></Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ value: '', label: 'All' }, ...INVOICE_STATUSES].map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`px-3 py-1 rounded-full text-sm ${statusFilter === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>{s.label}</button>
          ))}
        </div>
        <DataTable columns={columns} data={invoices} isLoading={isLoading} total={total} page={page} limit={limit} onPageChange={setPage} onLimitChange={setLimit} onSearch={setSearch} searchPlaceholder="Search invoices..." />
      </div>
    </>
  )
}
