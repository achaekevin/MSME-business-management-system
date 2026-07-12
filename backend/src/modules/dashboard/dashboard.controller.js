const asyncHandler = require('../../helpers/asyncHandler')
const { success } = require('../../helpers/response')
const service = require('./dashboard.service')
const widgetsService = require('./widgets.service')
const layoutService = require('./layout.service')

/**
 * Get role-based dashboard for current user
 */
const getRoleDashboard = asyncHandler(async (req, res) => {
  const { businessId, userId, user } = req
  
  const dashboardData = await service.getRoleDashboard(businessId, userId, user.role)
  
  success(res, dashboardData, 'Dashboard loaded successfully')
})

/**
 * Get all widgets data
 */
const getAllWidgets = asyncHandler(async (req, res) => {
  const { businessId } = req
  const { dateRange = 'month', startDate, endDate } = req.query
  
  const customDates = startDate && endDate ? { startDate, endDate } : {}
  
  const widgets = await widgetsService.getAllWidgets(businessId, dateRange, customDates)
  
  success(res, widgets, 'Widgets loaded successfully')
})

/**
 * Get specific widget data
 */
const getWidget = asyncHandler(async (req, res) => {
  const { businessId } = req
  const { widgetId } = req.params
  const { dateRange = 'month', startDate, endDate } = req.query
  
  const customDates = startDate && endDate ? { startDate, endDate } : {}
  
  let widgetData
  
  switch (widgetId) {
    case 'todays_sales':
      widgetData = await widgetsService.getTodaysSalesWidget(businessId, dateRange, customDates)
      break
    case 'revenue':
      widgetData = await widgetsService.getRevenueWidget(businessId, dateRange, customDates)
      break
    case 'expenses':
      widgetData = await widgetsService.getExpensesWidget(businessId, dateRange, customDates)
      break
    case 'net_profit':
      widgetData = await widgetsService.getNetProfitWidget(businessId, dateRange, customDates)
      break
    case 'cash_flow':
      widgetData = await widgetsService.getCashFlowWidget(businessId, dateRange, customDates)
      break
    case 'low_stock_alerts':
      widgetData = await widgetsService.getLowStockWidget(businessId)
      break
    case 'pending_invoices':
      widgetData = await widgetsService.getPendingInvoicesWidget(businessId)
      break
    case 'outstanding_payments':
      widgetData = await widgetsService.getOutstandingPaymentsWidget(businessId)
      break
    case 'new_customers':
      widgetData = await widgetsService.getNewCustomersWidget(businessId, dateRange, customDates)
      break
    case 'employee_attendance':
      widgetData = await widgetsService.getEmployeeAttendanceWidget(businessId, dateRange, customDates)
      break
    case 'top_selling_products':
      widgetData = await widgetsService.getTopSellingProductsWidget(businessId, dateRange, customDates)
      break
    case 'sales_trends':
      widgetData = await widgetsService.getSalesTrendsWidget(businessId, dateRange, customDates)
      break
    case 'branch_performance':
      widgetData = await widgetsService.getBranchPerformanceWidget(businessId, dateRange, customDates)
      break
    case 'business_health_score':
      widgetData = await widgetsService.getBusinessHealthScoreWidget(businessId, dateRange, customDates)
      break
    default:
      return res.status(404).json({ success: false, message: 'Widget not found' })
  }
  
  success(res, widgetData, 'Widget loaded successfully')
})

/**
 * Get user's dashboard layout
 */
const getUserLayout = asyncHandler(async (req, res) => {
  const { userId } = req
  
  const layout = await layoutService.getUserLayout(userId)
  
  success(res, layout, 'Layout loaded successfully')
})

/**
 * Save user's dashboard layout
 */
const saveUserLayout = asyncHandler(async (req, res) => {
  const { userId } = req
  const layout = req.body
  
  const savedLayout = await layoutService.saveUserLayout(userId, layout, req)
  
  success(res, savedLayout, 'Layout saved successfully')
})

/**
 * Reset to default layout
 */
const resetUserLayout = asyncHandler(async (req, res) => {
  const { userId } = req
  
  const defaultLayout = await layoutService.resetUserLayout(userId, req)
  
  success(res, defaultLayout, 'Layout reset to default')
})

/**
 * Get available widgets
 */
const getAvailableWidgets = asyncHandler(async (req, res) => {
  const widgets = layoutService.getAvailableWidgets()
  
  success(res, widgets, 'Available widgets retrieved')
})

module.exports = {
  getRoleDashboard,
  getAllWidgets,
  getWidget,
  getUserLayout,
  saveUserLayout,
  resetUserLayout,
  getAvailableWidgets
}
