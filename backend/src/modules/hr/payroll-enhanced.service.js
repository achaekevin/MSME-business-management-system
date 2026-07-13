const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// PAYROLL COMPONENTS
// ============================================================================

async function createPayrollComponent(businessId, data) {
  return await prisma.payrollComponent.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getPayrollComponents(businessId, type) {
  const where = { businessId, isActive: true }
  if (type) where.type = type

  return await prisma.payrollComponent.findMany({
    where,
    orderBy: { name: 'asc' }
  })
}

async function updatePayrollComponent(id, data) {
  return await prisma.payrollComponent.update({
    where: { id },
    data
  })
}

// ============================================================================
// EMPLOYEE PAYROLL COMPONENTS
// ============================================================================

async function assignComponentToEmployee(employeeId, componentId, data) {
  return await prisma.employeePayrollComponent.create({
    data: {
      employeeId,
      componentId,
      ...data
    }
  })
}

async function getEmployeeComponents(employeeId) {
  return await prisma.employeePayrollComponent.findMany({
    where: { employeeId, isActive: true },
    include: {
      component: true
    }
  })
}

async function updateEmployeeComponent(id, data) {
  return await prisma.employeePayrollComponent.update({
    where: { id },
    data
  })
}

// ============================================================================
// PAYROLL PERIODS
// ============================================================================

async function createPayrollPeriod(businessId, data) {
  return await prisma.payrollPeriod.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getPayrollPeriods(businessId, filters = {}) {
  const where = { businessId }
  if (filters.status) where.status = filters.status

  return await prisma.payrollPeriod.findMany({
    where,
    include: {
      _count: {
        select: { payslips: true }
      }
    },
    orderBy: { startDate: 'desc' }
  })
}

async function processPayroll(periodId, processedBy) {
  return await prisma.$transaction(async (tx) => {
    const period = await tx.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { business: true }
    })

    if (!period) throw ApiError.notFound('Payroll period not found')
    if (period.status !== 'draft') {
      throw ApiError.badRequest('Payroll period is not in draft status')
    }

    // Get all active employees
    const employees = await tx.employee.findMany({
      where: {
        businessId: period.businessId,
        status: 'active'
      },
      include: {
        payrollComponents: {
          where: { isActive: true },
          include: { component: true }
        },
        attendanceRecords: {
          where: {
            date: {
              gte: period.startDate,
              lte: period.endDate
            }
          }
        },
        leaveRequests: {
          where: {
            status: 'approved',
            startDate: {
              gte: period.startDate,
              lte: period.endDate
            }
          }
        }
      }
    })

    const payslips = []
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    for (const employee of employees) {
      // Calculate work days
      const totalDays = Math.ceil(
        (period.endDate - period.startDate) / (1000 * 60 * 60 * 24)
      ) + 1
      
      const presentDays = employee.attendanceRecords.filter(
        r => ['present', 'late', 'half_day'].includes(r.status)
      ).length

      const leaveDays = employee.leaveRequests.reduce((sum, req) => {
        return sum + Number(req.days)
      }, 0)

      const paidDays = presentDays + leaveDays

      // Calculate basic salary (prorated if needed)
      const basicSalary = Number(employee.salary)
      const dailyRate = employee.salaryType === 'monthly' 
        ? basicSalary / 30 
        : basicSalary

      const proratedBasic = employee.salaryType === 'monthly'
        ? (dailyRate * paidDays)
        : (dailyRate * presentDays)

      // Calculate earnings
      const earnings = []
      let totalEarnings = proratedBasic

      for (const empComp of employee.payrollComponents) {
        if (empComp.component.type === 'earning') {
          const amount = empComp.amount 
            ? Number(empComp.amount)
            : (proratedBasic * Number(empComp.percentage || 0) / 100)
          
          earnings.push({
            component: empComp.component.name,
            amount
          })
          totalEarnings += amount
        }
      }

      // Calculate deductions
      const deductions = []
      let totalDeduction = 0

      for (const empComp of employee.payrollComponents) {
        if (empComp.component.type === 'deduction') {
          const amount = empComp.amount
            ? Number(empComp.amount)
            : (proratedBasic * Number(empComp.percentage || 0) / 100)
          
          deductions.push({
            component: empComp.component.name,
            amount
          })
          totalDeduction += amount
        }
      }

      // Calculate overtime
      const overtimeHours = employee.attendanceRecords.reduce((sum, r) => {
        return sum + Number(r.overtime || 0)
      }, 0)

      const grossPay = totalEarnings
      const netPay = grossPay - totalDeduction

      const payslip = await tx.payrollSlip.create({
        data: {
          payrollPeriodId: periodId,
          employeeId: employee.id,
          basicSalary: proratedBasic,
          earnings: JSON.stringify(earnings),
          deductions: JSON.stringify(deductions),
          grossPay,
          totalDeductions: totalDeduction,
          netPay,
          workDays: totalDays,
          paidDays,
          leaveDays,
          overtimeHours
        }
      })

      payslips.push(payslip)
      totalGross += grossPay
      totalDeductions += totalDeduction
      totalNet += netPay
    }

    // Update period totals
    await tx.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: 'processing',
        totalGross,
        totalDeductions,
        totalNet,
        processedBy,
        processedAt: new Date()
      }
    })

    return {
      period,
      payslipsCount: payslips.length,
      totalGross,
      totalDeductions,
      totalNet
    }
  })
}

async function approvePayroll(periodId, approvedBy) {
  return await prisma.payrollPeriod.update({
    where: { id: periodId },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    }
  })
}

async function getPayslips(periodId) {
  return await prisma.payrollSlip.findMany({
    where: { payrollPeriodId: periodId },
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          department: { select: { name: true } },
          position: { select: { title: true } }
        }
      }
    }
  })
}

async function getEmployeePayslip(payslipId) {
  const payslip = await prisma.payrollSlip.findUnique({
    where: { id: payslipId },
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          department: { select: { name: true } },
          position: { select: { title: true } }
        }
      },
      payrollPeriod: true
    }
  })

  if (!payslip) throw ApiError.notFound('Payslip not found')

  return {
    ...payslip,
    earnings: JSON.parse(payslip.earnings),
    deductions: JSON.parse(payslip.deductions)
  }
}

module.exports = {
  // Components
  createPayrollComponent,
  getPayrollComponents,
  updatePayrollComponent,

  // Employee Components
  assignComponentToEmployee,
  getEmployeeComponents,
  updateEmployeeComponent,

  // Payroll Periods
  createPayrollPeriod,
  getPayrollPeriods,
  processPayroll,
  approvePayroll,

  // Payslips
  getPayslips,
  getEmployeePayslip
}
