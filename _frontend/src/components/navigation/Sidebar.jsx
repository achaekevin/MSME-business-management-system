import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Building2, LayoutDashboard, ShoppingCart, TrendingUp, ShoppingBag, FileText, CreditCard, Package, Warehouse, Truck, Users, UserCheck, DollarSign, PiggyBank, BookOpen, BarChart2, Building, Settings, Zap } from 'lucide-react'
import { cn } from '@/utils'
import { useUIStore, useBusinessStore } from '@/store'
import { usePermission } from '@/hooks'
import { Avatar } from '@/components/ui'

const iconMap = {
  LayoutDashboard, ShoppingCart, TrendingUp, ShoppingBag, FileText, CreditCard,
  Package, Warehouse, Truck, Users, UserCheck, DollarSign, PiggyBank, BookOpen,
  BarChart2, Building2, Settings, Zap
}

const navItems = [
  { group: 'Main', items: [{ label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' }] },
  {
    group: 'Operations', items: [
      { label: 'Point of Sale', path: '/sales/pos', icon: 'ShoppingCart', permission: 'sales.create' },
      { label: 'Sales', path: '/sales', icon: 'TrendingUp', permission: 'sales.view' },
      { label: 'Purchases', path: '/purchases', icon: 'ShoppingBag', permission: 'purchases.view' },
      { label: 'Invoices', path: '/invoices', icon: 'FileText', permission: 'invoices.view' },
      { label: 'Payments', path: '/payments', icon: 'CreditCard', permission: 'finance.view' }
    ]
  },
  {
    group: 'Catalog', items: [
      { label: 'Products', path: '/products', icon: 'Package', permission: 'products.view' },
      { label: 'Inventory', path: '/inventory', icon: 'Warehouse', permission: 'inventory.view' },
      { label: 'Suppliers', path: '/suppliers', icon: 'Truck', permission: 'purchases.view' }
    ]
  },
  {
    group: 'People', items: [
      { label: 'Customers', path: '/customers', icon: 'Users', permission: 'customers.view' },
      { label: 'Employees', path: '/employees', icon: 'UserCheck', permission: 'employees.view' },
      { label: 'Payroll', path: '/payroll', icon: 'DollarSign', permission: 'employees.payroll' }
    ]
  },
  {
    group: 'Finance', items: [
      { label: 'Finance', path: '/finance', icon: 'PiggyBank', permission: 'finance.view' },
      { label: 'Accounting', path: '/accounting', icon: 'BookOpen', permission: 'finance.view' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2', permission: 'reports.view' }
    ]
  },
  {
    group: 'Business', items: [
      { label: 'Business', path: '/business', icon: 'Building2', permission: 'settings.view' },
      { label: 'Settings', path: '/settings', icon: 'Settings', permission: 'settings.view' },
      { label: 'Subscription', path: '/subscriptions', icon: 'Zap', permission: 'settings.edit' }
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
      end={item.path === '/sales'}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70'
      )}
      title={collapsed ? item.label : undefined}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } = useUIStore()
  const { business } = useBusinessStore()

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full flex flex-col bg-sidebar border-r border-sidebar-border',
          'lg:relative lg:z-auto',
          !sidebarMobileOpen && 'hidden lg:flex'
        )}
        animate={{ width: sidebarCollapsed ? 60 : 240 }}
        transition={{ duration: 0.2 }}
      >
        {/* Logo area */}
        <div className={cn('flex h-16 items-center border-b border-sidebar-border px-3', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                {business?.name?.[0] || 'M'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{business?.name || 'My Business'}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">Business</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { toggleSidebar(); setSidebarMobileOpen(false) }}
            className="flex-shrink-0 rounded p-1 hover:bg-sidebar-accent text-sidebar-foreground/60"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
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
      </motion.aside>
    </>
  )
}
