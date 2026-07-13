const router = require('express').Router()
const controller = require('./tax.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Tax Rates
router.post('/rates', requirePermission('finance.create'), controller.createTaxRate)
router.get('/rates', requirePermission('finance.view'), controller.getTaxRates)
router.put('/rates/:id', requirePermission('finance.edit'), controller.updateTaxRate)
router.delete('/rates/:id', requirePermission('finance.delete'), controller.deleteTaxRate)

// Tax Exemptions
router.post('/exemptions', requirePermission('finance.create'), controller.createTaxExemption)
router.get('/exemptions', requirePermission('finance.view'), controller.getTaxExemptions)
router.put('/exemptions/:id', requirePermission('finance.edit'), controller.updateTaxExemption)

// Tax Payments
router.post('/payments', requirePermission('finance.create'), controller.createTaxPayment)
router.get('/payments', requirePermission('finance.view'), controller.getTaxPayments)
router.put('/payments/:id', requirePermission('finance.edit'), controller.updateTaxPayment)
router.post('/payments/:id/mark-paid', requirePermission('finance.approve'), controller.markTaxPaymentPaid)

// Tax Reports
router.get('/reports/tax-summary', requirePermission('finance.view'), controller.getTaxReport)
router.get('/reports/liability', requirePermission('finance.view'), controller.calculateTaxLiability)

module.exports = router
