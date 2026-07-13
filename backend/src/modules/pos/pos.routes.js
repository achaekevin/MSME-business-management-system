const router = require('express').Router()
const controller = require('./pos.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const { validate } = require('../../middleware/validation.middleware')
const validators = require('./pos.validators')

// All POS routes require authentication
router.use(authenticate)

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/pos/shifts/open
 * @desc    Open a new POS shift
 * @access  Private (sales.create permission)
 */
router.post(
  '/shifts/open',
  requirePermission('sales.create'),
  validate(validators.openShift),
  controller.openShift
)

/**
 * @route   POST /api/pos/shifts/:shiftId/close
 * @desc    Close an open POS shift
 * @access  Private (sales.create permission)
 */
router.post(
  '/shifts/:shiftId/close',
  requirePermission('sales.create'),
  validate(validators.closeShift),
  controller.closeShift
)

/**
 * @route   GET /api/pos/shifts/current
 * @desc    Get current open shift for logged-in user
 * @access  Private
 */
router.get(
  '/shifts/current',
  controller.getCurrentShift
)

/**
 * @route   GET /api/pos/shifts
 * @desc    Get shift history with filters
 * @access  Private (sales.view permission)
 */
router.get(
  '/shifts',
  requirePermission('sales.view'),
  controller.getShiftHistory
)

// ─────────────────────────────────────────────────────────────────────────────
// SALES TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/pos/sales
 * @desc    Create a POS sale
 * @access  Private (sales.create permission)
 */
router.post(
  '/sales',
  requirePermission('sales.create'),
  validate(validators.createSale),
  controller.createPOSSale
)

/**
 * @route   GET /api/pos/products/search
 * @desc    Search products for POS (by name, SKU, or barcode)
 * @access  Private
 */
router.get(
  '/products/search',
  controller.searchProducts
)

/**
 * @route   GET /api/pos/products/barcode/:barcode
 * @desc    Get product by barcode
 * @access  Private
 */
router.get(
  '/products/barcode/:barcode',
  controller.getProductByBarcode
)

/**
 * @route   POST /api/pos/returns/:saleId
 * @desc    Process a return/refund at POS
 * @access  Private (sales.create permission)
 */
router.post(
  '/returns/:saleId',
  requirePermission('sales.create'),
  validate(validators.processReturn),
  controller.processPOSReturn
)

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/pos/config
 * @desc    Get POS configuration
 * @access  Private
 */
router.get(
  '/config',
  controller.getPOSConfig
)

/**
 * @route   PUT /api/pos/config
 * @desc    Update POS configuration
 * @access  Private (settings.edit permission)
 */
router.put(
  '/config',
  requirePermission('settings.edit'),
  validate(validators.updateConfig),
  controller.updatePOSConfig
)

module.exports = router
