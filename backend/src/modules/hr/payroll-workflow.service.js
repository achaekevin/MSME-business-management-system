/**
 * Comprehensive Payroll Workflow Service
 * 
 * Workflow:
 * 1. Attendance is recorded
 * 2. Leave is deducted
 * 3. Overtime is calculated
 * 4. Payroll is generated
 * 5. Payslip is created
 * 6. Salary expense is posted to accounting
 */

const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const logger = require('../../config/logger')
const dayjs = require('dayjs')

// ============================================================================
// STEP 1: Calculate Work Days (Attendance + Leave)
// ============================================================================

/**
 * Calculate employee work days for a period
 * Considers: attendance records, approved leaves, weekends, holidays
 */
async function calculateWorkDays(employeeId, startDate, endDate) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      attendanceRecords: {
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      leaveRequests: {
        where: {
          status: 'approved',
          OR: [
            {
              startDate: {
                gte: startDate,
                lte: endDate
              }
            },
            {
              endDate: {
                gte: startDate,
                lte: endDate
              }
            }
          ]
        }
      }
    }
  })

  if (!employee) throw ApiError.notFound('Employee not found')

  // Calculate total working days in period
  const totalDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1
  
  // Count weekends (Saturday, Sunday)
  let weekendDays = 0
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) weekendDays++
  }

  const totalWorkingDays = totalDays - weekendDays

  // Present days from attendance
  const presentDays = employee.attendanceRecords.filter(
    r => ['present', 'late'].includes(r.status)
  ).length

  // Half days count as 0.5
  const halfDays = employee.attendanceRecords.filter(
    r => r.status === 'half_day'
  ).length

  // Calculate leave days
  const leaveDays = employee.leaveRequests.reduce((sum, leave) => {
    return sum + Number(leave.days)
  }, 0)

  // Absent days
  const absentDays = employee.attendanceRecords.filter(
    r => r.status === 'absent'
  ).length

  // Calculate paid days (present + half days + approved leaves)
  const paidDays = presentDays + (halfDays * 0.5) + leaveDays

  return {
    totalDays,
    totalWorkingDays,
    presentDays,
    halfDays,
    leaveDays,
    absentDays,
    paidDays,
    unpaidDays: totalWorkingDays - paidDays
  }
}

// ============================================================================
// STEP 2: Calculate Overtime
// ============================================================================

/**
 * Calculate overtime hours and payment
 */
async function calculateOvertime(employeeId, startDate, endDate, hourlyRate) {
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  // Sum overtime hours
  const totalOvertimeHours = attendanceRecords.reduce((sum, record) => {
    return sum + Number(record.overtime || 0)
  }, 0)

  // Get overtime policy (typically 1.5x or 2x regular rate)
  const overtimeMultiplier = 1.5 // Standard overtime multiplier

  const overtimeAmount = totalOvertimeHours * hourlyRate * overtimeMultiplier

  return {
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    overtimeRate: hourlyRate * overtimeMultiplier,
    overtimeAmount: Math.round(overtimeAmount * 100) / 100
  }
}

// ============================================================================
// STEP 3: Calculate Salary Components
// ============================================================================

/**
 * Calculate all salary components (earnings + deductions)
 */
async function calculateSalaryComponents(employee, paidDays, totalWorkingDays, overtimeAmount) {
  // Get employee's payroll components
  const employeeComponents = await prisma.employeePayrollComponent.findMany({
    where: {
      employeeId: employee.id,
      isActive: true
    },
    include: {
      component: true
    }
  })

  // Calculate basic salary (prorated)
  const basicSalary = Number(employee.salary)
  const dailyRate = employee.salaryType === 'monthly' ? basicSalary / 30 : basicSalary
  const proratedBasic = employee.salaryType === 'monthly'
    ? dailyRate * paidDays
    : dailyRate * paidDays

  // Calculate earnings
  const earnings = [{
    component: 'Basic Salary',
    amount: Math.round(proratedBasic * 100) / 100
  }]

  let totalEarnings = proratedBasic

  // Add overtime
  if (overtimeAmount > 0) {
    earnings.push({
      component: 'Overtime',
      amount: overtimeAmount
    })
    totalEarnings += overtimeAmount
  }

  // Process other earnings
  for (const empComp of employeeComponents) {
    if (empComp.component.type === 'earning' && empComp.component.isActive) {
      let amount = 0

      if (empComp.amount) {
        amount = Number(empComp.amount)
      } else if (empComp.percentage) {
        amount = proratedBasic * Number(empComp.percentage) / 100
      }

      earnings.push({
        component: empComp.component.name,
        amount: Math.round(amount * 100) / 100
      })
      totalEarnings += amount
    }
  }

  // Calculate deductions
  const deductions = []
  let totalDeductions = 0

  for (const empComp of employeeComponents) {
    if (empComp.component.type === 'deduction' && empComp.component.isActive) {
      let amount = 0

      if (empComp.amount) {
        amount = Number(empComp.amount)
      } else if (empComp.percentage) {
        amount = proratedBasic * Number(empComp.percentage) / 100
      }

      deductions.push({
        component: empComp.component.name,
        amount: Math.round(amount * 100) / 100
      })
      totalDeductions += amount
    }
  }

  const grossPay = Math.round(totalEarnings * 100) / 100
  const netPay = Math.round((grossPay - totalDeductions) * 100) / 100

  return {
    basicSalary: Math.round(proratedBasic * 100) / 100,
    earnings,
    deductions,
    grossPay,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay
  }
}

// ============================================================================
// STEP 4: Generate Complete Payroll for Period
// ============================================================================

/**
 * Process complete payroll for a period
 * Integrates: attendance, leave, overtime, salary calculation
 */
async function generatePayrollForPeriod(periodId, processedBy) {
  return await prisma.$transaction(async (tx) => {
    const period = await tx.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { business: true }
    })

    if (!period) throw ApiError.notFound('Payroll period not found')
    if (period.status !== 'draft') {
      throw ApiError.badRequest('Payroll period must be in draft status')
    }

    logger.info(`Starting payroll generation for period ${period.name}`)

    // Get all active employees
    const employees = await tx.employee.findMany({
      where: {
        businessId: period.businessId,
        status: 'active'
      },
      include: {
        department: { select: { name: true } },
        position: { select: { title: true } }
      }
    })

    const payslips = []
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0
    let processedCount = 0
    let failedCount = 0
    const errors = []

    for (const employee of employees) {
      try {
        // STEP 1: Calculate work days (attendance + leave)
        const workDays = await calculateWorkDays(
          employee.id,
          period.startDate,
          period.endDate
        )

        // STEP 2: Calculate overtime
        const hourlyRate = employee.salaryType === 'monthly'
          ? Number(employee.salary) / 30 / 8
          : Number(employee.salary) / 8

        const overtime = await calculateOvertime(
          employee.id,
          period.startDate,
          period.endDate,
          hourlyRate
        )

        // STEP 3: Calculate salary components
        const salary = await calculateSalaryComponents(
          employee,
          workDays.paidDays,
          workDays.totalWorkingDays,
          overtime.overtimeAmount
        )

        // STEP 4: Create payslip
        const payslip = await tx.payrollSlip.create({
          data: {
            payrollPeriodId: periodId,
            employeeId: employee.id,
            basicSalary: salary.basicSalary,
            earnings: JSON.stringify(salary.earnings),
            deductions: JSON.stringify(salary.deductions),
            grossPay: salary.grossPay,
            totalDeductions: salary.totalDeductions,
            netPay: salary.netPay,
            workDays: workDays.totalWorkingDays,
            paidDays: workDays.paidDays,
            leaveDays: workDays.leaveDays,
            absentDays: workDays.absentDays,
            overtimeHours: overtime.totalOvertimeHours,
            overtimeAmount: overtime.overtimeAmount
          }
        })

        payslips.push(payslip)
        totalGross += salary.grossPay
        totalDeductions += salary.totalDeductions
        totalNet += salary.netPay
        processedCount++

        logger.info(`Generated payslip for employee ${employee.name} (${employee.employeeNumber})`)

      } catch (error) {
        failedCount++
        errors.push({
          employeeId: employee.id,
          employeeName: employee.name,
          error: error.message
        })
        logger.error(`Failed to generate payslip for employee ${employee.name}:`, error)
      }
    }

    // Update period status and totals
    await tx.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: 'processed',
        totalGross: Math.round(totalGross * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        processedBy,
        processedAt: new Date()
      }
    })

    logger.info(`Payroll generation completed: ${processedCount} success, ${failedCount} failed`)

    return {
      period,
      processedCount,
      failedCount,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      errors: errors.length > 0 ? errors : undefined
    }
  })
}

// ============================================================================
// STEP 5: Post Salary Expense to Accounting
// ============================================================================

/**
 * Post payroll journal entry to accounting system
 * Debit: Salary Expense
 * Credit: Salaries Payable / Cash / Bank
 */
async function postPayrollToAccounting(periodId, postedBy) {
  return await prisma.$transaction(async (tx) => {
    const period = await tx.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        business: true,
        payslips: {
          include: {
            employee: {
              select: {
                name: true,
                employeeNumber: true,
                department: { select: { name: true } }
              }
            }
          }
        }
      }
    })

    if (!period) throw ApiError.notFound('Payroll period not found')
    if (period.status !== 'approved') {
      throw ApiError.badRequest('Payroll must be approved before posting to accounting')
    }
    if (period.accountingStatus === 'posted') {
      throw ApiError.badRequest('Payroll already posted to accounting')
    }

    logger.info(`Posting payroll to accounting for period ${period.name}`)

    // Get or create accounting accounts
    const salaryExpenseAccount = await tx.account.findFirst({
      where: {
        businessId: period.businessId,
        code: '5100', // Salary Expense
        type: 'expense'
      }
    })

    const salariesPayableAccount = await tx.account.findFirst({
      where: {
        businessId: period.businessId,
        code: '2100', // Salaries Payable
        type: 'liability'
      }
    })

    if (!salaryExpenseAccount || !salariesPayableAccount) {
      throw ApiError.badRequest('Required accounting accounts not found. Please set up Salary Expense (5100) and Salaries Payable (2100) accounts.')
    }

    // Create journal entry
    const journalEntry = await tx.journalEntry.create({
      data: {
        businessId: period.businessId,
        date: new Date(),
        type: 'payroll',
        reference: `PAYROLL-${period.name}`,
        description: `Payroll for period ${period.name}`,
        totalDebit: period.totalNet,
        totalCredit: period.totalNet,
        status: 'posted',
        postedBy,
        postedAt: new Date()
      }
    })

    // Create journal entry lines
    // Debit: Salary Expense
    await tx.journalLine.create({
      data: {
        entryId: journalEntry.id,
        accountId: salaryExpenseAccount.id,
        debit: period.totalNet,
        credit: 0,
        memo: `Salary expense for ${period.name}`
      }
    })

    // Credit: Salaries Payable
    await tx.journalLine.create({
      data: {
        entryId: journalEntry.id,
        accountId: salariesPayableAccount.id,
        debit: 0,
        credit: period.totalNet,
        memo: `Salaries payable for ${period.name}`
      }
    })

    // Update period accounting status
    await tx.payrollPeriod.update({
      where: { id: periodId },
      data: {
        accountingStatus: 'posted',
        journalEntryId: journalEntry.id,
        postedToAccountingAt: new Date(),
        postedToAccountingBy: postedBy
      }
    })

    logger.info(`Payroll posted to accounting: Journal Entry ${journalEntry.reference}`)

    return {
      period,
      journalEntry,
      message: 'Payroll successfully posted to accounting'
    }
  })
}

// ============================================================================
// COMPLETE PAYROLL WORKFLOW
// ============================================================================

/**
 * Execute complete payroll workflow
 * 1. Generate payroll (attendance + leave + overtime)
 * 2. Approve payroll
 * 3. Post to accounting
 */
async function executeCompletePayrollWorkflow(periodId, userId) {
  try {
    logger.info(`Starting complete payroll workflow for period ${periodId}`)

    // Step 1: Generate payroll
    const payrollResult = await generatePayrollForPeriod(periodId, userId)
    
    if (payrollResult.failedCount > 0) {
      logger.warn(`Payroll generation had ${payrollResult.failedCount} failures`)
    }

    // Step 2: Auto-approve (in production, this might need manual approval)
    await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date()
      }
    })

    // Step 3: Post to accounting
    const accountingResult = await postPayrollToAccounting(periodId, userId)

    logger.info(`Complete payroll workflow executed successfully for period ${periodId}`)

    return {
      success: true,
      payroll: payrollResult,
      accounting: accountingResult,
      message: 'Complete payroll workflow executed successfully'
    }

  } catch (error) {
    logger.error(`Payroll workflow failed for period ${periodId}:`, error)
    throw error
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get detailed payslip with all calculations
 */
async function getDetailedPayslip(payslipId) {
  const payslip = await prisma.payrollSlip.findUnique({
    where: { id: payslipId },
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          email: true,
          department: { select: { name: true } },
          position: { select: { title: true } },
          salary: true,
          salaryType: true
        }
      },
      payrollPeriod: {
        include: {
          business: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true
            }
          }
        }
      }
    }
  })

  if (!payslip) throw ApiError.notFound('Payslip not found')

  return {
    ...payslip,
    earnings: JSON.parse(payslip.earnings || '[]'),
    deductions: JSON.parse(payslip.deductions || '[]')
  }
}

/**
 * Calculate payroll summary for reporting
 */
async function getPayrollSummary(businessId, year, month) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const periods = await prisma.payrollPeriod.findMany({
    where: {
      businessId,
      startDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      payslips: true,
      _count: {
        select: { payslips: true }
      }
    }
  })

  const summary = {
    totalPeriods: periods.length,
    totalEmployees: periods.reduce((sum, p) => sum + p._count.payslips, 0),
    totalGross: periods.reduce((sum, p) => sum + Number(p.totalGross || 0), 0),
    totalDeductions: periods.reduce((sum, p) => sum + Number(p.totalDeductions || 0), 0),
    totalNet: periods.reduce((sum, p) => sum + Number(p.totalNet || 0), 0),
    periods: periods.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      accountingStatus: p.accountingStatus,
      employeeCount: p._count.payslips,
      totalNet: Number(p.totalNet || 0)
    }))
  }

  return summary
}

module.exports = {
  // Core workflow functions
  calculateWorkDays,
  calculateOvertime,
  calculateSalaryComponents,
  generatePayrollForPeriod,
  postPayrollToAccounting,
  executeCompletePayrollWorkflow,

  // Utility functions
  getDetailedPayslip,
  getPayrollSummary
}
