const { prisma } = require('../../config/database')

function findRuns(businessId, { skip, take, orderBy }) {
  return Promise.all([
    prisma.payrollRun.findMany({
      where: { businessId }, skip, take, orderBy,
      include: { _count: { select: { payslips: true } } }
    }),
    prisma.payrollRun.count({ where: { businessId } })
  ])
}

function findRunById(businessId, id) {
  return prisma.payrollRun.findFirst({
    where: { id, businessId },
    include: {
      payslips: {
        include: {
          employee: {
            select: {
              id: true, name: true, employeeNumber: true,
              department: { select: { name: true } }
            }
          }
        }
      }
    }
  })
}

function findRunByPeriod(businessId, period) {
  return prisma.payrollRun.findFirst({ where: { businessId, period } })
}

function findActiveEmployees(businessId, employeeIds) {
  const where = {
    businessId, status: 'active',
    ...(employeeIds?.length ? { id: { in: employeeIds } } : {})
  }
  return prisma.employee.findMany({ where })
}

function createRun(businessId, period, totalAmount, payslipData) {
  return prisma.payrollRun.create({
    data: {
      businessId, period, status: 'draft', totalAmount,
      payslips: { create: payslipData }
    },
    include: {
      payslips: {
        include: { employee: { select: { id: true, name: true, employeeNumber: true } } }
      }
    }
  })
}

function approveRun(id) {
  return prisma.payrollRun.update({
    where: { id },
    data: { status: 'approved', approvedAt: new Date() }
  })
}

function disburseRunTx(tx, run, userId) {
  return Promise.all([
    tx.payrollRun.update({ where: { id: run.id }, data: { status: 'disbursed', disbursedAt: new Date() } }),
    tx.expense.create({
      data: {
        businessId: run.businessId,
        category: 'Salaries',
        description: `Payroll disbursement — ${run.period}`,
        amount: Number(run.totalAmount),
        paymentMethod: 'bank_transfer',
        date: new Date(),
        status: 'approved',
        createdById: userId
      }
    })
  ])
}

function findRunWithPayslip(businessId, payrollRunId, employeeId, includeEmployee = false) {
  return prisma.payrollRun.findFirst({
    where: { id: payrollRunId, businessId },
    include: {
      payslips: {
        where: { employeeId },
        ...(includeEmployee ? {
          include: { employee: { include: { department: true, position: true } } }
        } : {
          include: { employee: true }
        })
      }
    }
  })
}

function findBusiness(businessId) {
  return prisma.business.findUnique({ where: { id: businessId } })
}

module.exports = {
  findRuns, findRunById, findRunByPeriod, findActiveEmployees,
  createRun, approveRun, disburseRunTx, findRunWithPayslip, findBusiness
}
