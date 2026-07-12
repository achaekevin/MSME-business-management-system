// ─── Service ─────────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const dayjs = require('dayjs')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const emailQueue = require('../../queues/email.queue')
const appConfig = require('../../config/app')
const { SYSTEM_ROLES, ROLE_PERMISSIONS, PERMISSIONS } = require('../../constants/permissions')

// ─────────────────────────── Users ───────────────────────────────────────────

async function listUsers(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where: { businessId },
      skip, take, orderBy,
      select: { id: true, name: true, email: true, phone: true, role: true, branchId: true, isOwner: true, isActive: true, status: true, lastLoginAt: true, createdAt: true }
    }),
    prisma.user.count({ where: { businessId } })
  ])
  return { items: data, total, page, limit }
}

async function getUser(businessId, id) {
  const user = await prisma.user.findFirst({
    where: { id, businessId },
    select: { id: true, name: true, email: true, phone: true, role: { include: { permissions: { include: { permission: true } } } }, branchId: true, isOwner: true, isActive: true, status: true, lastLoginAt: true, createdAt: true }
  })
  if (!user) throw ApiError.notFound('User not found')
  return user
}

async function inviteUser(businessId, data, invitedById) {
  const existing = await prisma.user.findFirst({ where: { businessId, email: data.email } })
  if (existing) throw ApiError.conflict('A user with this email already exists in this business')

  const token = crypto.randomBytes(32).toString('hex')
  const role = data.roleId
    ? await prisma.role.findFirst({ where: { id: data.roleId, businessId } })
    : await prisma.role.findFirst({ where: { businessId, name: data.roleName || SYSTEM_ROLES.EMPLOYEE } })

  const user = await prisma.user.create({
    data: {
      businessId,
      branchId: data.branchId || null,
      name: data.name,
      email: data.email,
      passwordHash: '',
      roleId: role?.id || null,
      status: 'pending',
      invitedBy: invitedById,
      invitationToken: token,
      invitationExpiresAt: dayjs().add(7, 'day').toDate()
    }
  })

  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { name: true } })
  await emailQueue.add('send-invitation', { email: data.email, name: data.name, businessName: business?.name, token })

  return { id: user.id, name: user.name, email: user.email, status: user.status }
}

async function updateUser(businessId, id, data) {
  const user = await prisma.user.findFirst({ where: { id, businessId } })
  if (!user) throw ApiError.notFound('User not found')
  if (user.isOwner) throw ApiError.forbidden('Cannot modify the owner account via this endpoint')

  const allowed = {}
  if (data.name) allowed.name = data.name
  if (data.roleId) allowed.roleId = data.roleId
  if (data.branchId !== undefined) allowed.branchId = data.branchId
  if (typeof data.isActive === 'boolean') allowed.isActive = data.isActive

  return prisma.user.update({
    where: { id },
    data: allowed,
    select: { id: true, name: true, email: true, role: true, isActive: true }
  })
}

async function removeUser(businessId, id) {
  const user = await prisma.user.findFirst({ where: { id, businessId } })
  if (!user) throw ApiError.notFound('User not found')
  if (user.isOwner) throw ApiError.forbidden('Cannot remove the owner account')

  await prisma.user.delete({ where: { id } })
  return { removed: true }
}

// ─────────────────────────── Roles ───────────────────────────────────────────

async function listRoles(businessId, filters = {}) {
  const where = { businessId }
  
  if (filters.category) where.category = filters.category
  if (filters.enabled !== undefined) where.isEnabled = filters.enabled === 'true' || filters.enabled === true
  
  return prisma.role.findMany({
    where,
    include: { 
      permissions: { include: { permission: true } }, 
      _count: { select: { users: true } } 
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  })
}

async function getRoleDetails(businessId, roleId) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId },
    include: { 
      permissions: { include: { permission: true } },
      users: {
        select: { id: true, name: true, email: true, status: true }
      },
      _count: { select: { users: true } }
    }
  })
  if (!role) throw ApiError.notFound('Role not found')
  return role
}

async function createRole(businessId, data) {
  const existing = await prisma.role.findFirst({ where: { businessId, name: data.name } })
  if (existing) throw ApiError.conflict('A role with this name already exists')

  const allPerms = await prisma.permission.findMany()
  const permMap = Object.fromEntries(allPerms.map((p) => [p.key, p.id]))

  const valid = (data.permissions || []).filter((k) => permMap[k])

  return prisma.role.create({
    data: {
      businessId,
      name: data.name,
      displayName: data.displayName || data.name,
      description: data.description,
      category: data.category,
      isCustom: true, // Custom role created by business
      isEnabled: data.isEnabled !== false,
      permissions: { create: valid.map((k) => ({ permissionId: permMap[k] })) }
    },
    include: { permissions: { include: { permission: true } } }
  })
}

async function updateRole(businessId, id, data) {
  const role = await prisma.role.findFirst({ where: { id, businessId } })
  if (!role) throw ApiError.notFound('Role not found')
  
  // System roles can have permissions updated but not name/category
  const updateData = {}
  
  if (!role.isSystem) {
    if (data.name) updateData.name = data.name
    if (data.displayName) updateData.displayName = data.displayName
    if (data.description !== undefined) updateData.description = data.description
    if (data.category) updateData.category = data.category
  }

  // All roles can have permissions updated
  if (data.permissions) {
    const allPerms = await prisma.permission.findMany()
    const permMap = Object.fromEntries(allPerms.map((p) => [p.key, p.id]))
    const valid = data.permissions.filter((k) => permMap[k])

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({ data: valid.map((k) => ({ roleId: id, permissionId: permMap[k] })) })
    ])
  }

  return prisma.role.update({
    where: { id },
    data: updateData,
    include: { permissions: { include: { permission: true } } }
  })
}

async function toggleRole(businessId, roleId, isEnabled) {
  const role = await prisma.role.findFirst({ where: { id: roleId, businessId } })
  if (!role) throw ApiError.notFound('Role not found')
  
  // Cannot disable Business Owner role
  if (role.name === 'Business Owner' && !isEnabled) {
    throw ApiError.forbidden('Cannot disable the Business Owner role')
  }

  return prisma.role.update({
    where: { id: roleId },
    data: { isEnabled },
    include: { _count: { select: { users: true } } }
  })
}

async function deleteRole(businessId, id) {
  const role = await prisma.role.findFirst({ where: { id, businessId } })
  if (!role) throw ApiError.notFound('Role not found')
  if (role.isSystem) throw ApiError.forbidden('System roles cannot be deleted')

  const usersWithRole = await prisma.user.count({ where: { roleId: id } })
  if (usersWithRole > 0) {
    throw ApiError.conflict('Cannot delete a role that is assigned to users. Reassign them first.')
  }

  await prisma.role.delete({ where: { id } })
  return { deleted: true }
}

async function getAvailablePermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: 'asc' }, { key: 'asc' }]
  })
  
  // Group by module
  const grouped = permissions.reduce((acc, perm) => {
    const module = perm.module
    if (!acc[module]) acc[module] = []
    acc[module].push(perm)
    return acc
  }, {})
  
  return grouped
}

module.exports = { 
  listUsers, 
  getUser, 
  inviteUser, 
  updateUser, 
  removeUser, 
  listRoles, 
  getRoleDetails,
  createRole, 
  updateRole, 
  toggleRole,
  deleteRole,
  getAvailablePermissions
}
