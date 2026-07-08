import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle, RefreshCw, UserCheck, Clock } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { employeeService } from '@/services'
import { attendanceSchema } from '@/validations'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DataTable } from '@/components/tables/DataTable'

const columns = [
  { accessorKey: 'date', header: 'Date', cell: ({ row }) => {
    try { return format(new Date(row.original.date), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { accessorKey: 'employee.name', header: 'Employee', cell: ({ row }) => row.original.employee?.name || '—' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const statuses = {
      present: { label: 'Present', color: 'success' },
      absent: { label: 'Absent', color: 'destructive' },
      late: { label: 'Late', color: 'warning' },
      half_day: { label: 'Half Day', color: 'info' }
    }
    const s = statuses[row.original.status] || { label: row.original.status, color: 'secondary' }
    return <Badge variant={s.color}>{s.label}</Badge>
  }},
  { accessorKey: 'checkIn', header: 'Clock In', cell: ({ row }) => {
    try { return row.original.checkIn ? format(new Date(row.original.checkIn), 'HH:mm') : '—' } catch { return '—' }
  }},
  { accessorKey: 'checkOut', header: 'Clock Out', cell: ({ row }) => {
    try { return row.original.checkOut ? format(new Date(row.original.checkOut), 'HH:mm') : '—' } catch { return '—' }
  }},
  { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => row.original.notes || '—' }
]

export default function Attendance() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const qc = useQueryClient()

  const { data: emps } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeeService.list({ limit: 500 }).then(r => r.data) })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attendance', { date }],
    queryFn: () => employeeService.getAttendance({ date }).then(r => r.data),
    staleTime: 30_000
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd'), status: 'present' }
  })

  const recordMutation = useMutation({
    mutationFn: (d) => employeeService.recordAttendance(d),
    onSuccess: () => {
      toast.success('Attendance recorded successfully')
      qc.invalidateQueries({ queryKey: ['attendance'] })
      reset({ date: format(new Date(), 'yyyy-MM-dd'), status: 'present' })
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to record attendance')
  })

  const employeesList = emps?.data || []
  const attendanceLogs = data?.data || []

  return (
    <>
      <Helmet><title>Attendance — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Attendance</h1>
            <p className="text-muted-foreground text-sm mt-1">Clock in/out employees and check logs</p>
          </div>
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40 h-9" />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Log Attendance
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Logs for {date}</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={attendanceLogs}
              isLoading={isLoading}
              searchable={false}
              emptyMessage="No attendance logs found for this date"
            />
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Employee Attendance</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => recordMutation.mutate(d))} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select defaultValue="present" onValueChange={v => setValue('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Clock In Time</Label>
                  <Input type="time" {...register('checkIn')} />
                </div>
                <div className="space-y-2">
                  <Label>Clock Out Time</Label>
                  <Input type="time" {...register('checkOut')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Reasons, explanations..." {...register('notes')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={recordMutation.isPending}>
                  {recordMutation.isPending ? 'Saving...' : 'Record'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
