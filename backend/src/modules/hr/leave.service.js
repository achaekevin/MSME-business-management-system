const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// LEAVE TYPES
// ============================================================================

async function createLeaveType(businessId, data) {
  return await prisma.leaveType.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getLeaveTypes(businessId, isActive) {
  const where = { businessId }
  if (isActive !== undefined) where.isActive = isActive

  return await prisma.leaveType.findMany({
    where,
    include: {
      _count: {
        select: { leaveBalances: true }
      }
    }
  })
}

async function updateLeaveType(id, data) {
  return await prisma.leaveType.update({
    where: { id },
    data
  })
}

// ============================================================================
// LEAVE BALANCES
// ============================================================================

async function initializeLeaveBalances(employeeId, year) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { business: true }
  })

  if (!employee) throw ApiError.notFound('Employee not found')

  const leaveTypes = await prisma.leaveType.findMany({
    where: { businessId: employee.businessId, isActive: true }
  })

  const balances = await Promise.all(
    leaveTypes.map(type =>
      prisma.employeeLeaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId: type.id,
            year
          }
        },
        create: {
          employeeId,
          leaveTypeId: type.id,
          year,
          allocated: type.daysAllowed,
          remaining: type.daysAllowed
        },
        update: {}
      })
    )
  )

  return balances
}

async function getEmployeeLeaveBalances(employeeId, year) {
  return await prisma.employeeLeaveBalance.findMany({
    where: {
      employeeId,
      year
    },
    include: {
      leaveType: true
    }
  })
}

async function updateLeaveBalance(employeeId, leaveTypeId, year, days) {
  const balance = await prisma.employeeLeaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId,
        year
      }
    }
  })

  if (!balance) {
    throw ApiError.notFound('Leave balance not found')
  }

  return await prisma.employeeLeaveBalance.update({
    where: { id: balance.id },
    data: {
      used: { increment: days },
      remaining: { decrement: days }
    }
  })
}

// ============================================================================
// LEAVE REQUESTS
// ============================================================================

async function createLeaveRequest(employeeId, data) {
  // Calculate number of days
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

  return await prisma.leaveRequest.create({
    data: {
      employeeId,
      days,
      ...data
    }
  })
}

async function getLeaveRequests(filters = {}) {
  const where = {}
  if (filters.employeeId) where.employeeId = filters.employeeId
  if (filters.status) where.status = filters.status
  if (filters.startDate && filters.endDate) {
    where.startDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  return await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          department: true,
          position: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function approveLeaveRequest(requestId, approvedBy) {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) throw ApiError.notFound('Leave request not found')
    if (request.status !== 'pending') {
      throw ApiError.badRequest('Leave request has already been processed')
    }

    // Update leave balance
    if (request.leaveTypeId) {
      const year = new Date(request.startDate).getFullYear()
      await updateLeaveBalance(
        request.employeeId,
        request.leaveTypeId,
        year,
        Number(request.days)
      )
    }

    // Update request status
    return await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      }
    })
  })
}

async function rejectLeaveRequest(requestId, rejectedBy, rejectionReason) {
  return await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason
    }
  })
}

async function cancelLeaveRequest(requestId) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId }
  })

  if (!request) throw ApiError.notFound('Leave request not found')

  // If approved, reverse the leave balance
  if (request.status === 'approved' && request.leaveTypeId) {
    const year = new Date(request.startDate).getFullYear()
    const balance = await prisma.employeeLeaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year
        }
      }
    })

    if (balance) {
      await prisma.employeeLeaveBalance.update({
        where: { id: balance.id },
        data: {
          used: { decrement: Number(request.days) },
          remaining: { increment: Number(request.days) }
        }
      })
    }
  }

  return await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: 'cancelled' }
  })
}

// ============================================================================
// LEAVE REPORTS
// ============================================================================

async function getLeaveReport(businessId, filters = {}) {
  const where = {
    employee: { businessId }
  }

  if (filters.departmentId) {
    where.employee = { ...where.employee, departmentId: filters.departmentId }
  }

  if (filters.startDate && filters.endDate) {
    where.startDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          department: { select: { name: true } }
        }
      }
    }
  })

  const summary = await prisma.leaveRequest.groupBy({
    by: ['status'],
    where,
    _sum: { days: true },
    _count: true
  })

  return {
    requests,
    summary
  }
}

module.exports = {
  // Leave Types
  createLeaveType,
  getLeaveTypes,
  updateLeaveType,

  // Leave Balances
  initializeLeaveBalances,
  getEmployeeLeaveBalances,
  updateLeaveBalance,

  // Leave Requests
  createLeaveRequest,
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,

  // Reports
  getLeaveReport
}
