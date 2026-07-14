import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Helmet } from 'react-helmet-async'
import { Camera, Save, Smartphone, Monitor, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input, Label, Card, CardHeader, CardTitle, CardContent, Avatar, Badge, Separator } from '@/components/ui'
import { formatRelativeTime } from '@/utils'

const mockSessions = [
  { id: 1, device: 'Chrome on Windows', icon: Monitor, location: 'Nairobi, Kenya', lastActive: new Date(), current: true },
  { id: 2, device: 'Safari on iPhone', icon: Smartphone, location: 'Nairobi, Kenya', lastActive: new Date(Date.now() - 86400000), current: false }
]

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { name: user?.name, email: user?.email } })
  const [activeTab, setActiveTab] = useState('general')

  const onSubmit = async (data) => {
    setUser({ ...user, ...data })
    toast.success('Profile updated')
  }

  return (
    <>
      <Helmet><title>Profile — MSME BMS</title></Helmet>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">My profile</h1>

        <div className="flex gap-1 border-b">
          {['general', 'security', 'sessions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar name={user?.name} src={user?.avatar} size="xl" />
                  <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="blue" className="mt-1 capitalize">{user?.role?.name || user?.role || 'User'}</Badge>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full name</Label>
                    <Input className="mt-1" {...register('name')} />
                  </div>
                  <div>
                    <Label>Email address</Label>
                    <Input type="email" className="mt-1" {...register('email')} />
                  </div>
                </div>
                <Button type="submit" isLoading={isSubmitting} leftIcon={!isSubmitting && <Save className="h-4 w-4" />}>Save changes</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card>
            <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Current password</Label><Input type="password" className="mt-1" /></div>
              <div><Label>New password</Label><Input type="password" className="mt-1" /></div>
              <div><Label>Confirm new password</Label><Input type="password" className="mt-1" /></div>
              <Button>Update password</Button>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" size="sm">{user?.twoFactorEnabled ? 'Disable' : 'Enable'}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'sessions' && (
          <Card>
            <CardHeader><CardTitle>Active sessions</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {mockSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <s.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">{s.device} {s.current && <Badge variant="success" className="text-[10px]">This device</Badge>}</p>
                      <p className="text-xs text-muted-foreground">{s.location} · Active {formatRelativeTime(s.lastActive)}</p>
                    </div>
                  </div>
                  {!s.current && <Button variant="ghost" size="sm" className="text-destructive"><LogOut className="h-3.5 w-3.5 mr-1" />Revoke</Button>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
