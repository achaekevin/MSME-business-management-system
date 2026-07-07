// Core entity types

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  businessId: string
  branchId?: string
  permissions: string[]
  twoFactorEnabled: boolean
  lastLogin?: string
  createdAt: string
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'cashier' | 'accountant' | 'employee' | 'viewer'

export interface Business {
  id: string
  name: string
  type: string
  logo?: string
  email: string
  phone: string
  address: Address
  taxNumber?: string
  registrationNumber?: string
  currency: string
  timezone: string
  fiscalYearStart: string
  createdAt: string
  subscription: Subscription
}

export interface Branch {
  id: string
  businessId: string
  name: string
  code: string
  phone?: string
  address: Address
  isHeadquarters: boolean
  isActive: boolean
  manager?: string
}

export interface Address {
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface Customer {
  id: string
  businessId: string
  name: string
  email?: string
  phone?: string
  address?: Address
  type: 'individual' | 'business'
  groupId?: string
  creditLimit?: number
  balance: number
  totalPurchases: number
  loyaltyPoints: number
  isActive: boolean
  notes?: string
  createdAt: string
}

export interface Supplier {
  id: string
  businessId: string
  name: string
  email?: string
  phone?: string
  address?: Address
  taxNumber?: string
  paymentTerms: number
  balance: number
  totalPurchases: number
  isActive: boolean
  createdAt: string
}

export interface Product {
  id: string
  businessId: string
  sku: string
  name: string
  description?: string
  categoryId: string
  unitId: string
  costPrice: number
  sellingPrice: number
  images: string[]
  barcode?: string
  qrCode?: string
  trackInventory: boolean
  currentStock: number
  reorderPoint: number
  variants?: ProductVariant[]
  isActive: boolean
  createdAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  attributes: Record<string, string>
  stock: number
}

export interface Category {
  id: string
  businessId: string
  name: string
  parentId?: string
  description?: string
}

export interface Unit {
  id: string
  businessId: string
  name: string
  abbreviation: string
}

export interface InventoryTransaction {
  id: string
  businessId: string
  branchId: string
  productId: string
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  previousStock: number
  newStock: number
  reason?: string
  referenceType?: string
  referenceId?: string
  performedBy: string
  createdAt: string
}

export interface SaleOrder {
  id: string
  businessId: string
  branchId: string
  orderNumber: string
  customerId?: string
  items: OrderItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  amountPaid: number
  balance: number
  status: SaleStatus
  paymentMethod?: string
  notes?: string
  createdBy: string
  createdAt: string
}

export type SaleStatus = 'draft' | 'confirmed' | 'partial' | 'paid' | 'voided'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  total: number
}

export interface PurchaseOrder {
  id: string
  businessId: string
  branchId: string
  orderNumber: string
  supplierId: string
  items: OrderItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  amountPaid: number
  balance: number
  status: PurchaseStatus
  expectedDate?: string
  notes?: string
  createdBy: string
  createdAt: string
}

export type PurchaseStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'

export interface Invoice {
  id: string
  businessId: string
  invoiceNumber: string
  customerId: string
  saleOrderId?: string
  items: OrderItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  amountPaid: number
  balance: number
  dueDate: string
  status: InvoiceStatus
  notes?: string
  createdAt: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export interface Payment {
  id: string
  businessId: string
  referenceType: 'invoice' | 'purchase' | 'expense'
  referenceId: string
  amount: number
  method: PaymentMethod
  reference?: string
  notes?: string
  createdBy: string
  createdAt: string
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'mobile_money' | 'cheque' | 'credit'

export interface Employee {
  id: string
  businessId: string
  branchId: string
  employeeNumber: string
  name: string
  email: string
  phone?: string
  departmentId: string
  positionId: string
  salary: number
  salaryType: 'monthly' | 'weekly' | 'daily' | 'hourly'
  joinDate: string
  status: 'active' | 'inactive' | 'terminated'
  avatar?: string
  documents: EmployeeDocument[]
  createdAt: string
}

export interface EmployeeDocument {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: string
}

export interface Department {
  id: string
  businessId: string
  name: string
  managerId?: string
}

export interface Position {
  id: string
  businessId: string
  departmentId: string
  title: string
}

export interface Expense {
  id: string
  businessId: string
  branchId: string
  category: string
  description: string
  amount: number
  paymentMethod: PaymentMethod
  date: string
  receipt?: string
  createdBy: string
  createdAt: string
}

export interface BankAccount {
  id: string
  businessId: string
  name: string
  accountNumber: string
  bankName: string
  balance: number
  currency: string
  isActive: boolean
}

export interface Subscription {
  id: string
  planId: string
  planName: string
  status: 'active' | 'trial' | 'expired' | 'cancelled'
  currentPeriodStart: string
  currentPeriodEnd: string
  features: string[]
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  link?: string
  createdAt: string
}

// API response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  statusCode: number
}

// Dashboard types
export interface DashboardStats {
  revenue: { value: number; change: number; period: string }
  profit: { value: number; change: number; period: string }
  expenses: { value: number; change: number; period: string }
  sales: { value: number; change: number; period: string }
  outstandingInvoices: { count: number; amount: number }
  lowStockProducts: number
  pendingPayments: { count: number; amount: number }
  activeCustomers: number
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}
