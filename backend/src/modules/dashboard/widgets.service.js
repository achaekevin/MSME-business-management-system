const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Get date range helper
 */
function getDateRange(range = 'today') {
  const now = new Date()
  let startDate, endDate = new Date()
  
  switch (range) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0))
      endDate = new Date(now.setHours(23, 59, 59, 999))
      break
    case 'yesterday':
      startDate = new Date(now.setDate(now.getDate() - 1))
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case 'custom':
      // Will be provided in params
      break
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0))
  }
  
  return { startDate, endDate }
}

/**
 * Widget: Today's Sales
 */
async function getTodaysSalesWidget(businessId, dateRange = 'today', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  const sales = await prisma.saleOrder.aggregate({
    where: {
      businessId,
      createdAt: { gte: startDate, lte: endDate }
    },
    _sum: { total: true },
    _count: true
  })
  
  return {
    widget: 'todays_sales',
    title: "Today's Sales",
    value: Number(sales._sum.total || 0),
    count: sales._count,
    dateRange,
    icon: 'shopping-cart',
    color: 'blue'
  }
}

/**
 * Widget: Revenue
 */
async function getRevenueWidget(businessId, dateRange = 'month', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  const revenue = await prisma.saleOrder.aggregate({
    where: {
      businessId,
      createdAt: { gte: startDate, lte: endDate }
    },
    _sum: { total: true }
  })
  
  // Get previous period for comparison
  const periodLength = endDate - startDate
  const prevStart = new Date(startDate.getTime() - periodLength)
  const prevEnd = startDate
  
  const prevRevenue = await prisma.saleOrder.aggregate({
    where: {
      businessId,
      createdAt: { gte: prevStart, lt: prevEnd }
    },
    _sum: { total: true }
  })
  
  const current = Number(revenue._sum.total || 0)
  const previous = Number(prevRevenue._sum.total || 0)
  const change = previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0
  
  return {
    widget: 'revenue',
    title: 'Revenue',
    value: current,
    previousValue: previous,
    change: parseFloat(change),
    trend: change >= 0 ? 'up' : 'down',
    dateRange,
    icon: 'trending-up',
    color: 'green'
  }
}

/**
 * Widget: Expenses
 */
async function getExpensesWidget(businessId, dateRange = 'month', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  const expenses = await prisma.expense.aggregate({
    where: {
      businessId,
      createdAt: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  })
  
  const periodLength = endDate - startDate
  const prevStart = new Date(startDate.getTime() - periodLength)
  const prevEnd = startDate
  
  const prevExpenses = await prisma.expense.aggregate({
    where: {
      businessId,
      createdAt: { gte: prevStart, lt: prevEnd }
    },
    _sum: { amount: true }
  })
  
  const current = Number(expenses._sum.amount || 0)
  const previous = Number(prevExpenses._sum.amount || 0)
  const change = previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0
  
  return {
    widget: 'expenses',
    title: 'Expenses',
    value: current,
    previousValue: previous,
    change: parseFloat(change),
    trend: change >= 0 ? 'up' : 'down',
    dateRange,
    icon: 'dollar-sign',
    color: 'red'
  }
}

/**
 * Widget: Net Profit
 */
async function getNetProfitWidget(businessId, dateRange = 'month', customDates = {}) {
  const revenue = await getRevenueWidget(businessId, dateRange, customDates)
  const expenses = await getExpensesWidget(businessId, dateRange, customDates)
  
  const profit = revenue.value - expenses.value
  const prevProfit = revenue.previousValue - expenses.previousValue
  const change = prevProfit > 0 ? ((profit - prevProfit) / prevProfit * 100).toFixed(1) : 0
  
  return {
    widget: 'net_profit',
    title: 'Net Profit',
    value: profit,
    previousValue: prevProfit,
    change: parseFloat(change),
    trend: change >= 0 ? 'up' : 'down',
    dateRange,
    icon: 'pie-chart',
    color: profit >= 0 ? 'green' : 'red'
  }
}

/**
 * Widget: Cash Flow
 */
async function getCashFlowWidget(businessId, dateRange = 'month', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  const [income, outflow] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        businessId,
        type: 'income',
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: {
        businessId,
        type: 'expense',
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })
  ])
  
  const cashFlow = Number(income._sum.amount || 0) - Number(outflow._sum.amount || 0)
  
  return {
    widget: 'cash_flow',
    title: 'Cash Flow',
    value: cashFlow,
    income: Number(income._sum.amount || 0),
    outflow: Number(outflow._sum.amount || 0),
    trend: cashFlow >= 0 ? 'positive' : 'negative',
    dateRange,
    icon: 'activity',
    color: cashFlow >= 0 ? 'green' : 'red'
  }
}

/**
 * Widget: Low Stock Alerts
 */
async function getLowStockWidget(businessId) {
  const lowStockProducts = await prisma.product.findMany({
    where: {
      businessId,
      isActive: true,
      stockQuantity: { lte: prisma.product.fields.reorderLevel }
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      reorderLevel: true
    },
    take: 10,
    orderBy: { stockQuantity: 'asc' }
  })
  
  return {
    widget: 'low_stock_alerts',
    title: 'Low Stock Alerts',
    count: lowStockProducts.length,
    items: lowStockProducts,
    icon: 'alert-triangle',
    color: 'orange'
  }
}

/**
 * Widget: Pending Invoices
 */
async function getPendingInvoicesWidget(businessId) {
  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: 'pending'
    },
    select: {
      id: true,
      invoiceNumber: true,
      customer: { select: { name: true } },
      total: true,
      balance: true,
      dueDate: true
    },
    take: 10,
    orderBy: { dueDate: 'asc' }
  })
  
  const totalAmount = await prisma.invoice.aggregate({
    where: {
      businessId,
      status: 'pending'
    },
    _sum: { balance: true },
    _count: true
  })
  
  return {
    widget: 'pending_invoices',
    title: 'Pending Invoices',
    count: totalAmount._count,
    totalAmount: Number(totalAmount._sum.balance || 0),
    items: pendingInvoices.map(inv => ({
      ...inv,
      total: Number(inv.total),
      balance: Number(inv.balance)
    })),
    icon: 'file-text',
    color: 'yellow'
  }
}

/**
 * Widget: Outstanding Payments
 */
async function getOutstandingPaymentsWidget(businessId) {
  const outstanding = await prisma.purchaseOrder.aggregate({
    where: {
      businessId,
      status: 'pending'
    },
    _sum: { total: true },
    _count: true
  })
  
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: 'pending',
      dueDate: { lt: new Date() }
    },
    select: {
      id: true,
      invoiceNumber: true,
      customer: { select: { name: true } },
      balance: true,
      dueDate: true
    },
    take: 10,
    orderBy: { dueDate: 'asc' }
  })
  
  return {
    widget: 'outstanding_payments',
    title: 'Outstanding Payments',
    count: outstanding._count,
    totalAmount: Number(outstanding._sum.total || 0),
    overdueInvoices: overdueInvoices.map(inv => ({
      ...inv,
      balance: Number(inv.balance)
    })),
    icon: 'credit-card',
    color: 'red'
  }
}

/**
 * Widget: New Customers
 */
async function getNewCustomersWidget(businessId, dateRange = 'month', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  const newCustomers = await prisma.customer.findMany({
    where: {
      businessId,
      createdAt: { gte: startDate, lte: endDate }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })
  
  const count = await prisma.customer.count({
    where: {
      businessId,
      createdAt: { gte: startDate, lte: endDate }
    }
  })
  
  return {
    widget: 'new_customers',
    title: 'New Customers',
    count,
    items: newCustomers,
    dateRange,
    icon: 'users',
    color: 'blue'
  }
}

/**
 * Widget: Employee Attendance
 */
async function getEmployeeAttendanceWidget(businessId, dateRange = 'today', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  const totalEmployees = await prisma.user.count({
    where: {
      businessId,
      status: 'active'
    }
  })
  
  // Note: Attendance module needs to be implemented
  // For now, return placeholder data
  return {
    widget: 'employee_attendance',
    title: 'Employee Attendance',
    totalEmployees,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    attendanceRate: 0,
    dateRange,
    icon: 'user-check',
    color: 'purple',
    note: 'Attendance module not yet implemented'
  }
}

/**
 * Widget: Top Selling Products
 */
async function getTopSellingProductsWidget(businessId, dateRange = 'month', customDates = {}, limit = 10) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  const topProducts = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: {
      saleOrder: {
        businessId,
        createdAt: { gte: startDate, lte: endDate }
      }
    },
    _sum: {
      quantity: true,
      total: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: limit
  })
  
  // Fetch product details
  const productIds = topProducts.map(p => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      price: true
    }
  })
  
  const productsMap = products.reduce((acc, p) => {
    acc[p.id] = p
    return acc
  }, {})
  
  const items = topProducts.map(tp => ({
    product: productsMap[tp.productId],
    quantitySold: tp._sum.quantity,
    revenue: Number(tp._sum.total || 0)
  }))
  
  return {
    widget: 'top_selling_products',
    title: 'Top Selling Products',
    items,
    dateRange,
    icon: 'trending-up',
    color: 'green'
  }
}

/**
 * Widget: Sales Trends (Chart Data)
 */
async function getSalesTrendsWidget(businessId, dateRange = 'month', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  // Group sales by day
  const sales = await prisma.saleOrder.findMany({
    where: {
      businessId,
      createdAt: { gte: startDate, lte: endDate }
    },
    select: {
      createdAt: true,
      total: true
    },
    orderBy: { createdAt: 'asc' }
  })
  
  // Group by date
  const salesByDate = sales.reduce((acc, sale) => {
    const date = sale.createdAt.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, total: 0, count: 0 }
    }
    acc[date].total += Number(sale.total)
    acc[date].count += 1
    return acc
  }, {})
  
  const chartData = Object.values(salesByDate)
  
  return {
    widget: 'sales_trends',
    title: 'Sales Trends',
    chartData,
    dateRange,
    icon: 'bar-chart',
    color: 'blue'
  }
}

/**
 * Widget: Branch Performance
 */
async function getBranchPerformanceWidget(businessId, dateRange = 'month', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  const branches = await prisma.branch.findMany({
    where: { businessId, isActive: true },
    select: {
      id: true,
      name: true,
      code: true
    }
  })
  
  const branchPerformance = await Promise.all(
    branches.map(async (branch) => {
      const [sales, employees] = await Promise.all([
        prisma.saleOrder.aggregate({
          where: {
            businessId,
            branchId: branch.id,
            createdAt: { gte: startDate, lte: endDate }
          },
          _sum: { total: true },
          _count: true
        }),
        prisma.user.count({
          where: {
            businessId,
            branchId: branch.id,
            status: 'active'
          }
        })
      ])
      
      return {
        branch,
        revenue: Number(sales._sum.total || 0),
        salesCount: sales._count,
        employees
      }
    })
  )
  
  // Sort by revenue
  branchPerformance.sort((a, b) => b.revenue - a.revenue)
  
  return {
    widget: 'branch_performance',
    title: 'Branch Performance',
    items: branchPerformance,
    dateRange,
    icon: 'map-pin',
    color: 'purple'
  }
}

/**
 * Widget: Business Health Score
 */
async function getBusinessHealthScoreWidget(businessId, dateRange = 'month', customDates = {}) {
  const { startDate, endDate } = customDates.startDate 
    ? { startDate: new Date(customDates.startDate), endDate: new Date(customDates.endDate) }
    : getDateRange(dateRange)
  
  // Calculate various metrics
  const [revenue, expenses, customers, products, sales, invoices] = await Promise.all([
    prisma.saleOrder.aggregate({
      where: { businessId, createdAt: { gte: startDate, lte: endDate } },
      _sum: { total: true }
    }),
    prisma.expense.aggregate({
      where: { businessId, createdAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true }
    }),
    prisma.customer.count({
      where: { businessId, isActive: true }
    }),
    prisma.product.count({
      where: { businessId, isActive: true }
    }),
    prisma.saleOrder.count({
      where: { businessId, createdAt: { gte: startDate, lte: endDate } }
    }),
    prisma.invoice.aggregate({
      where: { businessId, status: 'pending' },
      _sum: { balance: true },
      _count: true
    })
  ])
  
  // Calculate health score (0-100)
  let score = 50 // Base score
  
  // Revenue factor (max 25 points)
  const revenueAmount = Number(revenue._sum.total || 0)
  if (revenueAmount > 0) score += Math.min(25, (revenueAmount / 100000) * 25)
  
  // Profit margin factor (max 20 points)
  const expenseAmount = Number(expenses._sum.amount || 0)
  const profitMargin = revenueAmount > 0 ? ((revenueAmount - expenseAmount) / revenueAmount) * 100 : 0
  if (profitMargin > 0) score += Math.min(20, profitMargin)
  
  // Customer growth (max 15 points)
  if (customers > 10) score += Math.min(15, (customers / 100) * 15)
  
  // Product variety (max 10 points)
  if (products > 5) score += Math.min(10, (products / 50) * 10)
  
  // Sales activity (max 10 points)
  if (sales > 0) score += Math.min(10, (sales / 100) * 10)
  
  // Outstanding invoices (penalty)
  const outstandingRatio = revenueAmount > 0 ? (Number(invoices._sum.balance || 0) / revenueAmount) : 0
  if (outstandingRatio > 0.3) score -= 10
  
  score = Math.max(0, Math.min(100, score))
  
  let status = 'poor'
  let statusColor = 'red'
  if (score >= 80) {
    status = 'excellent'
    statusColor = 'green'
  } else if (score >= 60) {
    status = 'good'
    statusColor = 'blue'
  } else if (score >= 40) {
    status = 'fair'
    statusColor = 'yellow'
  }
  
  return {
    widget: 'business_health_score',
    title: 'Business Health Score',
    score: Math.round(score),
    status,
    statusColor,
    metrics: {
      revenue: revenueAmount,
      profitMargin: Math.round(profitMargin),
      customers,
      products,
      sales
    },
    dateRange,
    icon: 'heart',
    color: statusColor
  }
}

/**
 * Get all widgets data
 */
async function getAllWidgets(businessId, dateRange = 'month', customDates = {}) {
  const [
    todaysSales,
    revenue,
    expenses,
    netProfit,
    cashFlow,
    lowStock,
    pendingInvoices,
    outstandingPayments,
    newCustomers,
    employeeAttendance,
    topSellingProducts,
    salesTrends,
    branchPerformance,
    businessHealth
  ] = await Promise.all([
    getTodaysSalesWidget(businessId, 'today'),
    getRevenueWidget(businessId, dateRange, customDates),
    getExpensesWidget(businessId, dateRange, customDates),
    getNetProfitWidget(businessId, dateRange, customDates),
    getCashFlowWidget(businessId, dateRange, customDates),
    getLowStockWidget(businessId),
    getPendingInvoicesWidget(businessId),
    getOutstandingPaymentsWidget(businessId),
    getNewCustomersWidget(businessId, dateRange, customDates),
    getEmployeeAttendanceWidget(businessId, dateRange, customDates),
    getTopSellingProductsWidget(businessId, dateRange, customDates),
    getSalesTrendsWidget(businessId, dateRange, customDates),
    getBranchPerformanceWidget(businessId, dateRange, customDates),
    getBusinessHealthScoreWidget(businessId, dateRange, customDates)
  ])
  
  return {
    todaysSales,
    revenue,
    expenses,
    netProfit,
    cashFlow,
    lowStock,
    pendingInvoices,
    outstandingPayments,
    newCustomers,
    employeeAttendance,
    topSellingProducts,
    salesTrends,
    branchPerformance,
    businessHealth
  }
}

module.exports = {
  getTodaysSalesWidget,
  getRevenueWidget,
  getExpensesWidget,
  getNetProfitWidget,
  getCashFlowWidget,
  getLowStockWidget,
  getPendingInvoicesWidget,
  getOutstandingPaymentsWidget,
  getNewCustomersWidget,
  getEmployeeAttendanceWidget,
  getTopSellingProductsWidget,
  getSalesTrendsWidget,
  getBranchPerformanceWidget,
  getBusinessHealthScoreWidget,
  getAllWidgets
}
