const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { PERMISSIONS, ENTERPRISE_ROLES, ENTERPRISE_ROLE_PERMISSIONS } = require('../src/constants/permissions')

const prisma = new PrismaClient()

async function seedPermissions() {
  console.log('Seeding permissions...')
  const permissionData = Object.values(PERMISSIONS).map((key) => ({
    key,
    module: key.split('.')[0],
    description: key
  }))

  for (const perm of permissionData) {
    await prisma.permission.upsert({ where: { key: perm.key }, update: {}, create: perm })
  }
  console.log(`✅ Seeded ${permissionData.length} permissions`)
}

const ROLE_CATEGORIES = {
  SYSTEM: 'system',
  MANAGEMENT: 'management',
  SALES: 'sales',
  INVENTORY: 'inventory',
  FINANCE: 'finance',
  HR: 'hr',
  OPERATIONS: 'operations'
}

const ROLE_METADATA = {
  [ENTERPRISE_ROLES.SUPER_ADMIN]: { category: ROLE_CATEGORIES.SYSTEM, displayName: 'Super Administrator' },
  [ENTERPRISE_ROLES.BUSINESS_OWNER]: { category: ROLE_CATEGORIES.MANAGEMENT, displayName: 'Business Owner' },
  [ENTERPRISE_ROLES.BRANCH_MANAGER]: { category: ROLE_CATEGORIES.MANAGEMENT, displayName: 'Branch Manager' },
  [ENTERPRISE_ROLES.OPERATIONS_MANAGER]: { category: ROLE_CATEGORIES.OPERATIONS, displayName: 'Operations Manager' },
  [ENTERPRISE_ROLES.SALES_MANAGER]: { category: ROLE_CATEGORIES.SALES, displayName: 'Sales Manager' },
  [ENTERPRISE_ROLES.CASHIER]: { category: ROLE_CATEGORIES.SALES, displayName: 'Cashier / POS Operator' },
  [ENTERPRISE_ROLES.INVENTORY_OFFICER]: { category: ROLE_CATEGORIES.INVENTORY, displayName: 'Inventory Officer' },
  [ENTERPRISE_ROLES.PROCUREMENT_OFFICER]: { category: ROLE_CATEGORIES.INVENTORY, displayName: 'Procurement Officer' },
  [ENTERPRISE_ROLES.ACCOUNTANT]: { category: ROLE_CATEGORIES.FINANCE, displayName: 'Accountant' },
  [ENTERPRISE_ROLES.HR_MANAGER]: { category: ROLE_CATEGORIES.HR, displayName: 'HR Manager' }
}

async function seedDemoBusinessAndUser() {
  const existingBusiness = await prisma.business.findFirst({ where: { email: 'admin@ssme@gmail.com' } })
  if (existingBusiness) {
    console.log('Demo business already exists, skipping...')
    return
  }

  console.log('Seeding demo business...')
  const business = await prisma.business.create({
    data: {
      name: 'SSME Business',
      slug: 'ssme-business-main',
      email: 'admin@ssme@gmail.com',
      phone: '+254700000000',
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  })

  const allPermissions = await prisma.permission.findMany()
  const permMap = Object.fromEntries(allPermissions.map((p) => [p.key, p.id]))

  // Create all enterprise roles
  const createdRoles = {}
  for (const [roleName, permKeys] of Object.entries(ENTERPRISE_ROLE_PERMISSIONS)) {
    const metadata = ROLE_METADATA[roleName] || {}
    
    // Skip Super Admin for demo business (system-level only)
    if (roleName === ENTERPRISE_ROLES.SUPER_ADMIN) continue
    
    const role = await prisma.role.create({
      data: {
        businessId: business.id,
        name: roleName,
        displayName: metadata.displayName || roleName,
        category: metadata.category,
        isSystem: true,
        isEnabled: true,
        permissions: {
          create: permKeys.filter((k) => permMap[k]).map((k) => ({ permissionId: permMap[k] }))
        }
      }
    })
    createdRoles[roleName] = role
  }

  const branch = await prisma.branch.create({
    data: { businessId: business.id, name: 'Head Office', code: 'HQ', isHeadquarters: true }
  })

  // Create users with new format
  const demoUsers = [
    { name: 'Admin Owner', email: 'admin@ssme@gmail.com', phone: '+254700000000', password: 'admin1', role: ENTERPRISE_ROLES.BUSINESS_OWNER, isOwner: true },
    { name: 'Operations Manager', email: 'operationmanager@ssme@gmail.com', phone: '+254700000001', password: 'manager123', role: ENTERPRISE_ROLES.OPERATIONS_MANAGER },
    { name: 'Branch Manager', email: 'branchmanager@ssme@gmail.com', phone: '+254700000002', password: 'manager123', role: ENTERPRISE_ROLES.BRANCH_MANAGER },
    { name: 'Sales Manager', email: 'salesmanager@ssme@gmail.com', phone: '+254700000003', password: 'manager123', role: ENTERPRISE_ROLES.SALES_MANAGER },
    { name: 'Cashier', email: 'cashier@ssme@gmail.com', phone: '+254700000004', password: 'cashier123', role: ENTERPRISE_ROLES.CASHIER },
    { name: 'Inventory Officer', email: 'inventoryofficer@ssme@gmail.com', phone: '+254700000005', password: 'inventory123', role: ENTERPRISE_ROLES.INVENTORY_OFFICER },
    { name: 'Procurement Officer', email: 'procurementofficer@ssme@gmail.com', phone: '+254700000006', password: 'procurement123', role: ENTERPRISE_ROLES.PROCUREMENT_OFFICER },
    { name: 'Accountant', email: 'accountant@ssme@gmail.com', phone: '+254700000007', password: 'accountant123', role: ENTERPRISE_ROLES.ACCOUNTANT },
    { name: 'HR Manager', email: 'hrmanager@ssme@gmail.com', phone: '+254700000008', password: 'hrmanager123', role: ENTERPRISE_ROLES.HR_MANAGER }
  ]
  
  for (const userData of demoUsers) {
    const passwordHash = await bcrypt.hash(userData.password, 12)
    await prisma.user.create({
      data: {
        businessId: business.id,
        branchId: branch.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        passwordHash: passwordHash,
        isOwner: userData.isOwner || false,
        roleId: createdRoles[userData.role].id,
        status: 'active',
        emailVerifiedAt: new Date()
      }
    })
  }

  console.log(`✅ Created ${demoUsers.length} users with custom passwords`)
  console.log('✅ Admin login: admin@ssme@gmail.com / admin1')
  console.log('✅ Operations Manager login: operationmanager@ssme@gmail.com / manager123')

  await prisma.subscription.create({
    data: {
      businessId: business.id,
      planId: 'starter',
      planName: 'Starter (Trial)',
      status: 'trial',
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      limits: { branches: 3, users: 15, products: 5000 }
    }
  })

  await prisma.businessSetting.create({ data: { businessId: business.id } })

  // Seed chart of accounts
  const accounts = [
    { code: '1000', name: 'Cash and Cash Equivalents', type: 'asset' },
    { code: '1100', name: 'Accounts Receivable', type: 'asset' },
    { code: '1200', name: 'Inventory', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '2100', name: 'Salaries Payable', type: 'liability' },
    { code: '3000', name: "Owner's Equity", type: 'equity' },
    { code: '4000', name: 'Sales Revenue', type: 'income' },
    { code: '4100', name: 'Service Revenue', type: 'income' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
    { code: '5100', name: 'Salaries Expense', type: 'expense' },
    { code: '5200', name: 'Rent Expense', type: 'expense' },
    { code: '5300', name: 'Utilities Expense', type: 'expense' }
  ]

  for (const acc of accounts) {
    await prisma.account.create({ data: { ...acc, businessId: business.id } })
  }

  // Seed a default warehouse
  await prisma.warehouse.create({ data: { businessId: business.id, name: 'Main Warehouse', isActive: true } })

  console.log('✅ SSME business seeded successfully')
  console.log(`✅ Created ${Object.keys(createdRoles).length} core enterprise roles`)
}

async function main() {
  await seedPermissions()
  if (process.env.NODE_ENV !== 'production') {
    await seedDemoBusinessAndUser()
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
