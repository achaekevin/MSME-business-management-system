const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedFinanceData() {
  console.log('Seeding finance and accounting data...')

  // Get the first business
  const business = await prisma.business.findFirst()
  if (!business) {
    console.log('No business found. Run main seed first.')
    return
  }

  console.log(`Seeding data for business: ${business.name}`)

  // 1. Create Income Categories
  const incomeCategories = await Promise.all([
    prisma.incomeCategory.create({
      data: { businessId: business.id, name: 'Sales Revenue', description: 'Revenue from product sales' }
    }),
    prisma.incomeCategory.create({
      data: { businessId: business.id, name: 'Service Revenue', description: 'Revenue from services' }
    }),
    prisma.incomeCategory.create({
      data: { businessId: business.id, name: 'Interest Income', description: 'Interest earned' }
    }),
    prisma.incomeCategory.create({
      data: { businessId: business.id, name: 'Other Income', description: 'Miscellaneous income' }
    })
  ])
  console.log(`✅ Created ${incomeCategories.length} income categories`)

  // 2. Create Expense Categories
  const expenseCategories = await Promise.all([
    prisma.expenseCategory.create({
      data: { businessId: business.id, name: 'Rent', description: 'Office and warehouse rent' }
    }),
    prisma.expenseCategory.create({
      data: { businessId: business.id, name: 'Utilities', description: 'Electricity, water, internet' }
    }),
    prisma.expenseCategory.create({
      data: { businessId: business.id, name: 'Salaries', description: 'Employee salaries and wages' }
    }),
    prisma.expenseCategory.create({
      data: { businessId: business.id, name: 'Marketing', description: 'Advertising and promotion' }
    }),
    prisma.expenseCategory.create({
      data: { businessId: business.id, name: 'Office Supplies', description: 'Stationery and supplies' }
    }),
    prisma.expenseCategory.create({
      data: { businessId: business.id, name: 'Transportation', description: 'Vehicle fuel and maintenance' }
    })
  ])
  console.log(`✅ Created ${expenseCategories.length} expense categories`)

  // 3. Create Tax Rates
  const taxRates = await Promise.all([
    prisma.taxRate.create({
      data: {
        businessId: business.id,
        name: 'VAT Standard',
        rate: 16.00,
        taxType: 'vat',
        isDefault: true,
        applicableOn: 'both',
        description: 'Standard VAT rate'
      }
    }),
    prisma.taxRate.create({
      data: {
        businessId: business.id,
        name: 'VAT Reduced',
        rate: 8.00,
        taxType: 'vat',
        applicableOn: 'both',
        description: 'Reduced VAT rate for essential goods'
      }
    }),
    prisma.taxRate.create({
      data: {
        businessId: business.id,
        name: 'VAT Zero',
        rate: 0.00,
        taxType: 'vat',
        applicableOn: 'both',
        description: 'Zero-rated VAT'
      }
    })
  ])
  console.log(`✅ Created ${taxRates.length} tax rates`)

  // 4. Create Cash Account
  const cashAccount = await prisma.cashAccount.create({
    data: {
      businessId: business.id,
      name: 'Main Cash Account',
      accountType: 'cash',
      balance: 50000.00,
      currency: business.currency
    }
  })
  console.log(`✅ Created cash account: ${cashAccount.name}`)

  // 5. Create Fixed Assets
  const fixedAssets = await Promise.all([
    prisma.fixedAsset.create({
      data: {
        businessId: business.id,
        assetNumber: 'AST-0001',
        name: 'Office Computer - Dell Latitude',
        category: 'computer',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 80000.00,
        residualValue: 10000.00,
        usefulLife: 48, // 4 years in months
        depreciationMethod: 'straight_line',
        depreciationPeriod: 'monthly',
        currentValue: 80000.00,
        status: 'active'
      }
    }),
    prisma.fixedAsset.create({
      data: {
        businessId: business.id,
        assetNumber: 'AST-0002',
        name: 'Delivery Vehicle - Toyota Hilux',
        category: 'vehicle',
        purchaseDate: new Date('2024-03-01'),
        purchasePrice: 3500000.00,
        residualValue: 500000.00,
        usefulLife: 60, // 5 years in months
        depreciationMethod: 'straight_line',
        depreciationPeriod: 'monthly',
        currentValue: 3500000.00,
        status: 'active'
      }
    }),
    prisma.fixedAsset.create({
      data: {
        businessId: business.id,
        assetNumber: 'AST-0003',
        name: 'Office Furniture Set',
        category: 'furniture',
        purchaseDate: new Date('2024-02-10'),
        purchasePrice: 150000.00,
        residualValue: 20000.00,
        usefulLife: 60, // 5 years in months
        depreciationMethod: 'straight_line',
        depreciationPeriod: 'monthly',
        currentValue: 150000.00,
        status: 'active'
      }
    })
  ])
  console.log(`✅ Created ${fixedAssets.length} fixed assets`)

  // 6. Create Budget for Current Year
  const currentYear = new Date().getFullYear()
  const budget = await prisma.budget.create({
    data: {
      businessId: business.id,
      name: `Annual Budget ${currentYear}`,
      description: `Operating budget for fiscal year ${currentYear}`,
      budgetType: 'annual',
      fiscalYear: currentYear.toString(),
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      totalBudget: 5000000.00,
      status: 'active'
    }
  })

  // Create budget items
  const budgetItems = await Promise.all([
    prisma.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: 'revenue',
        subcategory: 'Sales',
        description: 'Product sales revenue',
        budgetedAmount: 6000000.00
      }
    }),
    prisma.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: 'expense',
        subcategory: 'Rent',
        description: 'Office rent',
        budgetedAmount: 600000.00
      }
    }),
    prisma.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: 'expense',
        subcategory: 'Salaries',
        description: 'Staff salaries',
        budgetedAmount: 2400000.00
      }
    }),
    prisma.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: 'expense',
        subcategory: 'Marketing',
        description: 'Marketing and advertising',
        budgetedAmount: 400000.00
      }
    }),
    prisma.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: 'expense',
        subcategory: 'Utilities',
        description: 'Electricity, water, internet',
        budgetedAmount: 180000.00
      }
    })
  ])
  console.log(`✅ Created budget with ${budgetItems.length} items`)

  console.log('✅ Finance data seeding completed!')
}

seedFinanceData()
  .catch(e => {
    console.error('Error seeding finance data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
