import { NavLink, useLocation } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, Building2, LayoutDashboard, ShoppingCart, TrendingUp, ShoppingBag, FileText, CreditCard, Package, Warehouse, Truck, Users, UserCheck, DollarSign, PiggyBank, BookOpen, BarChart2, Building, Settings, Zap, Download } from 'lucide-react'
import { cn } from '@/utils'
import { useUIStore, useBusinessStore } from '@/store'
import { usePermission } from '@/hooks'
import { Avatar } from '@/components/ui'
import { memo } from 'react'

const iconMap = {
  LayoutDashboard, ShoppingCart, TrendingUp, ShoppingBag, FileText, CreditCard,
  Package, Warehouse, Truck, Users, UserCheck, DollarSign, PiggyBank, BookOpen,
  BarChart2, Building2, Settings, Zap, Download
}

const navItems = [
  { group: 'Main', items: [{ label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' }] },
  {
    group: 'Operations', items: [
      { label: 'Point of Sale', path: '/app/sales/pos', icon: 'ShoppingCart', permission: 'sales.create' },
      { label: 'Sales', path: '/app/sales', icon: 'TrendingUp', permission: 'sales.view' },
      { label: 'Purchases', path: '/app/purchases', icon: 'ShoppingBag', permission: 'purchases.view' },
      { label: 'Invoices', path: '/app/invoices', icon: 'FileText', permission: 'invoices.view' },
      { label: 'Payments', path: '/app/payments', icon: 'CreditCard', permission: 'finance.view' }
    ]
  },
  {
    group: 'Catalog', items: [
      { label: 'Products', path: '/app/products', icon: 'Package', permission: 'products.view' },
      { label: 'Inventory', path: '/app/inventory', icon: 'Warehouse', permission: 'inventory.view' },
      { label: 'Suppliers', path: '/app/suppliers', icon: 'Truck', permission: 'purchases.view' }
    ]
  },
  {
    group: 'People', items: [
      { label: 'Customers', path: '/app/customers', icon: 'Users', permission: 'customers.view' },
      { label: 'Employees', path: '/app/employees', icon: 'UserCheck', permission: 'employees.view' },
      { label: 'Payroll', path: '/app/payroll', icon: 'DollarSign', permission: 'employees.payroll' }
    ]
  },
  {
    group: 'Finance', items: [
      { label: 'Finance', path: '/app/finance', icon: 'PiggyBank', permission: 'finance.view' },
      { label: 'Accounting', path: '/app/accounting', icon: 'BookOpen', permission: 'finance.view' },
      { label: 'Analytics', path: '/app/analytics', icon: 'TrendingUp', permission: 'reports.view' },
      { label: 'Reports', path: '/app/reports', icon: 'BarChart2', permission: 'reports.view' },
      { label: 'Data Export', path: '/app/export', icon: 'Download', permission: 'reports.view' }
    ]
  },
  {
    group: 'Business', items: [
      { label: 'Business', path: '/app/business', icon: 'Building2', permission: 'settings.view' },
      { label: 'Settings', path: '/app/settings', icon: 'Settings', permission: 'settings.view' },
      { label: 'Subscription', path: '/app/subscriptions', icon: 'Zap', permission: 'settings.edit' }
    ]
  }
]

function NavItem({ item, collapsed }) {
  const { can } = usePermission()
  if (item.permission && !can(item.permission)) return null
  const Icon = iconMap[item.icon]

  return (
    <NavLink
      to={item.path}
      end={item.path === '/app/sales'}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70'
      )}
      title={collapsed ? item.label : undefined}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      {!collapsed && (
        <span className="overflow-hidden whitespace-nowrap">
          {item.label}
        </span>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed)
  const sidebarMobileOpen = useUIStore(state => state.sidebarMobileOpen)
  const toggleSidebar = useUIStore(state => state.toggleSidebar)
  const setSidebarMobileOpen = useUIStore(state => state.setSidebarMobileOpen)
  const business = useBusinessStore(state => state.business)
  
  // Fixed width - no dynamic changes
  const width = '240px'

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: width,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'hsl(var(--sidebar))',
          borderRight: '1px solid hsl(var(--sidebar-border))'
        }}
      >
        {/* Logo area */}
        <div style={{
          display: 'flex',
          height: '64px',
          alignItems: 'center',
          borderBottom: '1px solid hsl(var(--sidebar-border))',
          padding: '0 0.75rem',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <div style={{
              display: 'flex',
              height: '32px',
              width: '32px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.5rem',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {business?.name?.[0] || 'M'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {business?.name || 'My Business'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--sidebar-foreground) / 0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Business
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((group) => (
            <div key={group.group} className="mb-2">
              {!sidebarCollapsed && (
                <p className="px-3 py-1 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                  {group.group}
                </p>
              )}
              {group.items.map(item => (
                <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* Mobile close */}
        <button
          className="absolute top-3 right-3 lg:hidden rounded p-1 hover:bg-sidebar-accent"
          onClick={() => setSidebarMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </aside>
    </>
  )
}
