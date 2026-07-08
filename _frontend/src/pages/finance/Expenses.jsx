import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle, Trash2, Calendar, RefreshCw } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, StatusBadge
} from '@/components/ui'
import { financeService } from '@/services'
import { expenseSchema } from '@/validations'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DataTable } from '@/components/tables/DataTable'

const columns = (onDelete) => [
  { accessorKey: 'date', header: 'Date', cell: ({ row }) => {
    try { return format(new Date(row.original.date), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'paymentMethod', header: 'Payment Method', cell: ({ row }) => {
    const val = row.original.paymentMethod
    return val ? val.replace('_', ' ').toUpperCase() : '—'
  }},
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => {
    return <span className="font-semibold text-red-600">-${row.original.amount.toLocaleString()}</span>
  }},
  { id: 'actions', header: 'Actions', cell: ({ row }) => (
    <Button variant="ghost" size="sm" onClick={() => onDelete(row.original.id)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )}
]

const categories = [
  'Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Travel', 'Insurance', 'Taxes', 'Others'
]

export default function Expenses() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['expenses', { page }],
    queryFn: () => financeService.getExpenses({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd') }
  })

  const createMutation = useMutation({
    mutationFn: (d) => financeService.createExpense(d),
    onSuccess: () => {
      toast.success('Expense recorded successfully')
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      reset({ date: format(new Date(), 'yyyy-MM-dd') })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to record expense')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => financeService.deleteExpense(id),
    onSuccess: () => {
      toast.success('Expense deleted successfully')
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete expense')
  })

  const expenses = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Expenses — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-muted-foreground text-sm mt-1">Record and track business outlays</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Record Expense
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">All Expenses</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(id => {
                if (confirm('Are you sure you want to delete this expense?')) {
                  deleteMutation.mutate(id)
                }
              })}
              data={expenses}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No expenses recorded yet"
            />
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select onValueChange={v => setValue('category', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Input placeholder="e.g. Office rent for July" {...register('description')} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select onValueChange={v => setValue('paymentMethod', v)}>
                  <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="credit">Credit / Payable</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Additional expense notes..." {...register('notes')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Record'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
