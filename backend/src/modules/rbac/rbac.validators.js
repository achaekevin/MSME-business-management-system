const { body, param } = require('express-validator')

const createRoleValidator = [
  body('name')
    .notEmpty().withMessage('Role name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Role name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('displayName')
    .optional()
    .isLength({ max: 100 }).withMessage('Display name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['system', 'management', 'sales', 'inventory', 'finance', 'hr', 'operations', 'custom'])
    .withMessage('Invalid category'),
  body('permissions')
    .optional()
    .isArray().withMessage('Permissions must be an array')
    .custom((value) => {
      if (value && value.length > 0 && !value.every(id => typeof id === 'string')) {
        throw new Error('All permission IDs must be strings')
      }
      return true
    }),
  body('accessRestrictions')
    .optional()
    .isObject().withMessage('Access restrictions must be an object')
]

const updateRoleValidator = [
  param('roleId')
    .isUUID().withMessage('Invalid role ID'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 50 }).withMessage('Role name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('displayName')
    .optional()
    .isLength({ max: 100 }).withMessage('Display name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['system', 'management', 'sales', 'inventory', 'finance', 'hr', 'operations', 'custom'])
    .withMessage('Invalid category'),
  body('permissions')
    .optional()
    .isArray().withMessage('Permissions must be an array'),
  body('accessRestrictions')
    .optional()
    .isObject().withMessage('Access restrictions must be an object')
]

const cloneRoleValidator = [
  param('roleId')
    .isUUID().withMessage('Invalid role ID'),
  body('name')
    .notEmpty().withMessage('New role name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Role name must be between 3 and 50 characters'),
  body('displayName')
    .optional()
    .isLength({ max: 100 }).withMessage('Display name cannot exceed 100 characters')
]

const accessRestrictionsValidator = [
  param('roleId')
    .isUUID().withMessage('Invalid role ID'),
  body('branches')
    .optional()
    .isArray().withMessage('Branches must be an array'),
  body('warehouses')
    .optional()
    .isArray().withMessage('Warehouses must be an array'),
  body('modules')
    .optional()
    .isArray().withMessage('Modules must be an array'),
  body('reports')
    .optional()
    .isArray().withMessage('Reports must be an array'),
  body('financialLimit')
    .optional()
    .isFloat({ min: 0 }).withMessage('Financial limit must be a positive number')
]

const checkPermissionValidator = [
  body('permissionKey')
    .notEmpty().withMessage('Permission key is required')
    .isString().withMessage('Permission key must be a string')
]

const roleIdValidator = [
  param('roleId')
    .isUUID().withMessage('Invalid role ID')
]

const branchIdValidator = [
  param('branchId')
    .isUUID().withMessage('Invalid branch ID')
]

module.exports = {
  createRoleValidator,
  updateRoleValidator,
  cloneRoleValidator,
  accessRestrictionsValidator,
  checkPermissionValidator,
  roleIdValidator,
  branchIdValidator
}
