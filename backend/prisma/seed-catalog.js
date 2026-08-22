const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedCatalogData() {
  console.log('📦 Seeding catalog, inventory, customers, and suppliers...')

  const business = await prisma.business.findFirst({
    where: { email: 'admin@ssme.com' },
    include: { branches: true, warehouses: true }
  })

  if (!business) {
    console.error('❌ Demo business not found. Run main seed first.')
    return
  }

  const branch = business.branches[0]
  const warehouse = business.warehouses[0]

  // 1. Seed Customer Groups
  const retailGroup = await prisma.customerGroup.upsert({
    where: { id: 'demo-cg-retail' },
    create: {
      id: 'demo-cg-retail',
      businessId: business.id,
      name: 'Retail Customers',
      discountPercent: 0.00
    },
    update: {}
  })

  const wholesaleGroup = await prisma.customerGroup.upsert({
    where: { id: 'demo-cg-wholesale' },
    create: {
      id: 'demo-cg-wholesale',
      businessId: business.id,
      name: 'Wholesale / B2B Clients',
      discountPercent: 10.00
    },
    update: {}
  })

  // 2. Seed Customers
  const customersData = [
    {
      name: 'Acme Enterprise Ltd',
      email: 'procurement@acme.example.com',
      phone: '+254711000001',
      groupId: wholesaleGroup.id,
      type: 'business',
      creditLimit: 250000.00,
      balance: 12500.00,
      taxNumber: 'P051234567A',
      city: 'Nairobi',
      country: 'Kenya'
    },
    {
      name: 'Jane Wanjiku Retailer',
      email: 'jane.wanjiku@example.com',
      phone: '+254711000002',
      groupId: retailGroup.id,
      type: 'individual',
      creditLimit: 50000.00,
      balance: 0.00,
      city: 'Mombasa',
      country: 'Kenya'
    },
    {
      name: 'Safari Tech Innovations',
      email: 'billing@safaritech.example.com',
      phone: '+254711000003',
      groupId: wholesaleGroup.id,
      type: 'business',
      creditLimit: 500000.00,
      balance: 45000.00,
      taxNumber: 'P059876543Z',
      city: 'Nairobi',
      country: 'Kenya'
    }
  ]

  for (const c of customersData) {
    const existing = await prisma.customer.findFirst({
      where: { businessId: business.id, email: c.email }
    })
    if (!existing) {
      await prisma.customer.create({
        data: {
          ...c,
          businessId: business.id
        }
      })
    }
  }
  console.log(`✅ Seeded ${customersData.length} customers`)

  // 3. Seed Suppliers
  const suppliersData = [
    {
      name: 'Global Electronics Distributors',
      email: 'orders@globalelectronics.example.com',
      phone: '+254722000001',
      taxNumber: 'P051112223B',
      balance: 150000.00,
      paymentTerms: 30,
      city: 'Nairobi',
      country: 'Kenya'
    },
    {
      name: 'Prime Office Supplies Co.',
      email: 'sales@primeoffice.example.com',
      phone: '+254722000002',
      taxNumber: 'P054445556C',
      balance: 32000.00,
      paymentTerms: 15,
      city: 'Kisumu',
      country: 'Kenya'
    }
  ]

  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({
      where: { businessId: business.id, email: s.email }
    })
    if (!existing) {
      await prisma.supplier.create({
        data: {
          ...s,
          businessId: business.id
        }
      })
    }
  }
  console.log(`✅ Seeded ${suppliersData.length} suppliers`)

  // 4. Seed Units
  const unitsData = [
    { name: 'Pieces', abbreviation: 'pcs' },
    { name: 'Boxes', abbreviation: 'box' },
    { name: 'Kilograms', abbreviation: 'kg' },
    { name: 'Hours', abbreviation: 'hr' }
  ]

  const unitMap = {}
  for (const u of unitsData) {
    let unit = await prisma.unit.findFirst({
      where: { businessId: business.id, abbreviation: u.abbreviation }
    })
    if (!unit) {
      unit = await prisma.unit.create({
        data: { ...u, businessId: business.id }
      })
    }
    unitMap[u.abbreviation] = unit
  }
  console.log(`✅ Seeded ${unitsData.length} units`)

  // 5. Seed Categories
  const categoriesData = [
    { name: 'Computers & Accessories', description: 'Laptops, desktops, and computer peripherals' },
    { name: 'Network & Security', description: 'Switches, routers, and network cables' },
    { name: 'Office Supplies', description: 'Paper, stationery, and office equipment' },
    { name: 'Professional Services', description: 'IT and business consulting services' }
  ]

  const categoryMap = {}
  for (const cat of categoriesData) {
    let category = await prisma.category.findFirst({
      where: { businessId: business.id, name: cat.name }
    })
    if (!category) {
      category = await prisma.category.create({
        data: { ...cat, businessId: business.id }
      })
    }
    categoryMap[cat.name] = category
  }
  console.log(`✅ Seeded ${categoriesData.length} categories`)

  // 6. Seed Products and Inventory Stock
  const productsData = [
    {
      name: 'Wireless Ergonomic Mouse',
      sku: 'SKU-LOGI-M720',
      barcode: '616110001001',
      categoryName: 'Computers & Accessories',
      unitKey: 'pcs',
      costPrice: 2200.00,
      sellingPrice: 3500.00,
      stockQuantity: 45,
      reorderPoint: 10,
      trackInventory: true
    },
    {
      name: 'Mechanical Gaming Keyboard RGB',
      sku: 'SKU-KEY-RGB104',
      barcode: '616110001002',
      categoryName: 'Computers & Accessories',
      unitKey: 'pcs',
      costPrice: 4500.00,
      sellingPrice: 6800.00,
      stockQuantity: 28,
      reorderPoint: 5,
      trackInventory: true
    },
    {
      name: 'Gigabit 24-Port Managed Switch',
      sku: 'SKU-NET-SW24G',
      barcode: '616110002001',
      categoryName: 'Network & Security',
      unitKey: 'pcs',
      costPrice: 18000.00,
      sellingPrice: 26500.00,
      stockQuantity: 12,
      reorderPoint: 3,
      trackInventory: true
    },
    {
      name: 'A4 Printing Paper (Box of 5 Reams)',
      sku: 'SKU-OFF-A4BOX',
      barcode: '616110003001',
      categoryName: 'Office Supplies',
      unitKey: 'box',
      costPrice: 2400.00,
      sellingPrice: 3200.00,
      stockQuantity: 80,
      reorderPoint: 20,
      trackInventory: true
    },
    {
      name: 'IT Network Consultation & Setup',
      sku: 'SRV-NET-CONSULT',
      barcode: '616110004001',
      categoryName: 'Professional Services',
      unitKey: 'hr',
      costPrice: 1000.00,
      sellingPrice: 5000.00,
      stockQuantity: 0,
      reorderPoint: 0,
      trackInventory: false
    }
  ]

  for (const p of productsData) {
    let product = await prisma.product.findFirst({
      where: { businessId: business.id, sku: p.sku }
    })

    if (!product) {
      product = await prisma.product.create({
        data: {
          businessId: business.id,
          categoryId: categoryMap[p.categoryName]?.id,
          unitId: unitMap[p.unitKey]?.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          reorderPoint: p.reorderPoint,
          trackInventory: p.trackInventory,
          isActive: true
        }
      })

      // If warehouse exists and tracking inventory, create inventory stock record
      if (warehouse && p.trackInventory) {
        const existingStock = await prisma.inventoryStock.findFirst({
          where: {
            warehouseId: warehouse.id,
            productId: product.id
          }
        })
        if (!existingStock) {
          await prisma.inventoryStock.create({
            data: {
              warehouseId: warehouse.id,
              productId: product.id,
              branchId: branch ? branch.id : undefined,
              quantity: p.stockQuantity
            }
          })
        }
      }
    }
  }
  console.log(`✅ Seeded ${productsData.length} products with inventory stocks`)

  // 7. Seed POS Configuration
  if (branch) {
    await prisma.posConfiguration.upsert({
      where: { businessId_branchId: { businessId: business.id, branchId: branch.id } },
      create: {
        businessId: business.id,
        branchId: branch.id,
        autoOpenCashDrawer: true,
        autoPrintReceipt: true,
        allowNegativeStock: false,
        requireCustomer: false,
        taxRate: 16.00,
        receiptHeader: 'SSME Business - HQ Branch\nTel: +254700000000',
        receiptFooter: 'Thank you for your business! Goods once sold cannot be returned without receipt.'
      },
      update: {}
    })
    console.log('✅ Configured POS settings for HQ branch')
  }

  console.log('🎉 Catalog and inventory seeding completed successfully!')
}

seedCatalogData()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
