import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Users, Shield, Bell, Palette, Lock, Key, FileText, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { useUIStore } from '@/store'
import { cn } from '@/utils'

const settingsSections = [
  { icon: Users, title: 'User management', desc: 'Manage team members and their access', path: '/settings/users' },
  { icon: Shield, title: 'Roles & permissions', desc: 'Define what each role can access', path: '/settings/roles' },
  { icon: Bell, title: 'Notifications', desc: 'Configure email and push notification preferences', path: '/settings/notifications' },
  { icon: Palette, title: 'Appearance', desc: 'Customize theme and branding', path: '/settings/appearance' },
  { icon: Lock, title: 'Security', desc: 'Password policies and session management', path: '/settings/security' },
  { icon: Key, title: 'API keys', desc: 'Manage API access for integrations', path: '/settings/api-keys' },
  { icon: FileText, title: 'Audit logs', desc: 'View a history of account activity', path: '/settings/audit-logs' }
]

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore()

  return (
    <>
      <Helmet><title>Settings — MSME BMS</title></Helmet>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card>
          <CardContent className="p-0 divide-y">
            {settingsSections.map(section => (
              <Link key={section.path} to={section.path} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                  <section.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Theme</p>
              <p className="text-xs text-muted-foreground">Choose light or dark appearance</p>
            </div>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {['light', 'dark'].map(t => (
                <button key={t} onClick={() => setTheme(t)} className={cn('px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors', theme === t ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
                  {t}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
