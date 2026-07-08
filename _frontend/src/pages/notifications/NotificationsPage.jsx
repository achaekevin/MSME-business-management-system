import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Bell, RefreshCw, Eye, Trash2, CheckSquare } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { notificationService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', { page }],
    queryFn: () => notificationService.list({ page, limit: 50 }).then(r => r.data),
    keepPreviousData: true
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      toast.success('Marked as read')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.delete(id),
    onSuccess: () => {
      toast.success('Notification deleted')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const list = data?.data || []

  return (
    <>
      <Helmet><title>Notifications — MSME BMS</title></Helmet>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time alerts and business updates</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            {list.some(n => !n.isRead) && (
              <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()}>
                <CheckSquare className="h-4 w-4 mr-2" /> Mark All Read
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="divide-y p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              list.map(n => (
                <div key={n.id} className={`p-4 flex items-start gap-4 hover:bg-muted/10 transition-colors ${!n.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'text-muted-foreground'}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(n.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div className="flex gap-1">
                    {!n.isRead && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => markReadMutation.mutate(n.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteMutation.mutate(n.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
