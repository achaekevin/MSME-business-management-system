import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sun, Moon, ChevronDown, LogOut, User, Settings, Building2 } from 'lucide-react'
import { useUIStore } from '@/store'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'

export function Topbar() {
  const navigate = useNavigate()
  const theme = useUIStore(state => state.theme)
  const setTheme = useUIStore(state => state.setTheme)
  const user = useAuthStore(state => state.user)
  const clearAuth = useAuthStore(state => state.clearAuth)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

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
      justifyContent: 'space-between',
      padding: '0 1rem',
      gap: '1rem'
    }}>
      <div></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Theme toggle */}
        <button
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer'
          }}
          className="hover:bg-accent"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* User menu */}
        <div ref={menuRef} style={{ position: 'relative', marginLeft: '0.25rem' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.25rem 0.25rem 0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
            className="hover:bg-accent"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hidden sm:block">
              {user?.name}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '0.25rem',
              width: '13rem',
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              zIndex: 9999,
              padding: '0.25rem 0'
            }}>
              <div style={{
                padding: '0.5rem 0.75rem',
                borderBottom: '1px solid hsl(var(--border))'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{user?.email}</p>
              </div>
              {[
                { icon: User, label: 'Profile', path: '/app/profile' },
                { icon: Building2, label: 'Business', path: '/app/business' },
                { icon: Settings, label: 'Settings', path: '/app/settings' }
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                  className="hover:bg-accent"
                  onClick={() => setShowUserMenu(false)}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid hsl(var(--border))', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    color: 'hsl(var(--destructive))',
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  className="hover:bg-destructive/10"
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
