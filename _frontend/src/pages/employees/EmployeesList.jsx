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
import { formatCurrency } from '@/utils'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'
import { format } from 'date-fns'

const columns = (onDelete) => [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <Avatar name={row.original.name} size="sm" />
      <div>
        <Link to={`/app/employees/${row.original.id}`} className="font-semibold text-primary hover:underline">
          {row.original.name}
        </Link>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    </div>
  )},
  { accessorKey: 'department.name', header: 'Department', cell: ({ row }) => row.original.department?.name || '—' },
  { accessorKey: 'position.title', header: 'Position', cell: ({ row }) => row.original.position?.title || row.original.position?.name || '—' },
  { accessorKey: 'salary', header: 'Salary', cell: ({ row }) => (
    <span>{formatCurrency(row.original.salary)} / {row.original.salaryType}</span>
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
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const qc = useQueryClient()

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => employeeService.getDepartments()
  })

  const { data: positionsData } = useQuery({
    queryKey: ['positions', selectedDeptId],
    queryFn: () => employeeService.getPositions(selectedDeptId || undefined)
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employees', { page, search }],
    queryFn: () => employeeService.list({ page, limit: 25, search }),
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
      qc.invalidateQueries({ queryKey: ['employees-all'] })
      qc.invalidateQueries({ queryKey: ['employees-report'] })
      reset()
      setSelectedDeptId('')
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create employee')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => employeeService.delete(id),
    onSuccess: () => {
      toast.success('Employee deleted successfully')
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employees-all'] })
      qc.invalidateQueries({ queryKey: ['employees-report'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete employee')
  })

  const extractList = (res) => {
    if (!res) return []
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.data?.data)) return res.data.data
    if (Array.isArray(res?.items)) return res.items
    if (Array.isArray(res?.data?.items)) return res.data.items
    return []
  }

  const extractTotal = (res, fallbackLen = 0) => {
    if (!res) return fallbackLen
    if (typeof res.total === 'number') return res.total
    if (typeof res.data?.total === 'number') return res.data.total
    return fallbackLen
  }

  const employees = extractList(data)
  const total = extractTotal(data, employees.length)
  const deptsList = extractList(deptsData)
  const positionsList = extractList(positionsData)

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
              columns={columns(id => deleteMutation.mutate(id))}
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
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register('departmentId', {
                      onChange: (e) => {
                        setSelectedDeptId(e.target.value)
                        setValue('positionId', '')
                      }
                    })}
                  >
                    <option value="">Select Department</option>
                    {deptsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Position *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register('positionId')}
                  >
                    <option value="">Select Position</option>
                    {positionsList.map(p => (
                      <option key={p.id} value={p.id}>{p.title || p.name}</option>
                    ))}
                  </select>
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
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register('salaryType')}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                  </select>
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
