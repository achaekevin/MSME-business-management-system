import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, Mail, Smartphone, Moon, RotateCcw } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Card, CardHeader, CardTitle, CardContent, Button, Switch, Label, Input } from '@/components/ui'
import { axiosInstance } from '@/lib/axios'
import { toast } from 'sonner'

export default function NotificationPreferences() {
  const queryClient = useQueryClient()
  const [localPrefs, setLocalPrefs] = useState(null)

  // Get preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res = await axiosInstance.get('/notifications/preferences')
      const prefs = res.data.data
      setLocalPrefs(prefs)
      return prefs
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const res = await axiosInstance.put('/notifications/preferences', updates)
      return res.data.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences'], data)
      setLocalPrefs(data)
      toast.success('Preferences updated successfully')
    },
    onError: () => {
      toast.error('Failed to update preferences')
    }
  })

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post('/notifications/preferences/reset')
      return res.data.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences'], data)
      setLocalPrefs(data)
      toast.success('Preferences reset to defaults')
    }
  })

  const handleToggleChannel = (channel) => {
    const key = `${channel}Enabled`
    updateMutation.mutate({ [key]: !localPrefs[key] })
  }

  const handleToggleNotification = (channel, type) => {
    updateMutation.mutate({
      [channel]: {
        ...localPrefs[channel],
        [type]: !localPrefs[channel][type]
      }
    })
  }

  const handleQuietHoursChange = (field, value) => {
    updateMutation.mutate({ [field]: value })
  }

  if (isLoading || !localPrefs) {
    return <div className="p-6">Loading...</div>
  }

  const notificationTypes = [
    { key: 'newSale', label: 'New Sale', description: 'When a new sale is created' },
    { key: 'invoicePaid', label: 'Invoice Paid', description: 'When an invoice is marked as paid' },
    { key: 'lowStock', label: 'Low Stock Alert', description: 'When product stock is low' },
    { key: 'payrollProcessed', label: 'Payroll Processed', description: 'When payroll is completed' },
    { key: 'leaveRequest', label: 'Leave Request', description: 'When an employee requests leave' },
    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' }
  ]

  return (
    <>
      <Helmet><title>Notification Preferences — MSME BMS</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notification Preferences
            </h1>
            <p className="text-muted-foreground mt-1">
              Customize which notifications you receive and how.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        {/* Channel Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">Receive via email</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.emailEnabled}
                  onCheckedChange={() => handleToggleChannel('email')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">In-App</p>
                    <p className="text-sm text-muted-foreground">Notifications in app</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.inAppEnabled}
                  onCheckedChange={() => handleToggleChannel('inApp')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Push</p>
                    <p className="text-sm text-muted-foreground">Mobile push alerts</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.pushEnabled}
                  onCheckedChange={() => handleToggleChannel('push')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b font-medium text-sm">
                <div className="col-span-6">Notification</div>
                <div className="col-span-2 text-center">Email</div>
                <div className="col-span-2 text-center">In-App</div>
                <div className="col-span-2 text-center">Push</div>
              </div>

              {/* Rows */}
              {notificationTypes.map((notif) => (
                <div key={notif.key} className="grid grid-cols-12 gap-4 py-3 border-b last:border-0">
                  <div className="col-span-6">
                    <p className="font-medium">{notif.label}</p>
                    <p className="text-sm text-muted-foreground">{notif.description}</p>
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <Switch
                      checked={localPrefs.email[notif.key]}
                      onCheckedChange={() => handleToggleNotification('email', notif.key)}
                      disabled={!localPrefs.emailEnabled}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <Switch
                      checked={localPrefs.inApp[notif.key]}
                      onCheckedChange={() => handleToggleNotification('inApp', notif.key)}
                      disabled={!localPrefs.inAppEnabled}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <Switch
                      checked={localPrefs.push[notif.key]}
                      onCheckedChange={() => handleToggleNotification('push', notif.key)}
                      disabled={!localPrefs.pushEnabled}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set hours when you don't want to receive notifications
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={localPrefs.quietHoursStart || ''}
                  onChange={(e) => handleQuietHoursChange('quietHoursStart', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={localPrefs.quietHoursEnd || ''}
                  onChange={(e) => handleQuietHoursChange('quietHoursEnd', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
