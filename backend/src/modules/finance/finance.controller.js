const financeService = require('./finance.service')
const { asyncHandler } = require('../../helpers/asyncHandler')
const { successResponse } = require('../../helpers/response')

// Cash Accounts
exports.createCashAccount = asyncHandler(async (req, res) => {
  const account = await financeService.createCashAccount(req.businessId, req.body)
  successResponse(res, account, 'Cash account created', 201)
})

exports.getCashAccounts = asyncHandler(async (req, res) => {
  const accounts = await financeService.getCashAccounts(req.businessId, req.query)
  successResponse(res, accounts)
})

exports.getCashAccountBalance = asyncHandler(async (req, res) => {
  const balance = await financeService.getCashAccountBalance(req.params.id)
  successResponse(res, balance)
})

exports.createCashTransaction = asyncHandler(async (req, res) => {
  const transaction = await financeService.createCashTransaction(req.params.id, req.body)
  successResponse(res, transaction, 'Cash transaction created', 201)
})

exports.getCashTransactions = asyncHandler(async (req, res) => {
  const transactions = await financeService.getCashTransactions(req.params.id, req.query)
  successResponse(res, transactions)
})

// Bank Accounts
exports.createBankAccount = asyncHandler(async (req, res) => {
  const account = await financeService.createBankAccount(req.businessId, req.body)
  successResponse(res, account, 'Bank account created', 201)
})

exports.getBankAccounts = asyncHandler(async (req, res) => {
  const accounts = await financeService.getBankAccounts(req.businessId, req.query.isActive)
  successResponse(res, accounts)
})

// Income
exports.createIncomeCategory = asyncHandler(async (req, res) => {
  const category = await financeService.createIncomeCategory(req.businessId, req.body)
  successResponse(res, category, 'Income category created', 201)
})

exports.getIncomeCategories = asyncHandler(async (req, res) => {
  const categories = await financeService.getIncomeCategories(req.businessId)
  successResponse(res, categories)
})

exports.createIncome = asyncHandler(async (req, res) => {
  const income = await financeService.createIncome(req.businessId, req.body)
  successResponse(res, income, 'Income record created', 201)
})

exports.getIncomes = asyncHandler(async (req, res) => {
  const incomes = await financeService.getIncomes(req.businessId, req.query)
  successResponse(res, incomes)
})

exports.getIncomeStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const stats = await financeService.getIncomeStats(req.businessId, startDate, endDate)
  successResponse(res, stats)
})

// Expenses
exports.createExpenseCategory = asyncHandler(async (req, res) => {
  const category = await financeService.createExpenseCategory(req.businessId, req.body)
  successResponse(res, category, 'Expense category created', 201)
})

exports.getExpenseCategories = asyncHandler(async (req, res) => {
  const categories = await financeService.getExpenseCategories(req.businessId)
  successResponse(res, categories)
})

exports.createExpense = asyncHandler(async (req, res) => {
  const expense = await financeService.createExpense(req.businessId, req.body)
  successResponse(res, expense, 'Expense record created', 201)
})

exports.getExpenses = asyncHandler(async (req, res) => {
  const expenses = await financeService.getExpenses(req.businessId, req.query)
  successResponse(res, expenses)
})

exports.approveExpense = asyncHandler(async (req, res) => {
  const expense = await financeService.approveExpense(req.params.id, req.userId)
  successResponse(res, expense, 'Expense approved')
})

exports.getExpenseStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const stats = await financeService.getExpenseStats(req.businessId, startDate, endDate)
  successResponse(res, stats)
})

// Reconciliation
exports.createReconciliation = asyncHandler(async (req, res) => {
  const reconciliation = await financeService.createReconciliation(req.businessId, req.body)
  successResponse(res, reconciliation, 'Reconciliation created', 201)
})

exports.getReconciliations = asyncHandler(async (req, res) => {
  const reconciliations = await financeService.getReconciliations(req.businessId, req.query)
  successResponse(res, reconciliations)
})

exports.addReconciliationItem = asyncHandler(async (req, res) => {
  const item = await financeService.addReconciliationItem(req.params.id, req.body)
  successResponse(res, item, 'Reconciliation item added', 201)
})

exports.markReconciled = asyncHandler(async (req, res) => {
  const reconciliation = await financeService.markReconciled(req.params.id, req.userId)
  successResponse(res, reconciliation, 'Marked as reconciled')
})

// Reports
exports.getCashFlowReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const report = await financeService.getCashFlowReport(req.businessId, startDate, endDate)
  successResponse(res, report)
})
