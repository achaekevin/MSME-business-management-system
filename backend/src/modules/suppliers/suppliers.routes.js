const express = require('express')
const router = express.Router()
const controller = require('./suppliers.controller')
const validators = require('./suppliers.validators')
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
 *   name: Suppliers
 *   description: Supplier management, statements, purchase history
 */

router.get('/', requirePermission(PERMISSIONS.SUPPLIERS_VIEW), controller.list)
router.get('/:id', requirePermission(PERMISSIONS.SUPPLIERS_VIEW), controller.getOne)
router.get('/:id/statement', requirePermission(PERMISSIONS.SUPPLIERS_VIEW), controller.statement)
router.get('/:id/purchases', requirePermission(PERMISSIONS.SUPPLIERS_VIEW), controller.purchases)

router.post('/', requirePermission(PERMISSIONS.SUPPLIERS_CREATE), validate(validators.createSupplierSchema), controller.create)
router.put('/:id', requirePermission(PERMISSIONS.SUPPLIERS_EDIT), validate(validators.updateSupplierSchema), controller.update)
router.delete('/:id', requirePermission(PERMISSIONS.SUPPLIERS_DELETE), controller.remove)

router.post('/:id/payments', requirePermission(PERMISSIONS.FINANCE_CREATE), validate(validators.paymentSchema), controller.recordPayment)

module.exports = router
