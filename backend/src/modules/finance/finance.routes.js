const router = require('express').Router()
const controller = require('./finance.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Cash Accounts
router.post('/cash-accounts', requirePermission('finance.create'), controller.createCashAccount)
router.get('/cash-accounts', requirePermission('finance.view'), controller.getCashAccounts)
router.get('/cash-accounts/:id/balance', requirePermission('finance.view'), controller.getCashAccountBalance)
router.post('/cash-accounts/:id/transactions', requirePermission('finance.create'), controller.createCashTransaction)
router.get('/cash-accounts/:id/transactions', requirePermission('finance.view'), controller.getCashTransactions)

// Bank Accounts
router.post('/bank-accounts', requirePermission('finance.create'), controller.createBankAccount)
router.get('/bank-accounts', requirePermission('finance.view'), controller.getBankAccounts)

// Income
router.post('/income/categories', requirePermission('finance.create'), controller.createIncomeCategory)
router.get('/income/categories', requirePermission('finance.view'), controller.getIncomeCategories)
router.post('/income', requirePermission('finance.create'), controller.createIncome)
router.get('/income', requirePermission('finance.view'), controller.getIncomes)
router.get('/income/stats', requirePermission('finance.view'), controller.getIncomeStats)

// Expenses
router.post('/expenses/categories', requirePermission('finance.create'), controller.createExpenseCategory)
router.get('/expenses/categories', requirePermission('finance.view'), controller.getExpenseCategories)
router.post('/expenses', requirePermission('finance.create'), controller.createExpense)
router.get('/expenses', requirePermission('finance.view'), controller.getExpenses)
router.post('/expenses/:id/approve', requirePermission('finance.approve'), controller.approveExpense)
router.get('/expenses/stats', requirePermission('finance.view'), controller.getExpenseStats)

// Reconciliation
router.post('/reconciliations', requirePermission('finance.create'), controller.createReconciliation)
router.get('/reconciliations', requirePermission('finance.view'), controller.getReconciliations)
router.post('/reconciliations/:id/items', requirePermission('finance.create'), controller.addReconciliationItem)
router.post('/reconciliations/:id/mark-reconciled', requirePermission('finance.approve'), controller.markReconciled)

// Reports
router.get('/reports/cash-flow', requirePermission('finance.view'), controller.getCashFlowReport)

module.exports = router
