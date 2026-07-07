/**
 * Shared formatting helpers used by PDF generators and report services.
 * Kept separate so they can be imported without pulling in the full utils bundle.
 */

function formatCurrency(amount, symbol = '') {
  const num = Number(amount || 0)
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatNumber(num, decimals = 0) {
  return Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatPercent(value, decimals = 1) {
  return `${Number(value || 0).toFixed(decimals)}%`
}

module.exports = { formatCurrency, formatDate, formatNumber, formatPercent }
