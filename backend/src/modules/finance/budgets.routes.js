const router = require('express').Router()
const controller = require('./budgets.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Budgets
router.post('/', requirePermission('finance.create'), controller.createBudget)
router.get('/', requirePermission('finance.view'), controller.getBudgets)
router.get('/active', requirePermission('finance.view'), controller.getActiveBudgets)
router.get('/:id', requirePermission('finance.view'), controller.getBudgetDetails)
router.put('/:id', requirePermission('finance.edit'), controller.updateBudget)
router.post('/:id/approve', requirePermission('finance.approve'), controller.approveBudget)

// Budget Items
router.post('/:id/items', requirePermission('finance.create'), controller.addBudgetItem)
router.put('/:id/items/:itemId', requirePermission('finance.edit'), controller.updateBudgetItem)
router.delete('/:id/items/:itemId', requirePermission('finance.delete'), controller.deleteBudgetItem)

// Budget Tracking
router.post('/:id/sync-actuals', requirePermission('finance.create'), controller.syncBudgetActuals)
router.get('/:id/vs-actual', requirePermission('finance.view'), controller.getBudgetVsActualReport)

module.exports = router
