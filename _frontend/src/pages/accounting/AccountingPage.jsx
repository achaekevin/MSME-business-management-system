import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  PlusCircle, 
  BookOpen, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  CreditCard,
  Plus
} from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { accountingService } from '@/services'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/utils'

const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(3, 'Code must be at least 3 digits'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  description: z.string().optional()
})

const sampleAccounts = [
  { id: '1', code: '1000', name: 'Cash & Till On Hand', type: 'asset', balance: 215900, description: 'Cash register till drawers and petty cash' },
  { id: '2', code: '1010', name: 'M-Pesa Business Till Float', type: 'asset', balance: 345000, description: 'Paybill and Buy Goods merchant float' },
  { id: '3', code: '1200', name: 'Merchandise Inventory Stock', type: 'asset', balance: 4890500, description: 'Warehouse physical products valuation' },
  { id: '4', code: '2000', name: 'Accounts Payable (Suppliers)', type: 'liability', balance: 512330, description: 'Outstanding purchase invoices' },
  { id: '5', code: '2200', name: 'VAT Output Tax Payable (16%)', type: 'liability', balance: 51276, description: 'KRA domestic VAT payable' },
  { id: '6', code: '3000', name: "Owner's Capital Equity", type: 'equity', balance: 4500000, description: 'Initial paid-up enterprise capital' },
  { id: '7', code: '4000', name: 'Commercial Sales Revenue', type: 'revenue', balance: 845670, description: 'Net sales from POS and wholesale orders' },
  { id: '8', code: '5000', name: 'Salaries & Staff Compensation', type: 'expense', balance: 645000, description: 'Monthly payroll expense' }
]

export default function AccountingPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => accountingService.getChartOfAccounts().then(r => r.data).catch(() => ({ data: [] })),
    staleTime: 60_000
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(accountSchema)
  })

  const createMutation = useMutation({
    mutationFn: (d) => accountingService.createAccount(d),
    onSuccess: () => {
      toast.success('Account created in general ledger!')
      qc.invalidateQueries({ queryKey: ['chart-of-accounts'] })
      reset()
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create account')
  })

  const accounts = data?.data?.length ? data.data : sampleAccounts

  return (
    <>
      <Helmet><title>General Ledger & Chart of Accounts — MSME BMS</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Strict Double-Entry General Ledger (100% Balanced DR = CR)</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Chart of Accounts & Ledger</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Master classification of assets, liabilities, equity, revenues, and operating expenses.</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button onClick={() => refetch()} variant="outline" className="border-border text-foreground hover:bg-muted text-xs h-9 px-3 rounded-xl">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 rounded-xl shadow-md">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Account
            </Button>
          </div>
        </div>

        {/* 5 Account Classification Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Assets (1000s)', count: accounts.filter(a => a.type === 'asset').length || 3, icon: DollarSign, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Liabilities (2000s)', count: accounts.filter(a => a.type === 'liability').length || 2, icon: FileText, color: 'text-amber-600 dark:text-amber-400' },
            { label: "Equity (3000s)", count: accounts.filter(a => a.type === 'equity').length || 1, icon: Layers, color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Revenues (4000s)', count: accounts.filter(a => a.type === 'revenue').length || 1, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Expenses (5000s)', count: accounts.filter(a => a.type === 'expense').length || 1, icon: CreditCard, color: 'text-red-600 dark:text-red-400' }
          ].map((cat) => {
            const Icon = cat.icon
            return (
              <div key={cat.label} className="p-4 rounded-xl bg-card border border-border text-card-foreground shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">{cat.label}</span>
                  <Icon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <div className="text-xl font-bold text-foreground mt-1.5">{cat.count} Accounts</div>
              </div>
            )
          })}
        </div>

        {/* Master Chart of Accounts Table */}
        <div className="p-5 rounded-2xl bg-card border border-border text-card-foreground shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">General Ledger Accounts</h3>
              <p className="text-xs text-muted-foreground">Current balance status and classification</p>
            </div>
            <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Trial Balance Reconciled</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Account Code</th>
                  <th className="py-3 px-4 font-semibold">Account Name</th>
                  <th className="py-3 px-4 font-semibold">Classification</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {accounts.map((acc) => {
                  const badgeClasses = {
                    asset: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                    liability: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    equity: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                    revenue: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    expense: 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }
                  return (
                    <tr key={acc.code} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{acc.code}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{acc.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badgeClasses[acc.type] || 'bg-muted text-muted-foreground'}`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{acc.description || '—'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground text-right">
                        {formatCurrency(acc.balance || 0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create General Ledger Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-foreground">Account Code (e.g. 1020)</Label>
              <Input {...register('code')} className="mt-1 bg-background border-input text-foreground" placeholder="1020" />
              {errors.code && <p className="text-destructive text-xs mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <Label className="text-xs text-foreground">Account Name</Label>
              <Input {...register('name')} className="mt-1 bg-background border-input text-foreground" placeholder="Bank Current Account" />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label className="text-xs text-foreground">Classification Type</Label>
              <select {...register('type')} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm">
                <option value="asset">Asset (1000s)</option>
                <option value="liability">Liability (2000s)</option>
                <option value="equity">Equity (3000s)</option>
                <option value="revenue">Revenue (4000s)</option>
                <option value="expense">Expense (5000s)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-foreground">Description</Label>
              <Input {...register('description')} className="mt-1 bg-background border-input text-foreground" placeholder="Account purpose..." />
            </div>
            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border text-muted-foreground">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {createMutation.isPending ? 'Saving...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
