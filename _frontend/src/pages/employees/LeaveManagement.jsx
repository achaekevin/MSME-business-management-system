import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { employeeService } from '@/services'
import { leaveSchema } from '@/validations'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DataTable } from '@/components/tables/DataTable'

const columns = (onApprove, onReject) => [
  { accessorKey: 'employee.name', header: 'Employee', cell: ({ row }) => row.original.employee?.name || '—' },
  { accessorKey: 'type', header: 'Leave Type', cell: ({ row }) => {
    return <span className="capitalize">{row.original.type}</span>
  }},
  { accessorKey: 'startDate', header: 'Start Date', cell: ({ row }) => {
    try { return format(new Date(row.original.startDate), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { accessorKey: 'endDate', header: 'End Date', cell: ({ row }) => {
    try { return format(new Date(row.original.endDate), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const statuses = {
      pending: { label: 'Pending', color: 'warning' },
      approved: { label: 'Approved', color: 'success' },
      rejected: { label: 'Rejected', color: 'destructive' }
    }
    const s = statuses[row.original.status] || { label: row.original.status, color: 'secondary' }
    return <Badge variant={s.color}>{s.label}</Badge>
  }},
  { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => row.original.reason || '—' },
  { id: 'actions', header: 'Actions', cell: ({ row }) => {
    if (row.original.status !== 'pending') return '—'
    return (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onApprove(row.original.id)}>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onReject(row.original.id)}>
          <XCircle className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    )
  }}
]

export default function LeaveManagement() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: emps } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeeService.list({ limit: 500 }).then(r => r.data) })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leaves', { page }],
    queryFn: () => employeeService.getLeaves({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(leaveSchema),
    defaultValues: { type: 'annual', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') }
  })

  const applyMutation = useMutation({
    mutationFn: (d) => employeeService.applyLeave(d),
    onSuccess: () => {
      toast.success('Leave applied successfully')
      qc.invalidateQueries({ queryKey: ['leaves'] })
      reset({ type: 'annual', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to apply leave')
  })

  const approveMutation = useMutation({
    mutationFn: (id) => employeeService.approveLeave(id),
    onSuccess: () => {
      toast.success('Leave approved')
      qc.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to approve')
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => employeeService.rejectLeave(id, reason),
    onSuccess: () => {
      toast.success('Leave rejected')
      qc.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to reject')
  })

  const employeesList = emps?.data || []
  const leaves = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Leave Management — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leave Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Review, apply, and approve/reject leave requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Apply Leave
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Leave Requests</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(
                id => {
                  if (confirm('Approve this leave request?')) approveMutation.mutate(id)
                },
                id => {
                  const reason = prompt('Enter rejection reason:')
                  if (reason !== null) rejectMutation.mutate({ id, reason })
                }
              )}
              data={leaves}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No leave requests submitted yet"
            />
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => applyMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select onValueChange={v => setValue('employeeId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>
                    {employeesList.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Leave Type *</Label>
                <Select defaultValue="annual" onValueChange={v => setValue('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                    <SelectItem value="paternity">Paternity Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" {...register('startDate')} />
                  {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" {...register('endDate')} />
                  {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason / Details</Label>
                <Input placeholder="Details for this request..." {...register('reason')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? 'Submitting...' : 'Apply'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
