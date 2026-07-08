import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { PlusCircle, Building2, MapPin, RefreshCw, Trash2, Edit2 } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { businessService } from '@/services'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/tables/DataTable'

const branchSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
})

const columns = (onEdit, onDelete) => [
  { accessorKey: 'name', header: 'Branch Name', cell: ({ row }) => (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
        <Building2 className="h-4 w-4 text-indigo-600" />
      </div>
      <div>
        <div className="font-semibold">{row.original.name}</div>
        <div className="text-xs text-muted-foreground">Code: {row.original.code}</div>
      </div>
    </div>
  )},
  { accessorKey: 'location', header: 'Location', cell: ({ row }) => (
    <div className="flex items-center gap-1 text-muted-foreground">
      <MapPin className="h-3.5 w-3.5" />
      <span>{row.original.location}</span>
    </div>
  )},
  { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => (
    <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
      {row.original.isActive ? 'Active' : 'Inactive'}
    </Badge>
  )},
  { id: 'actions', header: 'Actions', cell: ({ row }) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(row.original.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )}
]

export default function BranchManagement() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['branches'],
    queryFn: () => businessService.getBranches().then(r => r.data),
    staleTime: 60_000
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(branchSchema)
  })

  const createMutation = useMutation({
    mutationFn: (d) => businessService.createBranch(d),
    onSuccess: () => {
      toast.success('Branch created successfully')
      qc.invalidateQueries({ queryKey: ['branches'] })
      reset()
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create branch')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => businessService.updateBranch(id, body),
    onSuccess: () => {
      toast.success('Branch updated successfully')
      qc.invalidateQueries({ queryKey: ['branches'] })
      setEditing(null)
      reset()
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update branch')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => businessService.deleteBranch(id),
    onSuccess: () => {
      toast.success('Branch deleted successfully')
      qc.invalidateQueries({ queryKey: ['branches'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete branch')
  })

  const handleOpen = (branch = null) => {
    setEditing(branch)
    reset(branch ? { name: branch.name, code: branch.code, location: branch.location } : {})
    setOpen(true)
  }

  const branches = data?.data || []

  return (
    <>
      <Helmet><title>Branches — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Branch Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Configure and manage multiple physical branch locations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => handleOpen()}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Branch
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Branches List</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(
                b => handleOpen(b),
                id => { if (confirm('Are you sure you want to delete this branch?')) deleteMutation.mutate(id) }
              )}
              data={branches}
              isLoading={isLoading}
              searchable={false}
              emptyMessage="No branches configured yet"
            />
          </CardContent>
        </Card>

        {/* Dialog Form */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(d => editing ? updateMutation.mutate({ id: editing.id, body: d }) : createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Branch Name *</Label>
                <Input placeholder="e.g. Westlands Branch" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Branch Code *</Label>
                  <Input placeholder="e.g. WLD-01" {...register('code')} />
                  {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Location / Address *</Label>
                  <Input placeholder="e.g. Woodvale Grove" {...register('location')} />
                  {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
