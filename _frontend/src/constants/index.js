export const APP_NAME = 'MSME BMS'
export const APP_VERSION = '1.0.0'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.msmebms.com/v1'

export const AUTH_TOKEN_KEY = 'msme_auth_token'
export const REFRESH_TOKEN_KEY = 'msme_refresh_token'
export const USER_KEY = 'msme_user'
export const BUSINESS_KEY = 'msme_business'
export const THEME_KEY = 'msme_theme'
export const SIDEBAR_KEY = 'msme_sidebar'

export const PAGINATION_LIMITS = [10, 25, 50, 100]
export const DEFAULT_PAGE_LIMIT = 25

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit', label: 'Credit' }
]

export const SALE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'partial', label: 'Partial', color: 'warning' },
  { value: 'paid', label: 'Paid', color: 'success' },
  { value: 'voided', label: 'Voided', color: 'destructive' }
]

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'partial', label: 'Partial', color: 'warning' },
  { value: 'paid', label: 'Paid', color: 'success' },
  { value: 'overdue', label: 'Overdue', color: 'destructive' },
  { value: 'cancelled', label: 'Cancelled', color: 'secondary' }
]

export const PURCHASE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'partial', label: 'Partial', color: 'warning' },
  { value: 'received', label: 'Received', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'destructive' }
]

export const USER_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'employee', label: 'Employee' },
  { value: 'viewer', label: 'Viewer' }
]

export const PERMISSIONS = {
  // Dashboard
  'dashboard.view': 'View Dashboard',
  // Customers
  'customers.view': 'View Customers',
  'customers.create': 'Create Customers',
  'customers.edit': 'Edit Customers',
  'customers.delete': 'Delete Customers',
  // Products
  'products.view': 'View Products',
  'products.create': 'Create Products',
  'products.edit': 'Edit Products',
  'products.delete': 'Delete Products',
  // Sales
  'sales.view': 'View Sales',
  'sales.create': 'Create Sales',
  'sales.edit': 'Edit Sales',
  'sales.void': 'Void Sales',
  // Invoices
  'invoices.view': 'View Invoices',
  'invoices.create': 'Create Invoices',
  'invoices.send': 'Send Invoices',
  // Purchases
  'purchases.view': 'View Purchases',
  'purchases.create': 'Create Purchases',
  'purchases.edit': 'Edit Purchases',
  // Inventory
  'inventory.view': 'View Inventory',
  'inventory.adjust': 'Adjust Stock',
  'inventory.transfer': 'Transfer Stock',
  // Finance
  'finance.view': 'View Finance',
  'finance.create': 'Record Transactions',
  // Reports
  'reports.view': 'View Reports',
  'reports.export': 'Export Reports',
  // Settings
  'settings.view': 'View Settings',
  'settings.edit': 'Edit Settings',
  // Employees
  'employees.view': 'View Employees',
  'employees.create': 'Create Employees',
  'employees.edit': 'Edit Employees',
  'employees.payroll': 'Process Payroll',
  // Users
  'users.view': 'View Users',
  'users.create': 'Create Users',
  'users.edit': 'Edit Users',
  'users.delete': 'Delete Users'
}

export const ROLE_PERMISSIONS = {
  owner: Object.keys(PERMISSIONS),
  admin: Object.keys(PERMISSIONS),
  manager: [
    'dashboard.view', 'customers.view', 'customers.create', 'customers.edit',
    'products.view', 'products.create', 'products.edit',
    'sales.view', 'sales.create', 'sales.edit', 'sales.void',
    'invoices.view', 'invoices.create', 'invoices.send',
    'purchases.view', 'purchases.create', 'purchases.edit',
    'inventory.view', 'inventory.adjust',
    'finance.view', 'reports.view', 'reports.export',
    'employees.view'
  ],
  cashier: [
    'dashboard.view', 'customers.view', 'products.view',
    'sales.view', 'sales.create', 'invoices.view', 'invoices.create',
    'inventory.view'
  ],
  accountant: [
    'dashboard.view', 'customers.view', 'suppliers.view',
    'invoices.view', 'invoices.create', 'invoices.send',
    'purchases.view', 'finance.view', 'finance.create',
    'reports.view', 'reports.export'
  ],
  employee: ['dashboard.view', 'products.view', 'inventory.view'],
  viewer: ['dashboard.view', 'reports.view']
}

export const NAV_ITEMS = [
  {
    group: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' }
    ]
  },
  {
    group: 'Operations',
    items: [
      { label: 'Point of Sale', path: '/sales/pos', icon: 'ShoppingCart', permission: 'sales.create' },
      { label: 'Sales', path: '/sales', icon: 'TrendingUp', permission: 'sales.view' },
      { label: 'Purchases', path: '/purchases', icon: 'ShoppingBag', permission: 'purchases.view' },
      { label: 'Invoices', path: '/invoices', icon: 'FileText', permission: 'invoices.view' },
      { label: 'Payments', path: '/payments', icon: 'CreditCard', permission: 'finance.view' }
    ]
  },
  {
    group: 'Catalog',
    items: [
      { label: 'Products', path: '/products', icon: 'Package', permission: 'products.view' },
      { label: 'Inventory', path: '/inventory', icon: 'Warehouse', permission: 'inventory.view' },
      { label: 'Suppliers', path: '/suppliers', icon: 'Truck', permission: 'purchases.view' }
    ]
  },
  {
    group: 'People',
    items: [
      { label: 'Customers', path: '/customers', icon: 'Users', permission: 'customers.view' },
      { label: 'Employees', path: '/employees', icon: 'UserCheck', permission: 'employees.view' },
      { label: 'Payroll', path: '/payroll', icon: 'DollarSign', permission: 'employees.payroll' }
    ]
  },
  {
    group: 'Finance',
    items: [
      { label: 'Finance', path: '/finance', icon: 'PiggyBank', permission: 'finance.view' },
      { label: 'Accounting', path: '/accounting', icon: 'BookOpen', permission: 'finance.view' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2', permission: 'reports.view' }
    ]
  },
  {
    group: 'Business',
    items: [
      { label: 'Business', path: '/business', icon: 'Building2', permission: 'settings.view' },
      { label: 'Settings', path: '/settings', icon: 'Settings', permission: 'settings.view' },
      { label: 'Subscription', path: '/subscriptions', icon: 'Zap', permission: 'settings.edit' }
    ]
  }
]

export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    description: 'Perfect for small businesses just getting started',
    features: [
      '1 branch',
      '3 users',
      '1,000 products',
      'Basic reports',
      'Email support'
    ],
    limits: { branches: 1, users: 3, products: 1000 }
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    period: 'month',
    description: 'For growing businesses that need more power',
    features: [
      '5 branches',
      '15 users',
      '10,000 products',
      'Advanced reports',
      'Priority support',
      'API access'
    ],
    limits: { branches: 5, users: 15, products: 10000 },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'Unlimited power for established enterprises',
    features: [
      'Unlimited branches',
      'Unlimited users',
      'Unlimited products',
      'Custom reports',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ],
    limits: { branches: -1, users: -1, products: -1 }
  }
]
