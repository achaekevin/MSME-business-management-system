const { PrismaClient } = require('@prisma/client')
const { ApiError } = require('../../helpers/response')

const prisma = new PrismaClient()

/**
 * Get user's dashboard layout
 */
async function getUserLayout(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dashboardLayout: true }
  })
  
  if (!user) throw ApiError.notFound('User not found')
  
  // Return default layout if user hasn't customized
  if (!user.dashboardLayout) {
    return getDefaultLayout()
  }
  
  return user.dashboardLayout
}

/**
 * Save user's dashboard layout
 */
async function saveUserLayout(userId, layout, req) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) throw ApiError.notFound('User not found')
  
  // Validate layout structure
  validateLayout(layout)
  
  await prisma.user.update({
    where: { id: userId },
    data: { dashboardLayout: layout }
  })
  
  req?.audit?.('dashboard.layout_saved', 'User', userId, { layout })
  
  return layout
}

/**
 * Reset to default layout
 */
async function resetUserLayout(userId, req) {
  const defaultLayout = getDefaultLayout()
  
  await prisma.user.update({
    where: { id: userId },
    data: { dashboardLayout: defaultLayout }
  })
  
  req?.audit?.('dashboard.layout_reset', 'User', userId)
  
  return defaultLayout
}

/**
 * Get default dashboard layout
 */
function getDefaultLayout() {
  return {
    version: '1.0',
    widgets: [
      // Row 1 - Key metrics
      {
        id: 'todays_sales',
        type: 'metric',
        position: { row: 0, col: 0, width: 3, height: 1 },
        visible: true,
        dateRange: 'today'
      },
      {
        id: 'revenue',
        type: 'metric',
        position: { row: 0, col: 3, width: 3, height: 1 },
        visible: true,
        dateRange: 'month'
      },
      {
        id: 'expenses',
        type: 'metric',
        position: { row: 0, col: 6, width: 3, height: 1 },
        visible: true,
        dateRange: 'month'
      },
      {
        id: 'net_profit',
        type: 'metric',
        position: { row: 0, col: 9, width: 3, height: 1 },
        visible: true,
        dateRange: 'month'
      },
      
      // Row 2 - Charts
      {
        id: 'sales_trends',
        type: 'chart',
        position: { row: 1, col: 0, width: 8, height: 2 },
        visible: true,
        dateRange: 'month'
      },
      {
        id: 'business_health_score',
        type: 'score',
        position: { row: 1, col: 8, width: 4, height: 2 },
        visible: true,
        dateRange: 'month'
      },
      
      // Row 3 - Lists and alerts
      {
        id: 'top_selling_products',
        type: 'list',
        position: { row: 3, col: 0, width: 4, height: 2 },
        visible: true,
        dateRange: 'month'
      },
      {
        id: 'low_stock_alerts',
        type: 'alert',
        position: { row: 3, col: 4, width: 4, height: 2 },
        visible: true
      },
      {
        id: 'pending_invoices',
        type: 'list',
        position: { row: 3, col: 8, width: 4, height: 2 },
        visible: true
      },
      
      // Row 4 - Additional metrics
      {
        id: 'cash_flow',
        type: 'metric',
        position: { row: 5, col: 0, width: 3, height: 1 },
        visible: true,
        dateRange: 'month'
      },
      {
        id: 'new_customers',
        type: 'list',
        position: { row: 5, col: 3, width: 3, height: 1 },
        visible: true,
        dateRange: 'month'
      },
      {
        id: 'outstanding_payments',
        type: 'alert',
        position: { row: 5, col: 6, width: 3, height: 1 },
        visible: true
      },
      {
        id: 'employee_attendance',
        type: 'metric',
        position: { row: 5, col: 9, width: 3, height: 1 },
        visible: true,
        dateRange: 'today'
      },
      
      // Row 5 - Branch performance
      {
        id: 'branch_performance',
        type: 'chart',
        position: { row: 6, col: 0, width: 12, height: 2 },
        visible: true,
        dateRange: 'month'
      }
    ],
    preferences: {
      theme: 'light',
      compactMode: false,
      autoRefresh: true,
      refreshInterval: 300000 // 5 minutes
    }
  }
}

/**
 * Validate layout structure
 */
function validateLayout(layout) {
  if (!layout || typeof layout !== 'object') {
    throw ApiError.badRequest('Invalid layout structure')
  }
  
  if (!Array.isArray(layout.widgets)) {
    throw ApiError.badRequest('Layout must contain widgets array')
  }
  
  // Validate each widget
  for (const widget of layout.widgets) {
    if (!widget.id || !widget.type || !widget.position) {
      throw ApiError.badRequest('Each widget must have id, type, and position')
    }
    
    const pos = widget.position
    if (typeof pos.row !== 'number' || typeof pos.col !== 'number' || 
        typeof pos.width !== 'number' || typeof pos.height !== 'number') {
      throw ApiError.badRequest('Widget position must have row, col, width, and height as numbers')
    }
  }
  
  return true
}

/**
 * Get available widget types
 */
function getAvailableWidgets() {
  return [
    {
      id: 'todays_sales',
      name: "Today's Sales",
      type: 'metric',
      category: 'sales',
      description: 'Shows total sales for today',
      defaultSize: { width: 3, height: 1 },
      supportedDateRanges: ['today', 'yesterday', 'week'],
      icon: 'shopping-cart'
    },
    {
      id: 'revenue',
      name: 'Revenue',
      type: 'metric',
      category: 'finance',
      description: 'Total revenue with trend comparison',
      defaultSize: { width: 3, height: 1 },
      supportedDateRanges: ['today', 'week', 'month', 'quarter', 'year'],
      icon: 'trending-up'
    },
    {
      id: 'expenses',
      name: 'Expenses',
      type: 'metric',
      category: 'finance',
      description: 'Total expenses with trend comparison',
      defaultSize: { width: 3, height: 1 },
      supportedDateRanges: ['today', 'week', 'month', 'quarter', 'year'],
      icon: 'dollar-sign'
    },
    {
      id: 'net_profit',
      name: 'Net Profit',
      type: 'metric',
      category: 'finance',
      description: 'Revenue minus expenses',
      defaultSize: { width: 3, height: 1 },
      supportedDateRanges: ['today', 'week', 'month', 'quarter', 'year'],
      icon: 'pie-chart'
    },
    {
      id: 'cash_flow',
      name: 'Cash Flow',
      type: 'metric',
      category: 'finance',
      description: 'Income vs outflow',
      defaultSize: { width: 3, height: 1 },
      supportedDateRanges: ['today', 'week', 'month', 'quarter', 'year'],
      icon: 'activity'
    },
    {
      id: 'low_stock_alerts',
      name: 'Low Stock Alerts',
      type: 'alert',
      category: 'inventory',
      description: 'Products below reorder level',
      defaultSize: { width: 4, height: 2 },
      supportedDateRanges: [],
      icon: 'alert-triangle'
    },
    {
      id: 'pending_invoices',
      name: 'Pending Invoices',
      type: 'list',
      category: 'finance',
      description: 'Unpaid invoices',
      defaultSize: { width: 4, height: 2 },
      supportedDateRanges: [],
      icon: 'file-text'
    },
    {
      id: 'outstanding_payments',
      name: 'Outstanding Payments',
      type: 'alert',
      category: 'finance',
      description: 'Pending and overdue payments',
      defaultSize: { width: 4, height: 2 },
      supportedDateRanges: [],
      icon: 'credit-card'
    },
    {
      id: 'new_customers',
      name: 'New Customers',
      type: 'list',
      category: 'customers',
      description: 'Recently added customers',
      defaultSize: { width: 4, height: 2 },
      supportedDateRanges: ['today', 'week', 'month'],
      icon: 'users'
    },
    {
      id: 'employee_attendance',
      name: 'Employee Attendance',
      type: 'metric',
      category: 'hr',
      description: 'Daily attendance summary',
      defaultSize: { width: 3, height: 1 },
      supportedDateRanges: ['today', 'week', 'month'],
      icon: 'user-check'
    },
    {
      id: 'top_selling_products',
      name: 'Top Selling Products',
      type: 'list',
      category: 'sales',
      description: 'Best performing products',
      defaultSize: { width: 4, height: 2 },
      supportedDateRanges: ['today', 'week', 'month', 'quarter', 'year'],
      icon: 'trending-up'
    },
    {
      id: 'sales_trends',
      name: 'Sales Trends',
      type: 'chart',
      category: 'sales',
      description: 'Sales over time chart',
      defaultSize: { width: 8, height: 2 },
      supportedDateRanges: ['week', 'month', 'quarter', 'year'],
      icon: 'bar-chart'
    },
    {
      id: 'branch_performance',
      name: 'Branch Performance',
      type: 'chart',
      category: 'operations',
      description: 'Compare branch performance',
      defaultSize: { width: 12, height: 2 },
      supportedDateRanges: ['week', 'month', 'quarter', 'year'],
      icon: 'map-pin'
    },
    {
      id: 'business_health_score',
      name: 'Business Health Score',
      type: 'score',
      category: 'analytics',
      description: 'Overall business health indicator',
      defaultSize: { width: 4, height: 2 },
      supportedDateRanges: ['week', 'month', 'quarter', 'year'],
      icon: 'heart'
    }
  ]
}

module.exports = {
  getUserLayout,
  saveUserLayout,
  resetUserLayout,
  getDefaultLayout,
  getAvailableWidgets
}
