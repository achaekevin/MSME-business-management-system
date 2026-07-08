import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, BookOpen, RefreshCw, Layers } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { accountingService } from '@/services'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'

const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(3, 'Code must be at least 3 digits'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  description: z.string().optional()
})

const columns = [
  { accessorKey: 'code', header: 'Account Code', cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span> },
  { accessorKey: 'name', header: 'Account Name', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => {
    const types = {
      asset: { label: 'Asset', color: 'success' },
      liability: { label: 'Liability', color: 'warning' },
      equity: { label: 'Equity', color: 'blue' },
      revenue: { label: 'Revenue', color: 'info' },
      expense: { label: 'Expense', color: 'destructive' }
    }
    const t = types[row.original.type] || { label: row.original.type, color: 'secondary' }
    return <Badge variant={t.color}>{t.label.toUpperCase()}</Badge>
  }},
  { accessorKey: 'balance', header: 'Current Balance', cell: ({ row }) => {
    const bal = row.original.balance || 0
    return <span className={bal < 0 ? 'text-red-600 font-medium' : 'font-medium'}>
      ${bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </span>
  }},
  { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description || '—' }
]

export default function AccountingPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => accountingService.getChartOfAccounts().then(r => r.data),
    staleTime: 60_000
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(accountSchema)
  })

  const createMutation = useMutation({
    mutationFn: (d) => accountingService.createAccount(d),
    onSuccess: () => {
      toast.success('Account created successfully')
      qc.invalidateQueries({ queryKey: ['chart-of-accounts'] })
      reset()
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create account')
  })

  const accounts = data?.data || []

  return (
    <>
      <Helmet><title>Chart of Accounts — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chart of Accounts</h1>
            <p className="text-muted-foreground text-sm mt-1">General ledger account organization</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Create Account
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(type => {
            const count = accounts.filter(a => a.type === type.toLowerCase()).length
            return (
              <Card key={type}>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{type} Accounts</p>
                  <p className="text-2xl font-bold mt-1">{isLoading ? '...' : count}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Accounts List</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={accounts}
              isLoading={isLoading}
              searchable
              searchPlaceholder="Search accounts..."
              emptyMessage="No accounts defined yet"
            />
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create New Account</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Account Code *</Label>
                <Input placeholder="e.g. 1010, 2020" {...register('code')} />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input placeholder="e.g. Petty Cash, Sales Revenue" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select onValueChange={v => setValue('type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Optional details..." {...register('description')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
