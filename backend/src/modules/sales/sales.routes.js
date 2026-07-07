const express = require('express')
const router = express.Router()
const controller = require('./sales.controller')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { PERMISSIONS } = require('../../constants/permissions')
const v = require('./sales.validators')

router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales orders, POS, quotations, returns
 */

router.get('/quotations', requirePermission(PERMISSIONS.SALES_VIEW), controller.listQuotations)
router.post('/quotations', requirePermission(PERMISSIONS.SALES_CREATE), validate(v.createQuotationSchema), controller.createQuotation)
router.post('/quotations/:id/convert', requirePermission(PERMISSIONS.SALES_CREATE), controller.convertQuotation)

router.get('/', requirePermission(PERMISSIONS.SALES_VIEW), validate(v.listSalesQuerySchema, 'query'), controller.list)
router.get('/:id', requirePermission(PERMISSIONS.SALES_VIEW), controller.getOne)
router.post('/', requirePermission(PERMISSIONS.SALES_CREATE), validate(v.createSaleSchema), controller.create)
router.post('/:id/void', requirePermission(PERMISSIONS.SALES_VOID), validate(v.voidSaleSchema), controller.voidSale)
router.post('/:id/returns', requirePermission(PERMISSIONS.SALES_CREATE), validate(v.createReturnSchema), controller.createReturn)

module.exports = router
