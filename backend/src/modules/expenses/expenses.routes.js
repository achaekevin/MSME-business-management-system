const express = require('express')
const router = express.Router()
const controller = require('./expenses.controller')
const validators = require('./expenses.validators')
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
 *   name: Expenses
 *   description: Business expense tracking and approval workflow
 */

router.get('/summary', requirePermission(PERMISSIONS.FINANCE_VIEW), controller.summary)
router.get('/categories', requirePermission(PERMISSIONS.FINANCE_VIEW), controller.categories)
router.get('/', requirePermission(PERMISSIONS.FINANCE_VIEW), controller.list)
router.get('/:id', requirePermission(PERMISSIONS.FINANCE_VIEW), controller.getOne)
router.post('/', requirePermission(PERMISSIONS.FINANCE_CREATE), validate(validators.createExpenseSchema), controller.create)
router.put('/:id', requirePermission(PERMISSIONS.FINANCE_CREATE), validate(validators.updateExpenseSchema), controller.update)
router.delete('/:id', requirePermission(PERMISSIONS.FINANCE_CREATE), controller.remove)
router.post('/:id/approve', requirePermission(PERMISSIONS.FINANCE_CREATE), controller.approve)
router.post('/:id/reject', requirePermission(PERMISSIONS.FINANCE_CREATE), validate(validators.rejectSchema), controller.reject)

module.exports = router
