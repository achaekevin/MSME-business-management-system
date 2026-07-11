const repo = require('./businesses.repository')
const { ApiError } = require('../../helpers/response')
const { invalidateTenantCache } = require('../../config/redis')
const { uploadBuffer } = require('../../storage/storage.service')

async function getProfile(businessId) {
  const business = await repo.findById(businessId)
  if (!business) throw ApiError.notFound('Business not found')
  return business
}

async function updateProfile(businessId, data, req) {
  const { businessId: _b, ...rest } = data
  // Prevent slug changes once set
  delete rest.slug

  const updated = await repo.update(businessId, rest)
  await invalidateTenantCache(businessId, 'business')
  req?.audit?.('business.updated', 'Business', businessId, { changes: data })
  return updated
}

async function uploadLogo(businessId, file, req) {
  const ext = file.mimetype.split('/')[1]
  const objectName = `businesses/${businessId}/logo.${ext}`
  const url = await uploadBuffer(objectName, file.buffer, file.mimetype)

  await repo.update(businessId, { logo: url })
  await invalidateTenantCache(businessId, 'business')
  req?.audit?.('business.logo_updated', 'Business', businessId)
  return { logoUrl: url }
}

async function getSettings(businessId) {
  let settings = await repo.getSettings(businessId)
  if (!settings) {
    settings = await repo.createSettings(businessId)
  }
  return settings
}

async function updateSettings(businessId, data, req) {
  const settings = await repo.upsertSettings(businessId, data)
  await invalidateTenantCache(businessId, 'settings')
  req?.audit?.('business.settings_updated', 'BusinessSetting', businessId, { changes: data })
  return settings
}

async function getDashboardStats(businessId) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonthFilter = { gte: startOfMonth }
  const lastMonthFilter = { gte: startOfLastMonth, lte: endOfLastMonth }

  const [
    revenueThisMonth, revenueLast,
    expensesThisMonth, expensesLast,
    salesCountThisMonth, salesCountLast,
    newCustomersThisMonth, newCustomersLast,
    outstandingInvoices, lowStockCount,
    totalCustomers, totalProducts
  ] = await Promise.all([
    repo.countSales(businessId, thisMonthFilter),
    repo.countSales(businessId, lastMonthFilter),
    repo.sumExpenses(businessId, thisMonthFilter),
    repo.sumExpenses(businessId, lastMonthFilter),
    repo.countSaleOrders(businessId, thisMonthFilter),
    repo.countSaleOrders(businessId, lastMonthFilter),
    repo.countNewCustomers(businessId, thisMonthFilter),
    repo.countNewCustomers(businessId, lastMonthFilter),
    repo.getOutstandingInvoices(businessId),
    repo.countLowStock(businessId),
    repo.countActiveCustomers(businessId),
    repo.countActiveProducts(businessId)
  ])

  const rev = Number(revenueThisMonth._sum.total || 0)
  const revPrev = Number(revenueLast._sum.total || 0)
  const exp = Number(expensesThisMonth._sum.amount || 0)
  const expPrev = Number(expensesLast._sum.amount || 0)

  function pctChange(curr, prev) {
    if (!prev) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  return {
    revenue: { value: rev, change: pctChange(rev, revPrev), period: 'vs last month' },
    expenses: { value: exp, change: pctChange(exp, expPrev), period: 'vs last month' },
    profit: { value: rev - exp, change: pctChange(rev - exp, revPrev - expPrev), period: 'vs last month' },
    sales: { value: salesCountThisMonth, change: pctChange(salesCountThisMonth, salesCountLast), period: 'vs last month' },
    newCustomers: { value: newCustomersThisMonth, change: pctChange(newCustomersThisMonth, newCustomersLast), period: 'vs last month' },
    outstandingInvoices: { count: outstandingInvoices._count, amount: Number(outstandingInvoices._sum.balance || 0) },
    lowStockProducts: lowStockCount,
    totalCustomers,
    totalProducts
  }
}

// Branding
async function getBranding(businessId) {
  const settings = await getSettings(businessId)
  return {
    brandColor: settings.brandColor,
    accentColor: settings.accentColor,
    fontFamily: settings.fontFamily,
    customCss: settings.customCss
  }
}

async function updateBranding(businessId, data, req) {
  const settings = await repo.upsertSettings(businessId, data)
  await invalidateTenantCache(businessId, 'settings')
  req?.audit?.('business.branding_updated', 'BusinessSetting', businessId, { changes: data })
  return {
    brandColor: settings.brandColor,
    accentColor: settings.accentColor,
    fontFamily: settings.fontFamily,
    customCss: settings.customCss
  }
}

// Tax settings
async function getTaxSettings(businessId) {
  const settings = await getSettings(businessId)
  return {
    taxRate: settings.taxRate,
    taxInclusive: settings.taxInclusive,
    taxLabel: settings.taxLabel,
    multiTaxEnabled: settings.multiTaxEnabled,
    taxRegions: settings.taxRegions
  }
}

async function updateTaxSettings(businessId, data, req) {
  const settings = await repo.upsertSettings(businessId, data)
  await invalidateTenantCache(businessId, 'settings')
  req?.audit?.('business.tax_settings_updated', 'BusinessSetting', businessId, { changes: data })
  return {
    taxRate: settings.taxRate,
    taxInclusive: settings.taxInclusive,
    taxLabel: settings.taxLabel,
    multiTaxEnabled: settings.multiTaxEnabled,
    taxRegions: settings.taxRegions
  }
}

// Business hours
async function getBusinessHours(businessId) {
  const settings = await getSettings(businessId)
  return {
    businessHours: settings.businessHours || getDefaultBusinessHours(),
    timezone: settings.timezone || 'UTC'
  }
}

async function updateBusinessHours(businessId, data, req) {
  const settings = await repo.upsertSettings(businessId, { businessHours: data, timezone: data.timezone })
  await invalidateTenantCache(businessId, 'settings')
  req?.audit?.('business.hours_updated', 'BusinessSetting', businessId, { changes: data })
  return {
    businessHours: settings.businessHours,
    timezone: settings.timezone
  }
}

function getDefaultBusinessHours() {
  const defaultDay = { open: '09:00', close: '17:00', closed: false }
  return {
    monday: defaultDay,
    tuesday: defaultDay,
    wednesday: defaultDay,
    thursday: defaultDay,
    friday: defaultDay,
    saturday: { open: '09:00', close: '13:00', closed: false },
    sunday: { open: '', close: '', closed: true }
  }
}

// Holidays
async function listHolidays(businessId, query) {
  const { year, active } = query
  const filters = {}
  
  if (year) {
    const startOfYear = new Date(`${year}-01-01`)
    const endOfYear = new Date(`${year}-12-31T23:59:59`)
    filters.date = { gte: startOfYear, lte: endOfYear }
  }
  
  if (active !== undefined) {
    filters.isActive = active === 'true' || active === true
  }
  
  return await repo.listHolidays(businessId, filters)
}

async function createHoliday(businessId, data, req) {
  const holiday = await repo.createHoliday(businessId, data)
  req?.audit?.('business.holiday_created', 'Holiday', holiday.id, { data })
  return holiday
}

async function getHoliday(businessId, holidayId) {
  const holiday = await repo.findHolidayById(businessId, holidayId)
  if (!holiday) throw ApiError.notFound('Holiday not found')
  return holiday
}

async function updateHoliday(businessId, holidayId, data, req) {
  const holiday = await repo.findHolidayById(businessId, holidayId)
  if (!holiday) throw ApiError.notFound('Holiday not found')
  
  const updated = await repo.updateHoliday(holidayId, data)
  req?.audit?.('business.holiday_updated', 'Holiday', holidayId, { changes: data })
  return updated
}

async function deleteHoliday(businessId, holidayId, req) {
  const holiday = await repo.findHolidayById(businessId, holidayId)
  if (!holiday) throw ApiError.notFound('Holiday not found')
  
  await repo.deleteHoliday(holidayId)
  req?.audit?.('business.holiday_deleted', 'Holiday', holidayId)
}

module.exports = { 
  getProfile, 
  updateProfile, 
  uploadLogo, 
  getSettings, 
  updateSettings, 
  getDashboardStats,
  getBranding,
  updateBranding,
  getTaxSettings,
  updateTaxSettings,
  getBusinessHours,
  updateBusinessHours,
  listHolidays,
  createHoliday,
  getHoliday,
  updateHoliday,
  deleteHoliday
}
