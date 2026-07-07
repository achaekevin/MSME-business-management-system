const express = require('express')
const router = express.Router()
const controller = require('./products.controller')
const validators = require('./products.validators')
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
 *   name: Products
 *   description: Product catalog, categories, units, variants, barcode/QR lookup
 */

router.get('/', requirePermission(PERMISSIONS.PRODUCTS_VIEW), validate(validators.listProductsQuerySchema, 'query'), controller.list)
router.get('/categories', requirePermission(PERMISSIONS.PRODUCTS_VIEW), controller.listCategories)
router.post('/categories', requirePermission(PERMISSIONS.PRODUCTS_CREATE), validate(validators.createCategorySchema), controller.createCategory)
router.get('/units', requirePermission(PERMISSIONS.PRODUCTS_VIEW), controller.listUnits)
router.post('/units', requirePermission(PERMISSIONS.PRODUCTS_CREATE), validate(validators.createUnitSchema), controller.createUnit)

/**
 * @swagger
 * /products/lookup/{code}:
 *   get:
 *     summary: Look up a product by SKU or barcode (used by POS scanner)
 *     tags: [Products]
 */
router.get('/lookup/:code', requirePermission(PERMISSIONS.PRODUCTS_VIEW), controller.lookup)

router.get('/:id', requirePermission(PERMISSIONS.PRODUCTS_VIEW), controller.getOne)
router.post('/:id/variants', requirePermission(PERMISSIONS.PRODUCTS_EDIT), validate(validators.createVariantSchema), controller.addVariant)

router.post('/', requirePermission(PERMISSIONS.PRODUCTS_CREATE), validate(validators.createProductSchema), controller.create)
router.put('/:id', requirePermission(PERMISSIONS.PRODUCTS_EDIT), validate(validators.updateProductSchema), controller.update)
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCTS_DELETE), controller.remove)

module.exports = router
