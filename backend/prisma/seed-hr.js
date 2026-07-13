const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedHR() {
  console.log('🌱 Seeding HR data...')

  try {
    // Get the first business
    const business = await prisma.business.findFirst()
    
    if (!business) {
      console.log('❌ No business found. Please run main seed first.')
      return
    }

    console.log(`✅ Using business: ${business.name}`)

    // 1. Create Leave Types
    console.log('Creating leave types...')
    const leaveTypes = await Promise.all([
      prisma.leaveType.upsert({
        where: { businessId_code: { businessId: business.id, code: 'ANNUAL' } },
        create: {
          businessId: business.id,
          name: 'Annual Leave',
          code: 'ANNUAL',
          daysAllowed: 21,
          carryForward: true,
          requiresApproval: true,
          isPaid: true,
          description: 'Annual paid leave'
        },
        update: {}
      }),
      prisma.leaveType.upsert({
        where: { businessId_code: { businessId: business.id, code: 'SICK' } },
        create: {
          businessId: business.id,
          name: 'Sick Leave',
          code: 'SICK',
          daysAllowed: 14,
          carryForward: false,
          requiresApproval: false,
          isPaid: true,
          description: 'Sick leave with medical certificate'
        },
        update: {}
      }),
      prisma.leaveType.upsert({
        where: { businessId_code: { businessId: business.id, code: 'MATERNITY' } },
        create: {
          businessId: business.id,
          name: 'Maternity Leave',
          code: 'MATERNITY',
          daysAllowed: 90,
          carryForward: false,
          requiresApproval: true,
          isPaid: true,
          description: 'Maternity leave'
        },
        update: {}
      }),
      prisma.leaveType.upsert({
        where: { businessId_code: { businessId: business.id, code: 'UNPAID' } },
        create: {
          businessId: business.id,
          name: 'Unpaid Leave',
          code: 'UNPAID',
          daysAllowed: 30,
          carryForward: false,
          requiresApproval: true,
          isPaid: false,
          description: 'Unpaid leave'
        },
        update: {}
      })
    ])
    console.log(`✅ Created ${leaveTypes.length} leave types`)

    // 2. Create Attendance Policy
    console.log('Creating attendance policy...')
    const attendancePolicy = await prisma.attendancePolicy.upsert({
      where: { id: 'default-policy' },
      create: {
        id: 'default-policy',
        businessId: business.id,
        name: 'Standard Working Hours',
        workingDaysPerWeek: 5,
        workingHoursPerDay: 8,
        startTime: '09:00',
        endTime: '17:00',
        graceMinutes: 15,
        halfDayHours: 4,
        weekendDays: JSON.stringify(['Saturday', 'Sunday']),
        isDefault: true
      },
      update: {}
    })
    console.log(`✅ Created attendance policy: ${attendancePolicy.name}`)

    // 3. Create Payroll Components
    console.log('Creating payroll components...')
    const payrollComponents = await Promise.all([
      prisma.payrollComponent.upsert({
        where: { businessId_code: { businessId: business.id, code: 'HRA' } },
        create: {
          businessId: business.id,
          name: 'House Rent Allowance',
          code: 'HRA',
          type: 'earning',
          calculation: 'percentage',
          percentage: 20,
          isTaxable: true,
          isStatutory: false,
          description: '20% of basic salary'
        },
        update: {}
      }),
      prisma.payrollComponent.upsert({
        where: { businessId_code: { businessId: business.id, code: 'TA' } },
        create: {
          businessId: business.id,
          name: 'Transport Allowance',
          code: 'TA',
          type: 'earning',
          calculation: 'fixed',
          amount: 5000,
          isTaxable: true,
          isStatutory: false,
          description: 'Fixed transport allowance'
        },
        update: {}
      }),
      prisma.payrollComponent.upsert({
        where: { businessId_code: { businessId: business.id, code: 'NHIF' } },
        create: {
          businessId: business.id,
          name: 'NHIF Deduction',
          code: 'NHIF',
          type: 'deduction',
          calculation: 'percentage',
          percentage: 2.5,
          isTaxable: false,
          isStatutory: true,
          description: 'National Hospital Insurance Fund'
        },
        update: {}
      }),
      prisma.payrollComponent.upsert({
        where: { businessId_code: { businessId: business.id, code: 'NSSF' } },
        create: {
          businessId: business.id,
          name: 'NSSF Deduction',
          code: 'NSSF',
          type: 'deduction',
          calculation: 'percentage',
          percentage: 6,
          isTaxable: false,
          isStatutory: true,
          description: 'National Social Security Fund'
        },
        update: {}
      }),
      prisma.payrollComponent.upsert({
        where: { businessId_code: { businessId: business.id, code: 'PAYE' } },
        create: {
          businessId: business.id,
          name: 'PAYE Tax',
          code: 'PAYE',
          type: 'deduction',
          calculation: 'percentage',
          percentage: 15,
          isTaxable: false,
          isStatutory: true,
          description: 'Pay As You Earn tax'
        },
        update: {}
      })
    ])
    console.log(`✅ Created ${payrollComponents.length} payroll components`)

    // 4. Create Performance Metrics
    console.log('Creating performance metrics...')
    const performanceMetrics = await Promise.all([
      prisma.performanceMetric.create({
        data: {
          businessId: business.id,
          name: 'Quality of Work',
          description: 'Accuracy and thoroughness of work',
          category: 'quality',
          weight: 1.5
        }
      }),
      prisma.performanceMetric.create({
        data: {
          businessId: business.id,
          name: 'Productivity',
          description: 'Volume and efficiency of work output',
          category: 'productivity',
          weight: 1.5
        }
      }),
      prisma.performanceMetric.create({
        data: {
          businessId: business.id,
          name: 'Teamwork',
          description: 'Collaboration and communication with team',
          category: 'behavior',
          weight: 1.0
        }
      }),
      prisma.performanceMetric.create({
        data: {
          businessId: business.id,
          name: 'Initiative',
          description: 'Proactiveness and problem-solving',
          category: 'behavior',
          weight: 1.0
        }
      }),
      prisma.performanceMetric.create({
        data: {
          businessId: business.id,
          name: 'Goal Achievement',
          description: 'Achievement of set objectives',
          category: 'goals',
          weight: 2.0
        }
      })
    ])
    console.log(`✅ Created ${performanceMetrics.length} performance metrics`)

    // 5. Create Performance Cycle
    console.log('Creating performance cycle...')
    const performanceCycle = await prisma.performanceCycle.create({
      data: {
        businessId: business.id,
        name: 'Annual Review 2026',
        cycleType: 'annual',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'active',
        description: 'Annual performance review for 2026'
      }
    })
    console.log(`✅ Created performance cycle: ${performanceCycle.name}`)

    // 6. Create Document Types
    console.log('Creating document types...')
    const documentTypes = await Promise.all([
      prisma.documentType.upsert({
        where: { businessId_code: { businessId: business.id, code: 'ID' } },
        create: {
          businessId: business.id,
          name: 'National ID',
          code: 'ID',
          required: true,
          expiryTracking: false,
          description: 'National identification document'
        },
        update: {}
      }),
      prisma.documentType.upsert({
        where: { businessId_code: { businessId: business.id, code: 'CONTRACT' } },
        create: {
          businessId: business.id,
          name: 'Employment Contract',
          code: 'CONTRACT',
          required: true,
          expiryTracking: false,
          description: 'Signed employment contract'
        },
        update: {}
      }),
      prisma.documentType.upsert({
        where: { businessId_code: { businessId: business.id, code: 'CERT' } },
        create: {
          businessId: business.id,
          name: 'Academic Certificate',
          code: 'CERT',
          required: false,
          expiryTracking: false,
          description: 'Educational certificates and diplomas'
        },
        update: {}
      }),
      prisma.documentType.upsert({
        where: { businessId_code: { businessId: business.id, code: 'MEDICAL' } },
        create: {
          businessId: business.id,
          name: 'Medical Certificate',
          code: 'MEDICAL',
          required: true,
          expiryTracking: true,
          description: 'Medical fitness certificate'
        },
        update: {}
      })
    ])
    console.log(`✅ Created ${documentTypes.length} document types`)

    console.log('✅ HR data seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding HR data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedHR()
}

module.exports = { seedHR }
