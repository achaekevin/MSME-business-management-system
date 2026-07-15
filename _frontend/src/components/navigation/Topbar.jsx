import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, ChevronDown, LogOut, User, Settings, Building2 } from 'lucide-react'
import { cn } from '@/utils'
import { useUIStore, useBusinessStore, useNotificationStore } from '@/store'
import { useAuthStore } from '@/store/authStore'
import { Avatar, Badge } from '@/components/ui'
import { formatRelativeTime } from '@/utils'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import { RenderTracker } from '@/components/debug/RenderTracker'

export function Topbar() {
  const navigate = useNavigate()
  const theme = useUIStore(state => state.theme)
  const setTheme = useUIStore(state => state.setTheme)
  const setSidebarMobileOpen = useUIStore(state => state.setSidebarMobileOpen)
  const user = useAuthStore(state => state.user)
  const clearAuth = useAuthStore(state => state.clearAuth)
  const business = useBusinessStore(state => state.business)
  const notifications = useNotificationStore(state => state.notifications)
  const unreadCount = useNotificationStore(state => state.unreadCount)
  const markRead = useNotificationStore(state => state.markRead)
  const markAllRead = useNotificationStore(state => state.markAllRead)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    try {
      await authService.logout()
    } finally {
      clearAuth()
      window.location.href = '/auth/login'
      toast.success('Logged out')
    }
  }

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid hsl(var(--border))',
      backgroundColor: 'hsl(var(--background))',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0 1rem',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0
    }}>
      <RenderTracker name="Topbar" />
      {/* Mobile menu */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-accent"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        {showSearch ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { setShowSearch(false); setSearchQuery('') }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search customers, products, invoices..."
            />
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2 rounded-lg hover:bg-accent w-full sm:w-auto border border-dashed"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 ml-auto rounded border px-1.5 text-xs text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          className="p-2 rounded-md hover:bg-accent"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="relative p-2 rounded-md hover:bg-accent"
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn('px-4 py-3 cursor-pointer hover:bg-muted/50 border-b last:border-0', !n.isRead && 'bg-blue-50/50 dark:bg-blue-900/10')}
                      >
                        <div className="flex gap-2">
                          <div className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0', !n.isRead ? 'bg-blue-500' : 'bg-transparent')} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t">
                  <Link to="/app/notifications" className="text-xs text-primary hover:underline" onClick={() => setShowNotifications(false)}>
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
        </div>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-accent"
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
          >
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-popover border rounded-lg shadow-lg z-50 py-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                {[
                  { icon: User, label: 'Profile', path: '/app/profile' },
                  { icon: Building2, label: 'Business', path: '/app/business' },
                  { icon: Settings, label: 'Settings', path: '/app/settings' }
                ].map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                ))}
                <div className="border-t mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </header>
  )
}
