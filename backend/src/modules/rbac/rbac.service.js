const { PrismaClient } = require('@prisma/client')
const { ApiError } = require('../../helpers/response')
const { PERMISSIONS } = require('../../constants/permissions')

const prisma = new PrismaClient()

/**
 * Create a custom role for a business
 */
async function createCustomRole(businessId, data, req) {
  const { name, displayName, description, category, permissions, accessRestrictions } = data
  
  // Check if role name already exists for this business
  const existing = await prisma.role.findFirst({
    where: { businessId, name }
  })
  
  if (existing) {
    throw ApiError.conflict('A role with this name already exists')
  }
  
  // Create the role
  const role = await prisma.role.create({
    data: {
      businessId,
      name,
      displayName: displayName || name,
      description,
      category: category || 'custom',
      isCustom: true,
      isSystem: false,
      isEnabled: true,
      accessRestrictions: accessRestrictions || {}
    }
  })
  
  // Assign permissions to the role
  if (permissions && permissions.length > 0) {
    await assignPermissionsToRole(businessId, role.id, permissions)
  }
  
  req?.audit?.('rbac.role_created', 'Role', role.id, { name, permissions })
  
  return await getRoleWithDetails(businessId, role.id)
}

/**
 * Update custom role
 */
async function updateCustomRole(businessId, roleId, data, req) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId }
  })
  
  if (!role) throw ApiError.notFound('Role not found')
  if (role.isSystem) throw ApiError.forbidden('System roles cannot be modified')
  
  const { name, displayName, description, category, permissions, accessRestrictions } = data
  
  // Update role basic info
  const updated = await prisma.role.update({
    where: { id: roleId },
    data: {
      name: name || role.name,
      displayName: displayName || role.displayName,
      description,
      category: category || role.category,
      accessRestrictions: accessRestrictions || role.accessRestrictions
    }
  })
  
  // Update permissions if provided
  if (permissions !== undefined) {
    // Remove existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId }
    })
    
    // Add new permissions
    if (permissions.length > 0) {
      await assignPermissionsToRole(businessId, roleId, permissions)
    }
  }
  
  req?.audit?.('rbac.role_updated', 'Role', roleId, { changes: data })
  
  return await getRoleWithDetails(businessId, roleId)
}

/**
 * Clone an existing role
 */
async function cloneRole(businessId, sourceRoleId, data, req) {
  const sourceRole = await prisma.role.findFirst({
    where: { id: sourceRoleId, businessId },
    include: { permissions: { include: { permission: true } } }
  })
  
  if (!sourceRole) throw ApiError.notFound('Source role not found')
  
  const { name, displayName } = data
  
  if (!name) throw ApiError.badRequest('New role name is required')
  
  // Create cloned role
  const clonedRole = await prisma.role.create({
    data: {
      businessId,
      name,
      displayName: displayName || `${sourceRole.displayName} (Copy)`,
      description: sourceRole.description,
      category: sourceRole.category,
      isCustom: true,
      isSystem: false,
      isEnabled: true,
      accessRestrictions: sourceRole.accessRestrictions || {}
    }
  })
  
  // Copy permissions
  const permissionIds = sourceRole.permissions.map(rp => rp.permissionId)
  await assignPermissionsToRole(businessId, clonedRole.id, permissionIds)
  
  req?.audit?.('rbac.role_cloned', 'Role', clonedRole.id, { sourceRoleId, name })
  
  return await getRoleWithDetails(businessId, clonedRole.id)
}

/**
 * Assign permissions to a role
 */
async function assignPermissionsToRole(businessId, roleId, permissionIds) {
  // Verify all permissions exist
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } }
  })
  
  if (permissions.length !== permissionIds.length) {
    throw ApiError.badRequest('Some permissions do not exist')
  }
  
  // Create role-permission relationships
  await prisma.rolePermission.createMany({
    data: permissionIds.map(permissionId => ({
      roleId,
      permissionId
    })),
    skipDuplicates: true
  })
  
  return true
}

/**
 * Get role with full details
 */
async function getRoleWithDetails(businessId, roleId) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
  
  if (!role) throw ApiError.notFound('Role not found')
  
  return {
    ...role,
    permissionsList: role.permissions.map(rp => rp.permission),
    userCount: role.users.length
  }
}

/**
 * Set access restrictions for a role
 */
async function setAccessRestrictions(businessId, roleId, restrictions, req) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId }
  })
  
  if (!role) throw ApiError.notFound('Role not found')
  if (role.isSystem) throw ApiError.forbidden('Cannot modify system roles')
  
  const { branches, warehouses, modules, reports, financialLimit } = restrictions
  
  const accessRestrictions = {
    branches: branches || [],           // Array of branch IDs user can access
    warehouses: warehouses || [],       // Array of warehouse IDs user can access
    modules: modules || [],             // Array of module names to enable
    reports: reports || [],             // Array of report types user can view
    financialLimit: financialLimit || null,  // Max transaction amount
    restrictedData: restrictions.restrictedData || {}  // Custom restrictions
  }
  
  await prisma.role.update({
    where: { id: roleId },
    data: { accessRestrictions }
  })
  
  req?.audit?.('rbac.restrictions_updated', 'Role', roleId, { restrictions: accessRestrictions })
  
  return await getRoleWithDetails(businessId, roleId)
}

/**
 * Check if user has permission
 */
async function checkUserPermission(userId, permissionKey) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  })
  
  if (!user || !user.role) return false
  
  // Business owners have all permissions
  if (user.isOwner) return true
  
  // Check if role has the permission
  const hasPermission = user.role.permissions.some(
    rp => rp.permission.key === permissionKey
  )
  
  return hasPermission
}

/**
 * Check if user can access a specific branch
 */
async function checkBranchAccess(userId, branchId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  })
  
  if (!user) return false
  
  // Business owners can access all branches
  if (user.isOwner) return true
  
  // If user's own branch
  if (user.branchId === branchId) return true
  
  // Check role restrictions
  const restrictions = user.role?.accessRestrictions || {}
  const allowedBranches = restrictions.branches || []
  
  // If no restrictions, allow all
  if (allowedBranches.length === 0) return true
  
  // Check if branch is in allowed list
  return allowedBranches.includes(branchId)
}

/**
 * Check if user can access a specific warehouse
 */
async function checkWarehouseAccess(userId, warehouseId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  })
  
  if (!user) return false
  if (user.isOwner) return true
  
  const restrictions = user.role?.accessRestrictions || {}
  const allowedWarehouses = restrictions.warehouses || []
  
  if (allowedWarehouses.length === 0) return true
  
  return allowedWarehouses.includes(warehouseId)
}

/**
 * Check if user can view a specific report
 */
async function checkReportAccess(userId, reportType) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  })
  
  if (!user) return false
  if (user.isOwner) return true
  
  const restrictions = user.role?.accessRestrictions || {}
  const allowedReports = restrictions.reports || []
  
  if (allowedReports.length === 0) return true
  
  return allowedReports.includes(reportType)
}

/**
 * Check if transaction amount is within user's limit
 */
async function checkFinancialLimit(userId, amount) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  })
  
  if (!user) return false
  if (user.isOwner) return true
  
  const restrictions = user.role?.accessRestrictions || {}
  const financialLimit = restrictions.financialLimit
  
  // No limit set
  if (!financialLimit) return true
  
  return amount <= financialLimit
}

/**
 * Get all permissions grouped by module
 */
async function getPermissionsByModule() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: 'asc' }, { key: 'asc' }]
  })
  
  const grouped = permissions.reduce((acc, perm) => {
    const module = perm.module
    if (!acc[module]) {
      acc[module] = {
        name: module,
        permissions: []
      }
    }
    acc[module].permissions.push(perm)
    return acc
  }, {})
  
  return Object.values(grouped)
}

/**
 * Get role templates (suggested role configurations)
 */
function getRoleTemplates() {
  return {
    'senior-cashier': {
      name: 'Senior Cashier',
      category: 'sales',
      description: 'Cashier with additional discount and refund approval powers',
      suggestedPermissions: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.SALES_EDIT,
        PERMISSIONS.SALES_DISCOUNT,
        PERMISSIONS.SALES_RETURNS,
        PERMISSIONS.INVOICES_VIEW,
        PERMISSIONS.INVOICES_CREATE,
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.INVENTORY_VIEW
      ]
    },
    'store-supervisor': {
      name: 'Store Supervisor',
      category: 'operations',
      description: 'Supervises store operations with inventory and sales oversight',
      suggestedPermissions: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.SALES_APPROVE,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_ADJUST,
        PERMISSIONS.INVENTORY_COUNT,
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_SALES,
        PERMISSIONS.REPORTS_INVENTORY
      ]
    },
    'finance-assistant': {
      name: 'Finance Assistant',
      category: 'finance',
      description: 'Assists with basic financial tasks',
      suggestedPermissions: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.INVOICES_VIEW,
        PERMISSIONS.INVOICES_CREATE,
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.EXPENSES_VIEW,
        PERMISSIONS.EXPENSES_CREATE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_FINANCIAL
      ]
    },
    'sales-associate': {
      name: 'Sales Associate',
      category: 'sales',
      description: 'Basic sales staff with customer interaction',
      suggestedPermissions: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.QUOTATIONS_VIEW,
        PERMISSIONS.QUOTATIONS_CREATE,
        PERMISSIONS.INVOICES_VIEW
      ]
    },
    'data-entry-clerk': {
      name: 'Data Entry Clerk',
      category: 'operations',
      description: 'Limited to data entry tasks',
      suggestedPermissions: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.PRODUCTS_CREATE,
        PERMISSIONS.SUPPLIERS_VIEW,
        PERMISSIONS.SUPPLIERS_CREATE
      ]
    }
  }
}

module.exports = {
  createCustomRole,
  updateCustomRole,
  cloneRole,
  setAccessRestrictions,
  checkUserPermission,
  checkBranchAccess,
  checkWarehouseAccess,
  checkReportAccess,
  checkFinancialLimit,
  getPermissionsByModule,
  getRoleTemplates,
  getRoleWithDetails
}
