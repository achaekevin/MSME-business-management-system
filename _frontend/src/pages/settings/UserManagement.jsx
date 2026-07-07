import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Shield, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { settingsService } from '@/services'
import { userInviteSchema } from '@/validations'
import { USER_ROLES } from '@/constants'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/button'
import { Input, Label, Badge, Avatar, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useModal } from '@/hooks'
import { formatDate } from '@/utils'

function InviteModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(userInviteSchema) })

  const mutation = useMutation({
    mutationFn: settingsService.inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] })
      toast.success('Invitation sent')
      reset()
      onClose()
    },
    onError: (err) => toast.error(err.message)
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Invite team member</h2>
        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input className="mt-1" {...register('name')} />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Email address</Label>
            <Input type="email" className="mt-1" {...register('email')} />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Role</Label>
            <select className="mt-1 w-full border rounded-md h-10 px-3 text-sm bg-background" {...register('role')}>
              <option value="">Select role</option>
              {USER_ROLES.filter(r => r.value !== 'owner').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {errors.role && <p className="text-destructive text-xs mt-1">{errors.role.message}</p>}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Send invite</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const queryClient = useQueryClient()
  const modal = useModal()

  const { data, isLoading } = useQuery({ queryKey: ['settings-users'], queryFn: () => settingsService.getUsers() })
  const users = data?.data?.data || []

  const removeMutation = useMutation({
    mutationFn: settingsService.removeUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings-users'] }); toast.success('User removed') }
  })

  const columns = [
    { header: 'User', accessorKey: 'name', cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.name} size="sm" />
        <div><p className="font-medium text-sm">{row.original.name}</p><p className="text-xs text-muted-foreground">{row.original.email}</p></div>
      </div>
    )},
    { header: 'Role', accessorKey: 'role', cell: ({ getValue }) => <Badge variant="blue" className="capitalize">{getValue()}</Badge> },
    { header: 'Branch', accessorKey: 'branchName', cell: ({ getValue }) => getValue() || 'All branches' },
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => <Badge variant={getValue() === 'active' ? 'success' : 'warning'}>{getValue() || 'pending'}</Badge> },
    { header: 'Joined', accessorKey: 'createdAt', cell: ({ getValue }) => formatDate(getValue()) },
    { id: 'actions', header: '', cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('Remove this user?')) removeMutation.mutate(row.original.id) }}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    )}
  ]

  return (
    <>
      <Helmet><title>User Management — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team members</h1>
            <p className="text-muted-foreground text-sm">{users.length} users with access to your business</p>
          </div>
          <Button onClick={() => modal.open()}><Plus className="h-4 w-4 mr-1" />Invite user</Button>
        </div>
        <DataTable columns={columns} data={users} isLoading={isLoading} searchable={false} />
      </div>
      <InviteModal isOpen={modal.isOpen} onClose={modal.close} />
    </>
  )
}
