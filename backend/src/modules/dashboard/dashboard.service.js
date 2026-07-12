const { PrismaClient } = require('@prisma/client')
const { ENTERPRISE_ROLES } = require('../../constants/permissions')

const prisma = new PrismaClient()

/**
 * Get role-specific dashboard data based on user's role
 */
async function getRoleDashboard(businessId, userId, userRole) {
  const roleName = userRole.name

  // Route to specific dashboard based on role
  switch (roleName) {
    case ENTERPRISE_ROLES.BUSINESS_OWNER:
      return await getBusinessOwnerDashboard(businessId)
    
    case ENTERPRISE_ROLES.BRANCH_MANAGER:
      return await getBranchManagerDashboard(businessId, userId)
    
    case ENTERPRISE_ROLES.SALES_MANAGER:
      return await getSalesManagerDashboard(businessId)
    
    case ENTERPRISE_ROLES.SALES_REP:
      return await getSalesRepDashboard(businessId, userId)
    
    case ENTERPRISE_ROLES.CASHIER:
      return await getCashierDashboard(businessId, userId)
    
    case ENTERPRISE_ROLES.INVENTORY_OFFICER:
      return await getInventoryOfficerDashboard(businessId)
    
    case ENTERPRISE_ROLES.WAREHOUSE_MANAGER:
      return await getWarehouseManagerDashboard(businessId)
    
    case ENTERPRISE_ROLES.PROCUREMENT_OFFICER:
      return await getProcurementOfficerDashboard(businessId)
    
    case ENTERPRISE_ROLES.ACCOUNTANT:
      return await getAccountantDashboard(businessId)
    
    case ENTERPRISE_ROLES.FINANCE_MANAGER:
      return await getFinanceManagerDashboard(businessId)
    
    case ENTERPRISE_ROLES.HR_MANAGER:
      return await getHRManagerDashboard(businessId)
    
    case ENTERPRISE_ROLES.EMPLOYEE:
      return await getEmployeeDashboard(businessId, userId)
    
    case ENTERPRISE_ROLES.PROJECT_MANAGER:
      return await getProjectManagerDashboard(businessId, userId)
    
    case ENTERPRISE_ROLES.SUPPORT_OFFICER:
      return await getSupportOfficerDashboard(businessId)
    
    case ENTERPRISE_ROLES.DELIVERY_DRIVER:
      return await getDeliveryDriverDashboard(businessId, userId)
    
    case ENTERPRISE_ROLES.MARKETING_OFFICER:
      return await getMarketingOfficerDashboard(businessId)
    
    case ENTERPRISE_ROLES.AUDITOR:
      return await getAuditorDashboard(businessId)
    
    case ENTERPRISE_ROLES.OPERATIONS_MANAGER:
      return await getOperationsManagerDashboard(businessId)
    
    case ENTERPRISE_ROLES.DEVELOPER:
      return await getDeveloperDashboard(businessId)
    
    case ENTERPRISE_ROLES.SUPPLIER:
      return await getSupplierDashboard(businessId, userId)
    
    case ENTERPRISE_ROLES.CUSTOMER:
      return await getCustomerDashboard(businessId, userId)
    
    default:
      return await getDefaultDashboard(businessId)
  }
}

// Helper functions for date ranges
function getMonthRange() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return { gte: startOfMonth }
}

function getLastMonthRange() {
  const now = new Date()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  return { gte: startOfLastMonth, lte: endOfLastMonth }
}

function getTodayRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return { gte: today }
}

/**
 * Business Owner Dashboard - Complete business overview
 */
async function getBusinessOwnerDashboard(businessId) {
  const thisMonth = getMonthRange()
  const lastMonth = getLastMonthRange()

  const [
    revenue, expenses, sales, customers, products, inventory,
    recentSales, outstandingInvoices, lowStock
  ] = await Promise.all([
    prisma.saleOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.expense.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { amount: true } }),
    prisma.saleOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.product.count({ where: { businessId, isActive: true } }),
    prisma.inventoryTransaction.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.saleOrder.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.invoice.aggregate({ where: { businessId, status: 'pending' }, _count: true, _sum: { balance: true } }),
    prisma.product.count({ where: { businessId, stockQuantity: { lte: prisma.product.fields.reorderLevel } } })
  ])

  return {
    role: 'Business Owner',
    overview: {
      revenue: { value: Number(revenue._sum.total || 0), period: 'This Month' },
      expenses: { value: Number(expenses._sum.amount || 0), period: 'This Month' },
      profit: { value: Number(revenue._sum.total || 0) - Number(expenses._sum.amount || 0), period: 'This Month' },
      sales: { value: sales, period: 'This Month' }
    },
    stats: {
      totalCustomers: customers,
      totalProducts: products,
      inventoryTransactions: inventory,
      lowStockProducts: lowStock
    },
    financial: {
      outstandingInvoices: {
        count: outstandingInvoices._count,
        amount: Number(outstandingInvoices._sum.balance || 0)
      }
    },
    recentActivity: recentSales.map(sale => ({
      id: sale.id,
      orderNumber: sale.orderNumber,
      total: Number(sale.total),
      createdAt: sale.createdAt
    }))
  }
}

/**
 * Branch Manager Dashboard - Branch operations
 */
async function getBranchManagerDashboard(businessId, userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { branch: true } })
  const branchId = user.branchId
  const thisMonth = getMonthRange()

  const [
    branchSales, branchRevenue, branchEmployees, branchInventory
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, branchId, createdAt: thisMonth } }),
    prisma.saleOrder.aggregate({ where: { businessId, branchId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.user.count({ where: { businessId, branchId, status: 'active' } }),
    prisma.product.count({ where: { businessId } })
  ])

  return {
    role: 'Branch Manager',
    branch: { id: branchId, name: user.branch?.name },
    overview: {
      sales: { value: branchSales, period: 'This Month' },
      revenue: { value: Number(branchRevenue._sum.total || 0), period: 'This Month' },
      employees: { value: branchEmployees, period: 'Active' },
      inventory: { value: branchInventory, period: 'Total Products' }
    }
  }
}

/**
 * Sales Manager Dashboard - Sales performance
 */
async function getSalesManagerDashboard(businessId) {
  const thisMonth = getMonthRange()
  const today = getTodayRange()

  const [
    totalSales, todaySales, monthRevenue, customers, topProducts
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.saleOrder.count({ where: { businessId, createdAt: today } }),
    prisma.saleOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.saleItem.groupBy({ by: ['productId'], where: { saleOrder: { businessId } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 })
  ])

  return {
    role: 'Sales Manager',
    overview: {
      totalSales: { value: totalSales, period: 'This Month' },
      todaySales: { value: todaySales, period: 'Today' },
      revenue: { value: Number(monthRevenue._sum.total || 0), period: 'This Month' },
      customers: { value: customers, period: 'Active' }
    },
    topProducts: topProducts.map(p => ({ productId: p.productId, soldQuantity: p._sum.quantity }))
  }
}

/**
 * Sales Rep Dashboard - Personal sales
 */
async function getSalesRepDashboard(businessId, userId) {
  const thisMonth = getMonthRange()
  const today = getTodayRange()

  const [
    mySales, myRevenue, todaySales, myCustomers
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, createdById: userId, createdAt: thisMonth } }),
    prisma.saleOrder.aggregate({ where: { businessId, createdById: userId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.saleOrder.count({ where: { businessId, createdById: userId, createdAt: today } }),
    prisma.customer.count({ where: { businessId, isActive: true } })
  ])

  return {
    role: 'Sales Representative',
    overview: {
      mySales: { value: mySales, period: 'This Month' },
      myRevenue: { value: Number(myRevenue._sum.total || 0), period: 'This Month' },
      todaySales: { value: todaySales, period: 'Today' },
      customers: { value: myCustomers, period: 'Available' }
    }
  }
}

/**
 * Cashier Dashboard - Daily transactions
 */
async function getCashierDashboard(businessId, userId) {
  const today = getTodayRange()

  const [
    todaySales, todayRevenue, recentTransactions
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, createdById: userId, createdAt: today } }),
    prisma.saleOrder.aggregate({ where: { businessId, createdById: userId, createdAt: today }, _sum: { total: true } }),
    prisma.saleOrder.findMany({ where: { businessId, createdById: userId }, orderBy: { createdAt: 'desc' }, take: 10 })
  ])

  return {
    role: 'Cashier / POS Operator',
    overview: {
      todaySales: { value: todaySales, period: 'Today' },
      todayRevenue: { value: Number(todayRevenue._sum.total || 0), period: 'Today' }
    },
    recentTransactions: recentTransactions.map(t => ({
      orderNumber: t.orderNumber,
      total: Number(t.total),
      createdAt: t.createdAt
    }))
  }
}

/**
 * Inventory Officer Dashboard - Stock management
 */
async function getInventoryOfficerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    totalProducts, lowStock, stockAdjustments, recentTransactions
  ] = await Promise.all([
    prisma.product.count({ where: { businessId, isActive: true } }),
    prisma.product.count({ where: { businessId, stockQuantity: { lte: prisma.product.fields.reorderLevel } } }),
    prisma.inventoryTransaction.count({ where: { businessId, type: 'adjustment', createdAt: thisMonth } }),
    prisma.inventoryTransaction.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 10, include: { product: true } })
  ])

  return {
    role: 'Inventory Officer',
    overview: {
      totalProducts: { value: totalProducts, period: 'Active' },
      lowStock: { value: lowStock, period: 'Needs Attention' },
      adjustments: { value: stockAdjustments, period: 'This Month' }
    },
    recentTransactions: recentTransactions.map(t => ({
      type: t.type,
      product: t.product?.name,
      quantity: t.quantity,
      createdAt: t.createdAt
    }))
  }
}

/**
 * Warehouse Manager Dashboard - Warehouse operations
 */
async function getWarehouseManagerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    warehouses, transfers, totalStock, recentTransfers
  ] = await Promise.all([
    prisma.warehouse.count({ where: { businessId, isActive: true } }),
    prisma.inventoryTransfer.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.product.aggregate({ where: { businessId }, _sum: { stockQuantity: true } }),
    prisma.inventoryTransfer.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 10, include: { fromWarehouse: true, toWarehouse: true } })
  ])

  return {
    role: 'Warehouse Manager',
    overview: {
      warehouses: { value: warehouses, period: 'Active' },
      transfers: { value: transfers, period: 'This Month' },
      totalStock: { value: totalStock._sum.stockQuantity || 0, period: 'Total Units' }
    },
    recentTransfers: recentTransfers.map(t => ({
      from: t.fromWarehouse?.name,
      to: t.toWarehouse?.name,
      status: t.status,
      createdAt: t.createdAt
    }))
  }
}

/**
 * Procurement Officer Dashboard - Purchasing
 */
async function getProcurementOfficerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    purchaseOrders, pendingOrders, totalSpend, suppliers
  ] = await Promise.all([
    prisma.purchaseOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.purchaseOrder.count({ where: { businessId, status: 'pending' } }),
    prisma.purchaseOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.supplier.count({ where: { businessId, isActive: true } })
  ])

  return {
    role: 'Procurement Officer',
    overview: {
      purchaseOrders: { value: purchaseOrders, period: 'This Month' },
      pendingOrders: { value: pendingOrders, period: 'Awaiting' },
      totalSpend: { value: Number(totalSpend._sum.total || 0), period: 'This Month' },
      suppliers: { value: suppliers, period: 'Active' }
    }
  }
}

/**
 * Accountant Dashboard - Financial records
 */
async function getAccountantDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    pendingInvoices, paidInvoices, expenses, revenue
  ] = await Promise.all([
    prisma.invoice.count({ where: { businessId, status: 'pending' } }),
    prisma.invoice.count({ where: { businessId, status: 'paid', paidAt: thisMonth } }),
    prisma.expense.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { amount: true } }),
    prisma.saleOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } })
  ])

  return {
    role: 'Accountant',
    overview: {
      pendingInvoices: { value: pendingInvoices, period: 'Unpaid' },
      paidInvoices: { value: paidInvoices, period: 'This Month' },
      expenses: { value: Number(expenses._sum.amount || 0), period: 'This Month' },
      revenue: { value: Number(revenue._sum.total || 0), period: 'This Month' }
    }
  }
}

/**
 * Finance Manager Dashboard - Financial oversight
 */
async function getFinanceManagerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    revenue, expenses, profit, cashFlow, outstandingPayables, outstandingReceivables
  ] = await Promise.all([
    prisma.saleOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.expense.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { amount: true } }),
    prisma.journalEntry.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.payment.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { amount: true } }),
    prisma.purchaseOrder.aggregate({ where: { businessId, status: 'pending' }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { businessId, status: 'pending' }, _sum: { balance: true } })
  ])

  const rev = Number(revenue._sum.total || 0)
  const exp = Number(expenses._sum.amount || 0)

  return {
    role: 'Finance Manager',
    overview: {
      revenue: { value: rev, period: 'This Month' },
      expenses: { value: exp, period: 'This Month' },
      profit: { value: rev - exp, period: 'This Month' },
      cashFlow: { value: Number(cashFlow._sum.amount || 0), period: 'This Month' }
    },
    financial: {
      outstandingPayables: Number(outstandingPayables._sum.total || 0),
      outstandingReceivables: Number(outstandingReceivables._sum.balance || 0)
    }
  }
}

/**
 * HR Manager Dashboard - Human resources
 */
async function getHRManagerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    totalEmployees, activeEmployees, pendingLeaves, recentHires
  ] = await Promise.all([
    prisma.user.count({ where: { businessId } }),
    prisma.user.count({ where: { businessId, status: 'active' } }),
    prisma.user.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.user.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, email: true, createdAt: true } })
  ])

  return {
    role: 'HR Manager',
    overview: {
      totalEmployees: { value: totalEmployees, period: 'All' },
      activeEmployees: { value: activeEmployees, period: 'Active' },
      newHires: { value: pendingLeaves, period: 'This Month' }
    },
    recentHires: recentHires.map(h => ({ name: h.name, email: h.email, joinedAt: h.createdAt }))
  }
}

/**
 * Employee Dashboard - Self-service
 */
async function getEmployeeDashboard(businessId, userId) {
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { role: true, branch: true } 
  })

  return {
    role: 'Employee',
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role?.displayName || user.role?.name,
      branch: user.branch?.name,
      employeeNumber: user.employeeNumber
    },
    overview: {
      status: user.status,
      joinedAt: user.createdAt
    }
  }
}

/**
 * Project Manager Dashboard - Projects
 */
async function getProjectManagerDashboard(businessId, userId) {
  const thisMonth = getMonthRange()

  // Note: Projects module needs to be implemented
  return {
    role: 'Project Manager',
    overview: {
      activeProjects: { value: 0, period: 'In Progress' },
      completedProjects: { value: 0, period: 'This Month' },
      pendingTasks: { value: 0, period: 'Assigned' }
    },
    message: 'Projects module not yet implemented'
  }
}

/**
 * Support Officer Dashboard - Customer support
 */
async function getSupportOfficerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    totalCustomers, activeCustomers, recentCustomers
  ] = await Promise.all([
    prisma.customer.count({ where: { businessId } }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.customer.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 10, select: { name: true, email: true, phone: true, createdAt: true } })
  ])

  return {
    role: 'Customer Support Officer',
    overview: {
      totalCustomers: { value: totalCustomers, period: 'All' },
      activeCustomers: { value: activeCustomers, period: 'Active' }
    },
    recentCustomers: recentCustomers.map(c => ({ name: c.name, email: c.email, phone: c.phone, createdAt: c.createdAt }))
  }
}

/**
 * Delivery Driver Dashboard - Deliveries
 */
async function getDeliveryDriverDashboard(businessId, userId) {
  const today = getTodayRange()

  // Note: Deliveries module needs to be implemented
  return {
    role: 'Delivery Driver',
    overview: {
      todayDeliveries: { value: 0, period: 'Assigned Today' },
      completedDeliveries: { value: 0, period: 'Completed' },
      pendingDeliveries: { value: 0, period: 'Pending' }
    },
    message: 'Deliveries module not yet implemented'
  }
}

/**
 * Marketing Officer Dashboard - Campaigns
 */
async function getMarketingOfficerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    totalCustomers, newCustomers, sales, revenue
  ] = await Promise.all([
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.customer.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.saleOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.saleOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } })
  ])

  return {
    role: 'Marketing Officer',
    overview: {
      totalCustomers: { value: totalCustomers, period: 'Active' },
      newCustomers: { value: newCustomers, period: 'This Month' },
      sales: { value: sales, period: 'This Month' },
      revenue: { value: Number(revenue._sum.total || 0), period: 'This Month' }
    },
    message: 'Marketing campaigns module not yet implemented'
  }
}

/**
 * Auditor Dashboard - Audit logs
 */
async function getAuditorDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    totalAuditLogs, criticalLogs, userActivity
  ] = await Promise.all([
    prisma.auditLog.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.auditLog.count({ where: { businessId, action: { contains: 'delete' }, createdAt: thisMonth } }),
    prisma.auditLog.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { name: true, email: true } } } })
  ])

  return {
    role: 'Auditor',
    overview: {
      totalLogs: { value: totalAuditLogs, period: 'This Month' },
      criticalActions: { value: criticalLogs, period: 'This Month' }
    },
    recentActivity: userActivity.map(log => ({
      action: log.action,
      user: log.user?.name,
      createdAt: log.createdAt
    }))
  }
}

/**
 * Operations Manager Dashboard - Overall operations
 */
async function getOperationsManagerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    sales, inventory, purchases, employees
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.inventoryTransaction.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.purchaseOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.user.count({ where: { businessId, status: 'active' } })
  ])

  return {
    role: 'Operations Manager',
    overview: {
      sales: { value: sales, period: 'This Month' },
      inventoryMovements: { value: inventory, period: 'This Month' },
      purchases: { value: purchases, period: 'This Month' },
      activeEmployees: { value: employees, period: 'Active' }
    }
  }
}

/**
 * Developer/System Integrator Dashboard - API & integrations
 */
async function getDeveloperDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    apiKeys, webhooks, auditLogs
  ] = await Promise.all([
    prisma.apiKey.count({ where: { businessId, isActive: true } }),
    prisma.webhook.count({ where: { businessId, isActive: true } }),
    prisma.auditLog.count({ where: { businessId, createdAt: thisMonth } })
  ])

  return {
    role: 'System Integrator / Developer',
    overview: {
      activeApiKeys: { value: apiKeys, period: 'Active' },
      webhooks: { value: webhooks, period: 'Configured' },
      apiCalls: { value: auditLogs, period: 'This Month' }
    },
    message: 'API documentation available at /api/docs'
  }
}

/**
 * Supplier Dashboard - Supplier portal
 */
async function getSupplierDashboard(businessId, userId) {
  const thisMonth = getMonthRange()

  // Note: Supplier portal needs to be fully implemented
  const [
    purchaseOrders, pendingPayments
  ] = await Promise.all([
    prisma.purchaseOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.purchaseOrder.count({ where: { businessId, status: 'pending' } })
  ])

  return {
    role: 'Supplier',
    overview: {
      purchaseOrders: { value: purchaseOrders, period: 'This Month' },
      pendingPayments: { value: pendingPayments, period: 'Unpaid' }
    },
    message: 'Supplier portal access - limited view'
  }
}

/**
 * Customer Dashboard - Customer portal
 */
async function getCustomerDashboard(businessId, userId) {
  const thisMonth = getMonthRange()

  // Note: Customer portal needs to be fully implemented
  const [
    myOrders, pendingInvoices
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.invoice.count({ where: { businessId, status: 'pending' } })
  ])

  return {
    role: 'Customer',
    overview: {
      myOrders: { value: myOrders, period: 'This Month' },
      pendingInvoices: { value: pendingInvoices, period: 'Unpaid' }
    },
    message: 'Customer portal access - view orders and invoices'
  }
}

/**
 * Default Dashboard - Basic view
 */
async function getDefaultDashboard(businessId) {
  const [
    products, customers, sales
  ] = await Promise.all([
    prisma.product.count({ where: { businessId, isActive: true } }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.saleOrder.count({ where: { businessId } })
  ])

  return {
    role: 'Default User',
    overview: {
      products: { value: products, period: 'Active' },
      customers: { value: customers, period: 'Active' },
      sales: { value: sales, period: 'Total' }
    }
  }
}

module.exports = {
  getRoleDashboard
}
