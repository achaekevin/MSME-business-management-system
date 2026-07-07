import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { SIDEBAR_KEY, THEME_KEY } from '@/constants'

// Business Store
export const useBusinessStore = create(
  devtools(
    persist(
      (set) => ({
        business: null,
        currentBranch: null,
        branches: [],

        setBusiness: (business) => set({ business }),
        setCurrentBranch: (branch) => set({ currentBranch: branch }),
        setBranches: (branches) => set({ branches }),
        updateBusiness: (updates) => set((state) => ({ business: { ...state.business, ...updates } }))
      }),
      { name: 'business-store' }
    )
  )
)

// UI Store
export const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        sidebarCollapsed: false,
        sidebarMobileOpen: false,
        theme: 'light',
        primaryColor: '#3b82f6',

        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
        setTheme: (theme) => {
          const root = document.documentElement
          if (theme === 'dark') root.classList.add('dark')
          else root.classList.remove('dark')
          set({ theme })
        },
        initTheme: () => {
          const { theme } = get()
          if (theme === 'dark') document.documentElement.classList.add('dark')
        }
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, theme: state.theme })
      }
    )
  )
)

// Notification Store
export const useNotificationStore = create(
  devtools((set, get) => ({
    notifications: [],
    unreadCount: 0,

    setNotifications: (notifications) => {
      const unread = notifications.filter(n => !n.isRead).length
      set({ notifications, unreadCount: unread })
    },

    addNotification: (notification) => set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1)
    })),

    markRead: (id) => set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1)
    })),

    markAllRead: () => set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    }))
  }))
)

// Cart Store (POS)
export const useCartStore = create(
  devtools((set, get) => ({
    items: [],
    customer: null,
    discount: 0,
    discountType: 'amount', // 'amount' | 'percent'
    notes: '',

    addItem: (product, qty = 1) => {
      const { items } = get()
      const existing = items.find(i => i.productId === product.id)
      if (existing) {
        set({ items: items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i) })
      } else {
        set({ items: [...items, { productId: product.id, name: product.name, unitPrice: product.sellingPrice, quantity: qty, discount: 0, tax: 0 }] })
      }
    },

    removeItem: (productId) => set((state) => ({ items: state.items.filter(i => i.productId !== productId) })),

    updateItem: (productId, updates) => set((state) => ({
      items: state.items.map(i => i.productId === productId ? { ...i, ...updates } : i)
    })),

    setCustomer: (customer) => set({ customer }),
    setDiscount: (discount, type) => set({ discount, discountType: type }),
    setNotes: (notes) => set({ notes }),

    clearCart: () => set({ items: [], customer: null, discount: 0, notes: '' }),

    getSubtotal: () => {
      const { items } = get()
      return items.reduce((sum, i) => sum + (i.unitPrice * i.quantity - i.discount), 0)
    },

    getTotal: () => {
      const { items, discount, discountType } = get()
      const sub = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity - i.discount), 0)
      const disc = discountType === 'percent' ? sub * (discount / 100) : discount
      const tax = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity * (i.tax / 100)), 0)
      return Math.max(0, sub - disc + tax)
    }
  }))
)
