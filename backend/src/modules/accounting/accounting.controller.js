const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated } = require('../../helpers/response')
const service = require('./accounting.service')

// ── Chart of Accounts ─────────────────────────────────────────────────────────
const listAccounts = asyncHandler(async (req, res) => {
  success(res, await service.listAccounts(req.businessId))
})

const getAccount = asyncHandler(async (req, res) => {
  success(res, await service.getAccount(req.businessId, req.params.id))
})

const getAccountLedger = asyncHandler(async (req, res) => {
  const result = await service.getGeneralLedger(req.businessId, req.params.id, req.query)
  paginated(res, result.lines, result.total, result.page, result.limit)
})

const createAccount = asyncHandler(async (req, res) => {
  created(res, await service.createAccount(req.businessId, req.body, req), 'Account created')
})

const updateAccount = asyncHandler(async (req, res) => {
  success(res, await service.updateAccount(req.businessId, req.params.id, req.body, req), 'Account updated')
})

// ── Journal Entries ───────────────────────────────────────────────────────────
const listJournals = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await service.listJournals(req.businessId, req.query)
  paginated(res, items, total, page, limit)
})

const getJournal = asyncHandler(async (req, res) => {
  success(res, await service.getJournal(req.businessId, req.params.id))
})

const createJournal = asyncHandler(async (req, res) => {
  created(res, await service.createJournal(req.businessId, req.body, req.userId, req), 'Journal entry created')
})

// ── Financial Reports ─────────────────────────────────────────────────────────
const trialBalance = asyncHandler(async (req, res) => {
  success(res, await service.getTrialBalance(req.businessId, req.query))
})

const balanceSheet = asyncHandler(async (req, res) => {
  success(res, await service.getBalanceSheet(req.businessId, req.query))
})

const profitAndLoss = asyncHandler(async (req, res) => {
  success(res, await service.getProfitAndLoss(req.businessId, req.query))
})

const taxReport = asyncHandler(async (req, res) => {
  success(res, await service.getTaxReport(req.businessId, req.query))
})

module.exports = {
  listAccounts, getAccount, getAccountLedger, createAccount, updateAccount,
  listJournals, getJournal, createJournal,
  trialBalance, balanceSheet, profitAndLoss, taxReport
}
