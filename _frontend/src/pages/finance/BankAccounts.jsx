import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle, Landmark, CreditCard, RefreshCw } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton
} from '@/components/ui'
import { financeService } from '@/services'
import { bankAccountSchema } from '@/validations'
import toast from 'react-hot-toast'
import { CURRENCIES } from '@/constants'

export default function BankAccounts() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => financeService.getBankAccounts().then(r => r.data),
    staleTime: 60_000
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { balance: 0, currency: 'USD' }
  })

  const createMutation = useMutation({
    mutationFn: (d) => financeService.createBankAccount(d),
    onSuccess: () => {
      toast.success('Bank account added successfully')
      qc.invalidateQueries({ queryKey: ['bank-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      reset({ balance: 0, currency: 'USD' })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add bank account')
  })

  const accounts = data?.data || []

  const fmt = (n, cur = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n || 0)
  }

  return (
    <>
      <Helmet><title>Bank Accounts — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bank Accounts</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage cash and bank treasury assets</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Bank Account
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Bank Accounts</h3>
              <p className="text-muted-foreground text-sm mb-4">Add your business bank account or cash drawers to track balances</p>
              <Button onClick={() => setOpen(true)}>Add Bank Account</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <Card key={acc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{acc.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{acc.bankName}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">A/C: {acc.accountNumber}</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {fmt(acc.balance, acc.currency)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input placeholder="e.g. Operating Checking" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Input placeholder="e.g. Equity Bank, Cash Box" {...register('bankName')} />
                {errors.bankName && <p className="text-xs text-destructive">{errors.bankName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Account Number *</Label>
                <Input placeholder="e.g. 1234567890" {...register('accountNumber')} />
                {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Opening Balance</Label>
                  <Input type="number" step="0.01" {...register('balance', { valueAsNumber: true })} />
                  {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Currency *</Label>
                  <Select defaultValue="USD" onValueChange={v => setValue('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
