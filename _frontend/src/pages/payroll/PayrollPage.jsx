import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { PlusCircle, RefreshCw, FileText, ArrowRight, CheckCircle2, Wallet, Download } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { payrollService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DataTable } from '@/components/tables/DataTable'

const columns = (onView, onApprove, onDisburse) => [
  { accessorKey: 'period', header: 'Period', cell: ({ row }) => (
    <span className="font-semibold">{row.original.period}</span>
  )},
  { accessorKey: 'totalAmount', header: 'Total Amount', cell: ({ row }) => (
    <span>${Number(row.original.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
  )},
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const statuses = {
      draft: { label: 'Draft', color: 'secondary' },
      approved: { label: 'Approved', color: 'blue' },
      disbursed: { label: 'Disbursed', color: 'success' }
    }
    const s = statuses[row.original.status] || { label: row.original.status, color: 'secondary' }
    return <Badge variant={s.color}>{s.label.toUpperCase()}</Badge>
  }},
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { id: 'actions', header: 'Actions', cell: ({ row }) => {
    const run = row.original
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onView(run)}>
          <FileText className="h-4 w-4 mr-1" /> View Slips
        </Button>
        {run.status === 'draft' && (
          <Button variant="blue" size="sm" onClick={() => onApprove(run.id)}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
          </Button>
        )}
        {run.status === 'approved' && (
          <Button variant="success" size="sm" onClick={() => onDisburse(run.id)}>
            <Wallet className="h-4 w-4 mr-1" /> Disburse
          </Button>
        )}
      </div>
    )
  }}
]

export default function PayrollPage() {
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState(format(new Date(), 'yyyy-MM'))
  const [viewRun, setViewRun] = useState(null)
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payroll-runs', { page }],
    queryFn: () => payrollService.list({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const { data: runDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['payroll-run', viewRun?.id],
    queryFn: () => payrollService.get(viewRun.id).then(r => r.data),
    enabled: !!viewRun
  })

  const processMutation = useMutation({
    mutationFn: (period) => payrollService.process({ period }),
    onSuccess: () => {
      toast.success('Payroll processed successfully')
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to process payroll')
  })

  const approveMutation = useMutation({
    mutationFn: (id) => payrollService.approve(id),
    onSuccess: () => {
      toast.success('Payroll approved')
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to approve')
  })

  const disburseMutation = useMutation({
    mutationFn: (id) => payrollService.disburse(id),
    onSuccess: () => {
      toast.success('Payroll disbursements recorded as expenses')
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to disburse')
  })

  const handleDownloadSlip = async (runId, employeeId, name) => {
    try {
      const res = await payrollService.getSlip(runId, employeeId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Payslip_${name}_${viewRun.period}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      toast.error('Failed to download payslip')
    }
  }

  const runs = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Payroll — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payroll Runs</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage staff compensation runs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Run Payroll
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(
                run => setViewRun(run),
                id => { if (confirm('Approve this payroll run?')) approveMutation.mutate(id) },
                id => { if (confirm('Confirm disbursement of payroll? This will record cash book expenses.')) disburseMutation.mutate(id) }
              )}
              data={runs}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No payroll runs executed yet"
            />
          </CardContent>
        </Card>

        {/* View Slips Dialog */}
        <Dialog open={!!viewRun} onOpenChange={() => setViewRun(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payslips for {viewRun?.period}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 my-2">
              {detailLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Employee</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Gross</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Deductions</th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Net Pay</th>
                        <th className="px-4 py-2 text-center font-semibold text-muted-foreground">Payslip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(runDetail?.data?.payslips || []).map(slip => (
                        <tr key={slip.id} className="border-b">
                          <td className="px-4 py-2 font-medium">{slip.employee?.name}</td>
                          <td className="px-4 py-2 text-right">${Number(slip.grossSalary).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-red-600">${Number(slip.deductions).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-green-600 font-bold">${Number(slip.netSalary).toLocaleString()}</td>
                          <td className="px-4 py-2 text-center">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownloadSlip(viewRun.id, slip.employeeId, slip.employee?.name)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setViewRun(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Process/Run Payroll Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Run Payroll</DialogTitle></DialogHeader>
            <div className="space-y-4 my-2">
              <div className="space-y-2">
                <Label>Payroll Period *</Label>
                <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => processMutation.mutate(period)} disabled={processMutation.isPending}>
                {processMutation.isPending ? 'Processing...' : 'Run Payroll'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
