import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, RefreshCw, Trash2, Edit2, UserCheck, Briefcase } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge, Avatar
} from '@/components/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { employeeSchema } from '@/validations'
import { employeeService } from '@/services'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = (onDelete) => [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => (
    <div className="flex items-center gap-3">
      <Avatar name={row.original.name} size="sm" />
      <div>
        <Link to={`/employees/${row.original.id}`} className="font-semibold text-primary hover:underline">
          {row.original.name}
        </Link>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    </div>
  )},
  { accessorKey: 'department.name', header: 'Department', cell: ({ row }) => row.original.department?.name || '—' },
  { accessorKey: 'position.name', header: 'Position', cell: ({ row }) => row.original.position?.name || '—' },
  { accessorKey: 'salary', header: 'Salary', cell: ({ row }) => (
    <span>${row.original.salary.toLocaleString()} / {row.original.salaryType}</span>
  )},
  { accessorKey: 'joinDate', header: 'Joined', cell: ({ row }) => {
    try { return format(new Date(row.original.joinDate), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { id: 'actions', header: 'Actions', cell: ({ row }) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/employees/${row.original.id}`}>
          <Edit2 className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(row.original.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )}
]

export default function EmployeesList() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => employeeService.getDepartments().then(r => r.data) })
  const { data: positions } = useQuery({ queryKey: ['positions'], queryFn: () => employeeService.getPositions().then(r => r.data) })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employees', { page, search }],
    queryFn: () => employeeService.list({ page, limit: 25, search }).then(r => r.data),
    keepPreviousData: true
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: { salary: 0, salaryType: 'monthly', joinDate: format(new Date(), 'yyyy-MM-dd') }
  })

  const createMutation = useMutation({
    mutationFn: (d) => employeeService.create(d),
    onSuccess: () => {
      toast.success('Employee created successfully')
      qc.invalidateQueries({ queryKey: ['employees'] })
      reset()
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create employee')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => employeeService.delete(id),
    onSuccess: () => {
      toast.success('Employee deleted successfully')
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete employee')
  })

  const employees = data?.data || []
  const total = data?.total || 0

  const deptsList = depts?.data || []
  const positionsList = positions?.data || []

  return (
    <>
      <Helmet><title>Employees — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Employees</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage staff, departments, positions and details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Employee
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Headcount</p>
                <p className="text-2xl font-bold mt-0.5">{total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold mt-0.5">{deptsList.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Employees Directory</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(id => {
                if (confirm('Are you sure you want to delete this employee? This will purge payroll history.')) {
                  deleteMutation.mutate(id)
                }
              })}
              data={employees}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              searchable
              searchPlaceholder="Search employees..."
              onSearch={v => { setSearch(v); setPage(1) }}
              emptyMessage="No employees found"
            />
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Employee</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="e.g. Jane Doe" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="jane@company.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="+25470000000" {...register('phone')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select onValueChange={v => setValue('departmentId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      {deptsList.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Position *</Label>
                  <Select onValueChange={v => setValue('positionId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Position" /></SelectTrigger>
                    <SelectContent>
                      {positionsList.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.positionId && <p className="text-xs text-destructive">{errors.positionId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Salary *</Label>
                  <Input type="number" {...register('salary', { valueAsNumber: true })} />
                  {errors.salary && <p className="text-xs text-destructive">{errors.salary.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Pay Type *</Label>
                  <Select defaultValue="monthly" onValueChange={v => setValue('salaryType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Join Date *</Label>
                <Input type="date" {...register('joinDate')} />
                {errors.joinDate && <p className="text-xs text-destructive">{errors.joinDate.message}</p>}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Employee'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
