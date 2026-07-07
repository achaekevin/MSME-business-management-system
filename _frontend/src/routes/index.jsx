import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { PrivateRoute, PublicRoute } from './guards'
import { Spinner } from '@/components/ui'

const Loading = () => (
  <div className="flex h-full items-center justify-center py-24">
    <Spinner size="lg" />
  </div>
)

const wrap = (Component) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
)

// Auth pages
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))
const TwoFactor = lazy(() => import('@/pages/auth/TwoFactor'))
const SessionExpired = lazy(() => import('@/pages/auth/SessionExpired'))

// App pages
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const CustomersList = lazy(() => import('@/pages/customers/CustomersList'))
const CustomerDetail = lazy(() => import('@/pages/customers/CustomerDetail'))
const CreateCustomer = lazy(() => import('@/pages/customers/CreateCustomer'))
const SuppliersList = lazy(() => import('@/pages/suppliers/SuppliersList'))
const SupplierDetail = lazy(() => import('@/pages/suppliers/SupplierDetail'))
const ProductsList = lazy(() => import('@/pages/products/ProductsList'))
const ProductDetail = lazy(() => import('@/pages/products/ProductDetail'))
const CreateProduct = lazy(() => import('@/pages/products/CreateProduct'))
const InventoryDashboard = lazy(() => import('@/pages/inventory/InventoryDashboard'))
const StockLevels = lazy(() => import('@/pages/inventory/StockLevels'))
const POSPage = lazy(() => import('@/pages/sales/POSPage'))
const SalesList = lazy(() => import('@/pages/sales/SalesList'))
const SaleDetail = lazy(() => import('@/pages/sales/SaleDetail'))
const InvoicesList = lazy(() => import('@/pages/invoices/InvoicesList'))
const InvoiceDetail = lazy(() => import('@/pages/invoices/InvoiceDetail'))
const CreateInvoice = lazy(() => import('@/pages/invoices/CreateInvoice'))
const PurchasesList = lazy(() => import('@/pages/purchases/PurchasesList'))
const PurchaseDetail = lazy(() => import('@/pages/purchases/PurchaseDetail'))
const PaymentsList = lazy(() => import('@/pages/payments/PaymentsList'))
const FinanceDashboard = lazy(() => import('@/pages/finance/FinanceDashboard'))
const Expenses = lazy(() => import('@/pages/finance/Expenses'))
const AccountingPage = lazy(() => import('@/pages/accounting/AccountingPage'))
const EmployeesList = lazy(() => import('@/pages/employees/EmployeesList'))
const EmployeeDetail = lazy(() => import('@/pages/employees/EmployeeDetail'))
const PayrollPage = lazy(() => import('@/pages/payroll/PayrollPage'))
const ReportsDashboard = lazy(() => import('@/pages/reports/ReportsDashboard'))
const BusinessProfile = lazy(() => import('@/pages/business/BusinessProfile'))
const BranchManagement = lazy(() => import('@/pages/business/BranchManagement'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const UserManagement = lazy(() => import('@/pages/settings/UserManagement'))
const SubscriptionsPage = lazy(() => import('@/pages/subscriptions/SubscriptionsPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'))

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <PublicRoute><AuthLayout /></PublicRoute>,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: wrap(Login) },
      { path: 'register', element: wrap(Register) },
      { path: 'forgot-password', element: wrap(ForgotPassword) },
      { path: 'reset-password', element: wrap(ResetPassword) },
      { path: 'verify-email', element: wrap(VerifyEmail) },
      { path: '2fa', element: wrap(TwoFactor) },
      { path: 'session-expired', element: wrap(SessionExpired) }
    ]
  },
  {
    path: '/',
    element: <PrivateRoute><AppLayout /></PrivateRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: wrap(Dashboard) },
      // Customers
      { path: 'customers', element: wrap(CustomersList) },
      { path: 'customers/new', element: wrap(CreateCustomer) },
      { path: 'customers/:id', element: wrap(CustomerDetail) },
      { path: 'customers/:id/edit', element: wrap(CreateCustomer) },
      // Suppliers
      { path: 'suppliers', element: wrap(SuppliersList) },
      { path: 'suppliers/:id', element: wrap(SupplierDetail) },
      // Products
      { path: 'products', element: wrap(ProductsList) },
      { path: 'products/new', element: wrap(CreateProduct) },
      { path: 'products/:id', element: wrap(ProductDetail) },
      { path: 'products/:id/edit', element: wrap(CreateProduct) },
      // Inventory
      { path: 'inventory', element: wrap(InventoryDashboard) },
      { path: 'inventory/stock', element: wrap(StockLevels) },
      // Sales
      { path: 'sales/pos', element: wrap(POSPage) },
      { path: 'sales', element: wrap(SalesList) },
      { path: 'sales/:id', element: wrap(SaleDetail) },
      // Invoices
      { path: 'invoices', element: wrap(InvoicesList) },
      { path: 'invoices/new', element: wrap(CreateInvoice) },
      { path: 'invoices/:id', element: wrap(InvoiceDetail) },
      // Purchases
      { path: 'purchases', element: wrap(PurchasesList) },
      { path: 'purchases/:id', element: wrap(PurchaseDetail) },
      // Payments
      { path: 'payments', element: wrap(PaymentsList) },
      // Finance
      { path: 'finance', element: wrap(FinanceDashboard) },
      { path: 'finance/expenses', element: wrap(Expenses) },
      // Accounting
      { path: 'accounting', element: wrap(AccountingPage) },
      // Employees
      { path: 'employees', element: wrap(EmployeesList) },
      { path: 'employees/:id', element: wrap(EmployeeDetail) },
      // Payroll
      { path: 'payroll', element: wrap(PayrollPage) },
      // Reports
      { path: 'reports', element: wrap(ReportsDashboard) },
      // Business
      { path: 'business', element: wrap(BusinessProfile) },
      { path: 'business/branches', element: wrap(BranchManagement) },
      // Settings
      { path: 'settings', element: wrap(SettingsPage) },
      { path: 'settings/users', element: wrap(UserManagement) },
      // Subscriptions
      { path: 'subscriptions', element: wrap(SubscriptionsPage) },
      // Profile
      { path: 'profile', element: wrap(ProfilePage) },
      // Notifications
      { path: 'notifications', element: wrap(NotificationsPage) },
      // Errors
      { path: 'unauthorized', element: wrap(UnauthorizedPage) }
    ]
  },
  { path: '*', element: wrap(NotFoundPage) }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
