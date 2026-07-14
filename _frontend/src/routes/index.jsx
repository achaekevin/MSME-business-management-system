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

// Landing page
const LandingPage = lazy(() => import('@/pages/LandingPage'))

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

// Inventory
const InventoryDashboard = lazy(() => import('@/pages/inventory/InventoryDashboard'))
const StockLevels = lazy(() => import('@/pages/inventory/StockLevels'))
const StockAdjustments = lazy(() => import('@/pages/inventory/StockAdjustments'))
const StockTransfer = lazy(() => import('@/pages/inventory/StockTransfer'))
const Warehouses = lazy(() => import('@/pages/inventory/Warehouses'))

// Sales
const POSPage = lazy(() => import('@/pages/sales/POSPage'))
const SalesList = lazy(() => import('@/pages/sales/SalesList'))
const SaleDetail = lazy(() => import('@/pages/sales/SaleDetail'))
const Quotations = lazy(() => import('@/pages/sales/Quotations'))
const SalesReturns = lazy(() => import('@/pages/sales/SalesReturns'))

const InvoicesList = lazy(() => import('@/pages/invoices/InvoicesList'))
const InvoiceDetail = lazy(() => import('@/pages/invoices/InvoiceDetail'))
const CreateInvoice = lazy(() => import('@/pages/invoices/CreateInvoice'))

// Purchases
const PurchasesList = lazy(() => import('@/pages/purchases/PurchasesList'))
const PurchaseDetail = lazy(() => import('@/pages/purchases/PurchaseDetail'))
const PurchaseRequests = lazy(() => import('@/pages/purchases/PurchaseRequests'))
const GoodsReceived = lazy(() => import('@/pages/purchases/GoodsReceived'))

const PaymentsList = lazy(() => import('@/pages/payments/PaymentsList'))

// Finance
const FinanceDashboard = lazy(() => import('@/pages/finance/FinanceDashboard'))
const Expenses = lazy(() => import('@/pages/finance/Expenses'))
const BankAccounts = lazy(() => import('@/pages/finance/BankAccounts'))
const CashFlow = lazy(() => import('@/pages/finance/CashFlow'))
const Receivables = lazy(() => import('@/pages/finance/Receivables'))
const Payables = lazy(() => import('@/pages/finance/Payables'))

// Accounting
const AccountingPage = lazy(() => import('@/pages/accounting/AccountingPage'))
const JournalEntries = lazy(() => import('@/pages/accounting/JournalEntries'))
const TrialBalance = lazy(() => import('@/pages/accounting/TrialBalance'))
const BalanceSheet = lazy(() => import('@/pages/accounting/BalanceSheet'))
const ProfitLoss = lazy(() => import('@/pages/accounting/ProfitLoss'))

// Employees
const EmployeesList = lazy(() => import('@/pages/employees/EmployeesList'))
const EmployeeDetail = lazy(() => import('@/pages/employees/EmployeeDetail'))
const Attendance = lazy(() => import('@/pages/employees/Attendance'))
const LeaveManagement = lazy(() => import('@/pages/employees/LeaveManagement'))

const PayrollPage = lazy(() => import('@/pages/payroll/PayrollPage'))

// Reports
const ReportsDashboard = lazy(() => import('@/pages/reports/ReportsDashboard'))
const SalesReport = lazy(() => import('@/pages/reports/SalesReport'))
const InventoryReport = lazy(() => import('@/pages/reports/InventoryReport'))
const FinancialReport = lazy(() => import('@/pages/reports/FinancialReport'))
const CustomerReport = lazy(() => import('@/pages/reports/CustomerReport'))
const EmployeeReport = lazy(() => import('@/pages/reports/EmployeeReport'))
const DataExport = lazy(() => import('@/pages/export/DataExport'))

const BusinessProfile = lazy(() => import('@/pages/business/BusinessProfile'))
const BranchManagement = lazy(() => import('@/pages/business/BranchManagement'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const UserManagement = lazy(() => import('@/pages/settings/UserManagement'))
const SubscriptionsPage = lazy(() => import('@/pages/subscriptions/SubscriptionsPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'))

// Documents & AI
const DocumentsList = lazy(() => import('@/pages/documents/DocumentsList'))
const AIInsights = lazy(() => import('@/pages/ai/AIInsights'))

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: wrap(LandingPage)
  },
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
    path: '/app',
    element: <PrivateRoute><AppLayout /></PrivateRoute>,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: wrap(Dashboard) },
      { path: '*', element: <Navigate to="/app/dashboard" replace /> },
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
      { path: 'inventory/adjust', element: wrap(StockAdjustments) },
      { path: 'inventory/transfer', element: wrap(StockTransfer) },
      { path: 'inventory/warehouses', element: wrap(Warehouses) },
      // Sales
      { path: 'sales/pos', element: wrap(POSPage) },
      { path: 'sales', element: wrap(SalesList) },
      { path: 'sales/:id', element: wrap(SaleDetail) },
      { path: 'sales/quotations', element: wrap(Quotations) },
      { path: 'sales/returns', element: wrap(SalesReturns) },
      // Invoices
      { path: 'invoices', element: wrap(InvoicesList) },
      { path: 'invoices/new', element: wrap(CreateInvoice) },
      { path: 'invoices/:id', element: wrap(InvoiceDetail) },
      // Purchases
      { path: 'purchases', element: wrap(PurchasesList) },
      { path: 'purchases/:id', element: wrap(PurchaseDetail) },
      { path: 'purchases/requests', element: wrap(PurchaseRequests) },
      { path: 'purchases/grns', element: wrap(GoodsReceived) },
      // Payments
      { path: 'payments', element: wrap(PaymentsList) },
      // Finance
      { path: 'finance', element: wrap(FinanceDashboard) },
      { path: 'finance/expenses', element: wrap(Expenses) },
      { path: 'finance/bank-accounts', element: wrap(BankAccounts) },
      { path: 'finance/cash-flow', element: wrap(CashFlow) },
      { path: 'finance/receivables', element: wrap(Receivables) },
      { path: 'finance/payables', element: wrap(Payables) },
      // Accounting
      { path: 'accounting', element: wrap(AccountingPage) },
      { path: 'accounting/journal-entries', element: wrap(JournalEntries) },
      { path: 'accounting/trial-balance', element: wrap(TrialBalance) },
      { path: 'accounting/balance-sheet', element: wrap(BalanceSheet) },
      { path: 'accounting/pnl', element: wrap(ProfitLoss) },
      // Employees
      { path: 'employees', element: wrap(EmployeesList) },
      { path: 'employees/:id', element: wrap(EmployeeDetail) },
      { path: 'employees/attendance', element: wrap(Attendance) },
      { path: 'employees/leaves', element: wrap(LeaveManagement) },
      // Payroll
      { path: 'payroll', element: wrap(PayrollPage) },
      // Reports
      { path: 'reports', element: wrap(ReportsDashboard) },
      { path: 'reports/sales', element: wrap(SalesReport) },
      { path: 'reports/inventory', element: wrap(InventoryReport) },
      { path: 'reports/financial', element: wrap(FinancialReport) },
      { path: 'reports/customers', element: wrap(CustomerReport) },
      { path: 'reports/employees', element: wrap(EmployeeReport) },
      // Data Export
      { path: 'export', element: wrap(DataExport) },
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
      // Documents & AI
      { path: 'documents', element: wrap(DocumentsList) },
      { path: 'ai', element: wrap(AIInsights) },
      // Errors
      { path: 'unauthorized', element: wrap(UnauthorizedPage) }
    ]
  },
  { path: '*', element: wrap(NotFoundPage) }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
