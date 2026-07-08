import api from './api'

// Business
export const businessService = {
  get: () => api.get('/business'),
  update: (data) => api.put('/business', data),
  uploadLogo: (file) => { const f = new FormData(); f.append('logo', file); return api.post('/business/logo', f, { headers: { 'Content-Type': 'multipart/form-data' } }) },
  getStats: (params) => api.get('/business/stats', { params }),
  getBranches: () => api.get('/business/branches'),
  createBranch: (data) => api.post('/business/branches', data),
  updateBranch: (id, data) => api.put(`/business/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/business/branches/${id}`)
}

// Customers
export const customerService = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getTransactions: (id, params) => api.get(`/customers/${id}/transactions`, { params }),
  getStatement: (id, params) => api.get(`/customers/${id}/statement`, { params }),
  getGroups: () => api.get('/customers/groups'),
  createGroup: (data) => api.post('/customers/groups', data),
  exportPdf: (params) => api.get('/customers/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/customers/export/excel', { params, responseType: 'blob' })
}

// Suppliers
export const supplierService = {
  list: (params) => api.get('/suppliers', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getStatement: (id, params) => api.get(`/suppliers/${id}/statement`, { params }),
  getPurchaseHistory: (id, params) => api.get(`/suppliers/${id}/purchases`, { params })
}

// Products
export const productService = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImage: (id, file) => { const f = new FormData(); f.append('image', file); return api.post(`/products/${id}/images`, f, { headers: { 'Content-Type': 'multipart/form-data' } }) },
  deleteImage: (id, imageId) => api.delete(`/products/${id}/images/${imageId}`),
  getCategories: () => api.get('/products/categories'),
  createCategory: (data) => api.post('/products/categories', data),
  getUnits: () => api.get('/products/units'),
  createUnit: (data) => api.post('/products/units', data),
  bulkImport: (file) => { const f = new FormData(); f.append('file', file); return api.post('/products/import', f, { headers: { 'Content-Type': 'multipart/form-data' } }) },
  exportExcel: (params) => api.get('/products/export/excel', { params, responseType: 'blob' })
}

// Inventory
export const inventoryService = {
  getDashboard: () => api.get('/inventory/dashboard'),
  getStock: (params) => api.get('/inventory/stock', { params }),
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  adjust: (data) => api.post('/inventory/adjust', data),
  transfer: (data) => api.post('/inventory/transfer', data),
  getLowStock: (params) => api.get('/inventory/low-stock', { params }),
  getWarehouses: () => api.get('/inventory/warehouses'),
  createWarehouse: (data) => api.post('/inventory/warehouses', data)
}

// Sales
export const salesService = {
  list: (params) => api.get('/sales', { params }),
  get: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  void: (id, reason) => api.post(`/sales/${id}/void`, { reason }),
  getReceipt: (id) => api.get(`/sales/${id}/receipt`),
  getQuotations: (params) => api.get('/sales/quotations', { params }),
  createQuotation: (data) => api.post('/sales/quotations', data),
  convertToSale: (id) => api.post(`/sales/quotations/${id}/convert`),
  getReturns: (params) => api.get('/sales/returns', { params }),
  createReturn: (data) => api.post('/sales/returns', data)
}

// Purchases
export const purchaseService = {
  list: (params) => api.get('/purchases', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  receive: (id, data) => api.post(`/purchases/${id}/receive`, data),
  cancel: (id) => api.post(`/purchases/${id}/cancel`),
  getRequests: (params) => api.get('/purchases/requests', { params }),
  createRequest: (data) => api.post('/purchases/requests', data),
  getGRNs: (params) => api.get('/purchases/grns', { params })
}

// Invoices
export const invoiceService = {
  list: (params) => api.get('/invoices', { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  send: (id) => api.post(`/invoices/${id}/send`),
  cancel: (id) => api.post(`/invoices/${id}/cancel`),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payments`, data),
  getPdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
}

// Payments
export const paymentService = {
  list: (params) => api.get('/payments', { params }),
  get: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  delete: (id) => api.delete(`/payments/${id}`)
}

// Finance
export const financeService = {
  getDashboard: () => api.get('/finance/dashboard'),
  getIncome: (params) => api.get('/finance/income', { params }),
  getExpenses: (params) => api.get('/finance/expenses', { params }),
  createExpense: (data) => api.post('/finance/expenses', data),
  updateExpense: (id, data) => api.put(`/finance/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),
  getBankAccounts: () => api.get('/finance/bank-accounts'),
  createBankAccount: (data) => api.post('/finance/bank-accounts', data),
  getCashFlow: (params) => api.get('/finance/cash-flow', { params }),
  getReceivables: (params) => api.get('/finance/receivables', { params }),
  getPayables: (params) => api.get('/finance/payables', { params })
}

// Accounting
export const accountingService = {
  getChartOfAccounts: () => api.get('/accounting/accounts'),
  createAccount: (data) => api.post('/accounting/accounts', data),
  getJournalEntries: (params) => api.get('/accounting/journal-entries', { params }),
  createJournalEntry: (data) => api.post('/accounting/journal-entries', data),
  getTrialBalance: (params) => api.get('/accounting/trial-balance', { params }),
  getBalanceSheet: (params) => api.get('/accounting/balance-sheet', { params }),
  getPnL: (params) => api.get('/accounting/pnl', { params }),
  getTaxReport: (params) => api.get('/accounting/tax-report', { params })
}

// Employees
export const employeeService = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  uploadDocument: (id, file, type) => { const f = new FormData(); f.append('document', file); f.append('type', type); return api.post(`/employees/${id}/documents`, f, { headers: { 'Content-Type': 'multipart/form-data' } }) },
  getDepartments: () => api.get('/employees/departments'),
  createDepartment: (data) => api.post('/employees/departments', data),
  getPositions: (deptId) => api.get('/employees/positions', { params: { departmentId: deptId } }),
  createPosition: (data) => api.post('/employees/positions', data),
  getAttendance: (params) => api.get('/employees/attendance', { params }),
  recordAttendance: (data) => api.post('/employees/attendance', data),
  getLeaves: (params) => api.get('/employees/leaves', { params }),
  applyLeave: (data) => api.post('/employees/leaves', data),
  approveLeave: (id) => api.post(`/employees/leaves/${id}/approve`),
  rejectLeave: (id, reason) => api.post(`/employees/leaves/${id}/reject`, { reason })
}

// Payroll
export const payrollService = {
  list: (params) => api.get('/payroll', { params }),
  get: (id) => api.get(`/payroll/${id}`),
  process: (data) => api.post('/payroll/process', data),
  approve: (id) => api.post(`/payroll/${id}/approve`),
  disburse: (id) => api.post(`/payroll/${id}/disburse`),
  getSlip: (id, employeeId) => api.get(`/payroll/${id}/slips/${employeeId}`, { responseType: 'blob' })
}

// Reports
export const reportService = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getPurchases: (params) => api.get('/reports/purchases', { params }),
  getInventory: (params) => api.get('/reports/inventory', { params }),
  getFinancial: (params) => api.get('/reports/financial', { params }),
  getCustomers: (params) => api.get('/reports/customers', { params }),
  getEmployees: (params) => api.get('/reports/employees', { params }),
  exportPdf: (type, params) => api.get(`/reports/${type}/export/pdf`, { params, responseType: 'blob' }),
  exportExcel: (type, params) => api.get(`/reports/${type}/export/excel`, { params, responseType: 'blob' })
}

// Notifications
export const notificationService = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (data) => api.put('/notifications/settings', data)
}

// Settings
export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getUsers: (params) => api.get('/settings/users', { params }),
  inviteUser: (data) => api.post('/settings/users/invite', data),
  updateUser: (id, data) => api.put(`/settings/users/${id}`, data),
  removeUser: (id) => api.delete(`/settings/users/${id}`),
  getRoles: () => api.get('/settings/roles'),
  createRole: (data) => api.post('/settings/roles', data),
  getAuditLogs: (params) => api.get('/settings/audit-logs', { params }),
  getApiKeys: () => api.get('/settings/api-keys'),
  createApiKey: (data) => api.post('/settings/api-keys', data),
  deleteApiKey: (id) => api.delete(`/settings/api-keys/${id}`)
}

// Subscriptions
export const subscriptionService = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  upgrade: (planId, paymentMethodId) => api.post('/subscriptions/upgrade', { planId, paymentMethodId }),
  cancel: () => api.post('/subscriptions/cancel'),
  getBillingHistory: () => api.get('/subscriptions/billing'),
  getPaymentMethods: () => api.get('/subscriptions/payment-methods'),
  addPaymentMethod: (data) => api.post('/subscriptions/payment-methods', data),
  deletePaymentMethod: (id) => api.delete(`/subscriptions/payment-methods/${id}`)
}

// Documents
export const documentService = {
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  getSignedUrl: (id) => api.get(`/documents/${id}/signed-url`),
  upload: (file, category, metadata) => {
    const f = new FormData()
    f.append('file', file)
    f.append('category', category)
    if (metadata) f.append('metadata', JSON.stringify(metadata))
    return api.post('/documents', f, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id) => api.delete(`/documents/${id}`)
}
