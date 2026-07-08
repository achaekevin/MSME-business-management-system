import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, Warehouse, MapPin, Edit2, Trash2, Package } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Textarea, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton
} from '@/components/ui'
import { inventoryService } from '@/services'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  location: z.string().optional(),
  description: z.string().optional()
})

export default function Warehouses() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryService.getWarehouses().then(r => r.data),
    staleTime: 60_000
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: (d) => inventoryService.createWarehouse(d),
    onSuccess: () => {
      toast.success('Warehouse created')
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      reset(); setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create warehouse')
  })

  const warehouses = data?.data || []

  const handleOpen = (w = null) => {
    setEditing(w)
    reset(w ? { name: w.name, location: w.location || '', description: w.description || '' } : {})
    setOpen(true)
  }

  return (
    <>
      <Helmet><title>Warehouses — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Warehouses</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage storage locations for your inventory</p>
          </div>
          <Button onClick={() => handleOpen()}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Warehouse
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : warehouses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Warehouses</h3>
              <p className="text-muted-foreground text-sm mb-4">Add your first warehouse to start managing inventory locations</p>
              <Button onClick={() => handleOpen()}>Add Warehouse</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(w => (
              <Card key={w.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Warehouse className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{w.name}</CardTitle>
                        {w.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" /> {w.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={w.isActive ? 'success' : 'secondary'}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {w.description && <p className="text-xs text-muted-foreground mb-3">{w.description}</p>}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      <span>{w._count?.stock ?? 0} SKUs</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpen(w)}>
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Warehouse' : 'New Warehouse'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Warehouse Name *</Label>
                <Input placeholder="e.g. Main Warehouse" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g. Nairobi, Kenya" {...register('location')} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Optional description..." {...register('description')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Warehouse'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
