const express = require('express')
const router = express.Router()
const controller = require('./customers.controller')
const validators = require('./customers.validators')
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
 *   name: Customers
 *   description: Customer relationship management
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List customers (paginated, searchable, filterable)
 *     tags: [Customers]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Paginated list of customers
 */
router.get('/', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), validate(validators.listCustomersQuerySchema, 'query'), controller.list)

router.get('/groups', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), controller.listGroups)
router.post('/groups', requirePermission(PERMISSIONS.CUSTOMERS_CREATE), validate(validators.createCustomerGroupSchema), controller.createGroup)

router.get('/:id', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), controller.getOne)
router.get('/:id/statement', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), controller.statement)

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Customer created
 */
router.post('/', requirePermission(PERMISSIONS.CUSTOMERS_CREATE), validate(validators.createCustomerSchema), controller.create)

router.put('/:id', requirePermission(PERMISSIONS.CUSTOMERS_EDIT), validate(validators.updateCustomerSchema), controller.update)
router.delete('/:id', requirePermission(PERMISSIONS.CUSTOMERS_DELETE), controller.remove)

module.exports = router
