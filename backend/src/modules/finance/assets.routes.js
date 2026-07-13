const router = require('express').Router()
const controller = require('./assets.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')

router.use(authenticate)

// Fixed Assets
router.post('/', requirePermission('finance.create'), controller.createFixedAsset)
router.get('/', requirePermission('finance.view'), controller.getFixedAssets)
router.get('/:id', requirePermission('finance.view'), controller.getFixedAssetDetails)
router.put('/:id', requirePermission('finance.edit'), controller.updateFixedAsset)
router.post('/:id/dispose', requirePermission('finance.approve'), controller.disposeAsset)

// Depreciation
router.get('/:id/depreciation/calculate', requirePermission('finance.view'), controller.calculateDepreciation)
router.post('/:id/depreciation/entry', requirePermission('finance.create'), controller.createDepreciationEntry)
router.get('/:id/depreciation/schedule', requirePermission('finance.view'), controller.getDepreciationSchedule)
router.post('/depreciation/run-monthly', requirePermission('finance.create'), controller.runMonthlyDepreciation)

module.exports = router
