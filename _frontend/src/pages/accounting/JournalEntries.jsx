import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle, RefreshCw, Trash2, AlertCircle } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Alert
} from '@/components/ui'
import { accountingService } from '@/services'
import { journalEntrySchema } from '@/validations'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DataTable } from '@/components/tables/DataTable'

const columns = [
  { accessorKey: 'date', header: 'Date', cell: ({ row }) => {
    try { return format(new Date(row.original.date), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { accessorKey: 'entryNumber', header: 'Entry #' },
  { accessorKey: 'reference', header: 'Reference', cell: ({ row }) => row.original.reference || '—' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'lines', header: 'Amount', cell: ({ row }) => {
    // Total Debits
    const lines = row.original.lines || []
    const totalDebits = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
    return <span className="font-semibold">${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
  }},
  { accessorKey: 'createdBy.name', header: 'Created By', cell: ({ row }) => row.original.createdBy?.name || '—' }
]

export default function JournalEntries() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: accountsData } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => accountingService.getChartOfAccounts().then(r => r.data)
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['journal-entries', { page }],
    queryFn: () => accountingService.getJournalEntries({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const accounts = accountsData?.data || []
  const entries = data?.data || []
  const total = data?.total || 0

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      reference: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, memo: '' },
        { accountId: '', debit: 0, credit: 0, memo: '' }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  })

  const formLines = watch('lines') || []
  const totalDebits = formLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0)
  const totalCredits = formLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0)
  const difference = Math.abs(totalDebits - totalCredits)
  const isBalanced = difference < 0.01

  const createMutation = useMutation({
    mutationFn: (d) => accountingService.createJournalEntry(d),
    onSuccess: () => {
      toast.success('Journal Entry created successfully')
      qc.invalidateQueries({ queryKey: ['journal-entries'] })
      qc.invalidateQueries({ queryKey: ['chart-of-accounts'] })
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        reference: '',
        lines: [
          { accountId: '', debit: 0, credit: 0, memo: '' },
          { accountId: '', debit: 0, credit: 0, memo: '' }
        ]
      })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create journal entry')
  })

  return (
    <>
      <Helmet><title>Journal Entries — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Journal Entries</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and record manual double-entry journals</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> New Entry
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">All Transactions</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={entries}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No journal entries recorded yet"
            />
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Description *</Label>
                  <Input placeholder="General narrative description..." {...register('description')} />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reference</Label>
                <Input placeholder="Reference details, invoice numbers..." {...register('reference')} />
              </div>

              {/* Lines section */}
              <div className="space-y-2 border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold">Accounting Lines</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ accountId: '', debit: 0, credit: 0, memo: '' })}>
                    Add Line
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <div className="flex-1 min-w-[200px]">
                        <Select onValueChange={v => setValue(`lines.${idx}.accountId`, v)}>
                          <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                          <SelectContent>
                            {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Input type="number" step="0.01" placeholder="Debit" {...register(`lines.${idx}.debit`, { valueAsNumber: true })} />
                      </div>
                      <div className="w-24">
                        <Input type="number" step="0.01" placeholder="Credit" {...register(`lines.${idx}.credit`, { valueAsNumber: true })} />
                      </div>
                      <div className="flex-1">
                        <Input placeholder="Memo" {...register(`lines.${idx}.memo`)} />
                      </div>
                      {fields.length > 2 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.lines?.root && (
                  <p className="text-xs text-destructive mt-1">{errors.lines.root.message}</p>
                )}

                {/* Balances summary */}
                <div className="flex justify-between items-center border-t pt-3 mt-3 text-sm font-semibold">
                  <div>Difference: <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>${difference.toFixed(2)}</span></div>
                  <div className="flex gap-4">
                    <div>Total Debits: ${totalDebits.toFixed(2)}</div>
                    <div>Total Credits: ${totalCredits.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {!isBalanced && (
                <Alert variant="destructive" className="py-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Journal Entry is unbalanced. Debits and Credits must match.</span>
                  </div>
                </Alert>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || !isBalanced}>
                  {createMutation.isPending ? 'Saving...' : 'Post Entry'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
