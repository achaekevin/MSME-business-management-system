const { prisma } = require('../../config/database')
const { ENTERPRISE_ROLES } = require('../../constants/permissions')

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
    
    case ENTERPRISE_ROLES.OPERATIONS_MANAGER:
      return await getOperationsManagerDashboard(businessId)
    
    case ENTERPRISE_ROLES.SALES_MANAGER:
      return await getSalesManagerDashboard(businessId)
    
    case ENTERPRISE_ROLES.CASHIER:
      return await getCashierDashboard(businessId, userId)
    
    case ENTERPRISE_ROLES.INVENTORY_OFFICER:
      return await getInventoryOfficerDashboard(businessId)
    
    case ENTERPRISE_ROLES.PROCUREMENT_OFFICER:
      return await getProcurementOfficerDashboard(businessId)
    
    case ENTERPRISE_ROLES.ACCOUNTANT:
      return await getAccountantDashboard(businessId)
    
    case ENTERPRISE_ROLES.HR_MANAGER:
      return await getHRManagerDashboard(businessId)
    
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

  const [
    revenue, expenses, sales, customers, products,
    recentSales, outstandingInvoices, lowStock, branches
  ] = await Promise.all([
    prisma.saleOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.expense.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { amount: true } }),
    prisma.saleOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.product.count({ where: { businessId, isActive: true } }),
    prisma.saleOrder.findMany({ 
      where: { businessId }, 
      orderBy: { createdAt: 'desc' }, 
      take: 5,
      include: { customer: true }
    }),
    prisma.invoice.aggregate({ 
      where: { businessId, status: { in: ['pending', 'sent'] } }, 
      _count: true, 
      _sum: { balance: true } 
    }),
    prisma.product.count({ 
      where: { 
        businessId,
        inventoryStocks: {
          some: {
            quantity: { lte: 10 }
          }
        }
      } 
    }),
    prisma.branch.count({ where: { businessId, isActive: true } })
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
      totalBranches: branches,
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
      customerName: sale.customer?.name || 'Walk-in Customer',
      total: Number(sale.total),
      status: sale.status,
      createdAt: sale.createdAt
    }))
  }
}

/**
 * Branch Manager Dashboard - Branch operations
 */
async function getBranchManagerDashboard(businessId, userId) {
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { branch: true } 
  })
  const branchId = user.branchId
  const thisMonth = getMonthRange()

  const [
    branchSales, branchRevenue, branchEmployees, branchInventory, recentSales
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, branchId, createdAt: thisMonth } }),
    prisma.saleOrder.aggregate({ where: { businessId, branchId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.user.count({ where: { businessId, branchId, status: 'active' } }),
    prisma.inventoryStock.count({ where: { branchId } }),
    prisma.saleOrder.findMany({
      where: { businessId, branchId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true }
    })
  ])

  return {
    role: 'Branch Manager',
    branch: { id: branchId, name: user.branch?.name },
    overview: {
      sales: { value: branchSales, period: 'This Month' },
      revenue: { value: Number(branchRevenue._sum.total || 0), period: 'This Month' },
      employees: { value: branchEmployees, period: 'Active' },
      inventory: { value: branchInventory, period: 'Stock Items' }
    },
    recentSales: recentSales.map(sale => ({
      orderNumber: sale.orderNumber,
      customerName: sale.customer?.name || 'Walk-in',
      total: Number(sale.total),
      createdAt: sale.createdAt
    }))
  }
}

/**
 * Sales Manager Dashboard - Sales performance
 */
async function getSalesManagerDashboard(businessId) {
  const thisMonth = getMonthRange()
  const today = getTodayRange()

  const [
    totalSales, todaySales, monthRevenue, customers, quotations, topProducts
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.saleOrder.count({ where: { businessId, createdAt: today } }),
    prisma.saleOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.quotation.count({ where: { businessId, status: { in: ['draft', 'sent'] } } }),
    prisma.saleOrderItem.groupBy({ 
      by: ['productId'], 
      where: { saleOrder: { businessId } }, 
      _sum: { quantity: true }, 
      orderBy: { _sum: { quantity: 'desc' } }, 
      take: 5 
    })
  ])

  // Get product names for top products
  const productIds = topProducts.map(p => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true }
  })

  return {
    role: 'Sales Manager',
    overview: {
      totalSales: { value: totalSales, period: 'This Month' },
      todaySales: { value: todaySales, period: 'Today' },
      revenue: { value: Number(monthRevenue._sum.total || 0), period: 'This Month' },
      customers: { value: customers, period: 'Active' },
      pendingQuotations: { value: quotations, period: 'Open' }
    },
    topProducts: topProducts.map(p => {
      const product = products.find(prod => prod.id === p.productId)
      return {
        productId: p.productId,
        productName: product?.name || 'Unknown',
        soldQuantity: Number(p._sum.quantity)
      }
    })
  }
}

/**
 * Cashier Dashboard - Daily transactions and current shift
 */
async function getCashierDashboard(businessId, userId) {
  const today = getTodayRange()

  const [
    todaySales, todayRevenue, recentTransactions, currentShift
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, createdById: userId, createdAt: today } }),
    prisma.saleOrder.aggregate({ where: { businessId, createdById: userId, createdAt: today }, _sum: { total: true } }),
    prisma.saleOrder.findMany({ 
      where: { businessId, createdById: userId }, 
      orderBy: { createdAt: 'desc' }, 
      take: 10,
      include: { customer: true }
    }),
    prisma.posShift.findFirst({
      where: { businessId, userId, status: 'open' },
      include: {
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  ])

  return {
    role: 'Cashier / POS Operator',
    overview: {
      todaySales: { value: todaySales, period: 'Today' },
      todayRevenue: { value: Number(todayRevenue._sum.total || 0), period: 'Today' }
    },
    shift: currentShift ? {
      shiftNumber: currentShift.shiftNumber,
      openedAt: currentShift.openedAt,
      openingCash: Number(currentShift.openingCash),
      transactionCount: currentShift.transactions.length
    } : null,
    recentTransactions: recentTransactions.map(t => ({
      orderNumber: t.orderNumber,
      customerName: t.customer?.name || 'Walk-in',
      total: Number(t.total),
      status: t.status,
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
    totalProducts, lowStock, stockTransactions, recentTransactions
  ] = await Promise.all([
    prisma.product.count({ where: { businessId, isActive: true } }),
    prisma.product.count({ 
      where: { 
        businessId,
        inventoryStocks: {
          some: {
            quantity: { lte: 10 }
          }
        }
      } 
    }),
    prisma.inventoryTransaction.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.inventoryTransaction.findMany({ 
      where: { businessId }, 
      orderBy: { createdAt: 'desc' }, 
      take: 10, 
      include: { product: { select: { name: true, sku: true } } }
    })
  ])

  return {
    role: 'Inventory Officer',
    overview: {
      totalProducts: { value: totalProducts, period: 'Active' },
      lowStock: { value: lowStock, period: 'Needs Attention' },
      transactions: { value: stockTransactions, period: 'This Month' }
    },
    recentTransactions: recentTransactions.map(t => ({
      type: t.type,
      productName: t.product?.name || 'Unknown',
      productSku: t.product?.sku || 'N/A',
      quantity: Number(t.quantity),
      reason: t.reason,
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
    purchaseOrders, pendingOrders, totalSpend, suppliers, recentOrders
  ] = await Promise.all([
    prisma.purchaseOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.purchaseOrder.count({ where: { businessId, status: { in: ['draft', 'sent'] } } }),
    prisma.purchaseOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.supplier.count({ where: { businessId, isActive: true } }),
    prisma.purchaseOrder.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { supplier: { select: { name: true } } }
    })
  ])

  return {
    role: 'Procurement Officer',
    overview: {
      purchaseOrders: { value: purchaseOrders, period: 'This Month' },
      pendingOrders: { value: pendingOrders, period: 'Awaiting' },
      totalSpend: { value: Number(totalSpend._sum.total || 0), period: 'This Month' },
      suppliers: { value: suppliers, period: 'Active' }
    },
    recentOrders: recentOrders.map(order => ({
      orderNumber: order.orderNumber,
      supplierName: order.supplier?.name || 'Unknown',
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt
    }))
  }
}

/**
 * Accountant Dashboard - Financial records
 */
async function getAccountantDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    pendingInvoices, paidInvoices, expenses, revenue, totalInvoices, totalExpenses
  ] = await Promise.all([
    prisma.invoice.aggregate({ 
      where: { businessId, status: { in: ['pending', 'sent'] } }, 
      _count: true,
      _sum: { balance: true } 
    }),
    prisma.invoice.count({ where: { businessId, status: 'paid', paidAt: thisMonth } }),
    prisma.expense.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { amount: true } }),
    prisma.saleOrder.aggregate({ where: { businessId, createdAt: thisMonth }, _sum: { total: true } }),
    prisma.invoice.findMany({
      where: { businessId, status: { in: ['pending', 'sent'] } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { customer: { select: { name: true } } }
    }),
    prisma.expense.findMany({
      where: { businessId, createdAt: thisMonth },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  const netProfit = Number(revenue._sum.total || 0) - Number(expenses._sum.amount || 0)

  return {
    role: 'Accountant',
    overview: {
      pendingInvoices: { 
        count: pendingInvoices._count,
        amount: Number(pendingInvoices._sum.balance || 0),
        period: 'Outstanding'
      },
      paidInvoices: { value: paidInvoices, period: 'This Month' },
      expenses: { value: Number(expenses._sum.amount || 0), period: 'This Month' },
      revenue: { value: Number(revenue._sum.total || 0), period: 'This Month' },
      netProfit: { value: netProfit, period: 'This Month' }
    },
    pendingInvoicesList: totalInvoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name || 'Unknown',
      balance: Number(inv.balance),
      dueDate: inv.dueDate
    })),
    recentExpenses: totalExpenses.map(exp => ({
      category: exp.category,
      amount: Number(exp.amount),
      description: exp.description,
      createdAt: exp.createdAt
    }))
  }
}

/**
 * HR Manager Dashboard - Human resources
 */
async function getHRManagerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    totalEmployees, activeEmployees, newHires, recentHires, departments
  ] = await Promise.all([
    prisma.user.count({ where: { businessId } }),
    prisma.user.count({ where: { businessId, status: 'active' } }),
    prisma.user.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.user.findMany({ 
      where: { businessId }, 
      orderBy: { createdAt: 'desc' }, 
      take: 5, 
      select: { 
        id: true,
        name: true, 
        email: true, 
        role: { select: { displayName: true } },
        createdAt: true 
      } 
    }),
    prisma.department.count({ where: { businessId } })
  ])

  return {
    role: 'HR Manager',
    overview: {
      totalEmployees: { value: totalEmployees, period: 'All' },
      activeEmployees: { value: activeEmployees, period: 'Active' },
      newHires: { value: newHires, period: 'This Month' },
      departments: { value: departments, period: 'Total' }
    },
    recentHires: recentHires.map(h => ({ 
      name: h.name, 
      email: h.email,
      role: h.role?.displayName || 'N/A',
      joinedAt: h.createdAt 
    }))
  }
}

/**
 * Operations Manager Dashboard - Overall operations
 */
async function getOperationsManagerDashboard(businessId) {
  const thisMonth = getMonthRange()

  const [
    sales, inventoryTransactions, purchases, employees, warehouses, branches
  ] = await Promise.all([
    prisma.saleOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.inventoryTransaction.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.purchaseOrder.count({ where: { businessId, createdAt: thisMonth } }),
    prisma.user.count({ where: { businessId, status: 'active' } }),
    prisma.warehouse.count({ where: { businessId, isActive: true } }),
    prisma.branch.count({ where: { businessId, isActive: true } })
  ])

  return {
    role: 'Operations Manager',
    overview: {
      sales: { value: sales, period: 'This Month' },
      inventoryMovements: { value: inventoryTransactions, period: 'This Month' },
      purchases: { value: purchases, period: 'This Month' },
      activeEmployees: { value: employees, period: 'Active' },
      warehouses: { value: warehouses, period: 'Active' },
      branches: { value: branches, period: 'Active' }
    }
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
