const express = require('express')
const router = express.Router()
const controller = require('./accounting.controller')
const validators = require('./accounting.validators')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Accounting
 *   description: Chart of accounts, double-entry journals, and financial reports
 */

// Chart of Accounts
router.get('/accounts', requirePermission(PERMISSIONS.ACCOUNTING_VIEW), controller.listAccounts)
router.get('/accounts/:id', requirePermission(PERMISSIONS.ACCOUNTING_VIEW), controller.getAccount)
router.get('/accounts/:id/ledger', requirePermission(PERMISSIONS.ACCOUNTING_VIEW), controller.getAccountLedger)
router.post('/accounts', requirePermission(PERMISSIONS.ACCOUNTING_CREATE), validate(validators.accountSchema), controller.createAccount)
router.put('/accounts/:id', requirePermission(PERMISSIONS.ACCOUNTING_CREATE), validate(validators.accountSchema.partial()), controller.updateAccount)

// Journal Entries
router.get('/journals', requirePermission(PERMISSIONS.ACCOUNTING_VIEW), controller.listJournals)
router.get('/journals/:id', requirePermission(PERMISSIONS.ACCOUNTING_VIEW), controller.getJournal)
router.post('/journals', requirePermission(PERMISSIONS.ACCOUNTING_CREATE), validate(validators.journalSchema), controller.createJournal)

// Financial Reports
router.get('/reports/trial-balance', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.trialBalance)
router.get('/reports/balance-sheet', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.balanceSheet)
router.get('/reports/profit-loss', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.profitAndLoss)
router.get('/reports/tax', requirePermission(PERMISSIONS.REPORTS_VIEW), controller.taxReport)

module.exports = router
