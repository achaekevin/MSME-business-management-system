const repo = require('./analytics.repository')
const dayjs = require('dayjs')

async function getKpiSummary(businessId) {
  const start = dayjs().startOf('month').toDate()
  const end = dayjs().endOf('month').toDate()
  const lastStart = dayjs().subtract(1, 'month').startOf('month').toDate()
  const lastEnd = dayjs().subtract(1, 'month').endOf('month').toDate()

  const [rev, revLast, exp, expLast, orders, ordersLast, outstanding, invStats] = await Promise.all([
    repo.getSalesInRange(businessId, start, end),
    repo.getSalesInRange(businessId, lastStart, lastEnd),
    repo.getExpensesInRange(businessId, start, end),
    repo.getExpensesInRange(businessId, lastStart, lastEnd),
    repo.getSaleOrdersCount(businessId, start, end),
    repo.getSaleOrdersCount(businessId, lastStart, lastEnd),
    repo.getOutstandingInvoices(businessId),
    repo.getInventoryStats(businessId)
  ])

  const [totalInventoryProducts, lowStockCount, outOfStockCount, stocks] = invStats

  function pct(curr, prev) {
    if (!prev) return curr ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  const r = Number(rev._sum.total || 0), rl = Number(revLast._sum.total || 0)
  const e = Number(exp._sum.amount || 0), el = Number(expLast._sum.amount || 0)
  const inventoryValue = stocks.reduce((s, st) => s + Number(st.quantity) * Number(st.product.costPrice || 0), 0)

  return {
    revenue: { value: r, change: pct(r, rl) },
    expenses: { value: e, change: pct(e, el) },
    profit: { value: r - e, change: pct(r - e, rl - el) },
    salesOrders: { value: orders, change: pct(orders, ordersLast) },
    outstandingInvoices: { count: outstanding._count, amount: Number(outstanding._sum.balance || 0) },
    inventory: { totalProducts: totalInventoryProducts, lowStock: lowStockCount, outOfStock: outOfStockCount, value: inventoryValue }
  }
}

async function getRevenueTrend(businessId, months) {
  const start = dayjs().subtract(months - 1, 'month').startOf('month').toDate()
  const orders = await repo.getSaleOrdersInRange(businessId, start)
  const expenses = await repo.getExpensesInRange(businessId, start, new Date())

  const monthMap = {}
  for (const o of orders) {
    const key = dayjs(o.createdAt).format('MMM YYYY')
    if (!monthMap[key]) monthMap[key] = { name: key, revenue: 0, expenses: 0, profit: 0 }
    monthMap[key].revenue += Number(o.total)
  }

  return Object.values(monthMap).map((m) => ({ ...m, profit: m.revenue - m.expenses }))
}

async function getSalesTrend(businessId, groupBy, days) {
  const start = dayjs().subtract(days, 'day').toDate()
  const orders = await repo.getSaleOrdersInRange(businessId, start)

  const formatFn = groupBy === 'day' ? 'MMM D' : groupBy === 'week' ? 'W[W] YYYY' : 'MMM YYYY'
  const map = {}
  for (const o of orders) {
    const key = dayjs(o.createdAt).format(formatFn)
    if (!map[key]) map[key] = { name: key, count: 0, total: 0 }
    map[key].count++
    map[key].total += Number(o.total)
  }
  return Object.values(map)
}

async function getTopProducts(businessId, limit, days) {
  const start = dayjs().subtract(days, 'day').toDate()
  const items = await repo.getSaleItems(businessId, start, limit)

  const productMap = {}
  for (const item of items) {
    const id = item.productId
    if (!productMap[id]) productMap[id] = { product: item.product, qty: 0, revenue: 0, count: 0 }
    productMap[id].qty += Number(item.quantity)
    productMap[id].revenue += Number(item.subtotal || item.unitPrice * item.quantity)
    productMap[id].count++
  }
  return Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

async function getTopCustomers(businessId, limit, days) {
  const start = dayjs().subtract(days, 'day').toDate()
  const orders = await repo.getSaleOrdersByCustomer(businessId, start)

  const customerMap = {}
  for (const o of orders) {
    const id = o.customerId
    if (!customerMap[id]) customerMap[id] = { customer: o.customer, count: 0, total: 0 }
    customerMap[id].count++
    customerMap[id].total += Number(o.total)
  }
  return Object.values(customerMap).sort((a, b) => b.total - a.total).slice(0, limit)
}

async function getCustomerGrowth(businessId, months) {
  const data = []
  for (let i = months - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate()
    const end = dayjs().subtract(i, 'month').endOf('month').toDate()
    const count = await repo.getCustomerCount(businessId, start, end)
    data.push({ name: dayjs(start).format('MMM YYYY'), newCustomers: count })
  }
  return data
}

async function getCashFlow(businessId, months) {
  const data = []
  for (let i = months - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate()
    const end = dayjs().subtract(i, 'month').endOf('month').toDate()
    const [inflows, outflows] = await Promise.all([
      repo.getPaymentsInRange(businessId, 'sale', start, end),
      repo.getExpensesInRange(businessId, start, end)
    ])
    const inflow = Number(inflows._sum.amount || 0)
    const outflow = Number(outflows._sum.amount || 0)
    data.push({ name: dayjs(start).format('MMM YYYY'), inflow, outflow, net: inflow - outflow })
  }
  return data
}

async function getInventoryAnalytics(businessId) {
  const [totalProducts, lowStockCount, outOfStockCount, stocks] = await repo.getInventoryStats(businessId)
  const inventoryValue = stocks.reduce((s, st) => s + Number(st.quantity) * Number(st.product.costPrice || 0), 0)
  return { totalProducts, lowStockCount, outOfStockCount, inventoryValue }
}

module.exports = {
  getKpiSummary, getRevenueTrend, getSalesTrend, getTopProducts, getTopCustomers,
  getCustomerGrowth, getCashFlow, getInventoryAnalytics
}
