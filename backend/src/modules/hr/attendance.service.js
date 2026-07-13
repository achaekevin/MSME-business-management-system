const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// ATTENDANCE POLICIES
// ============================================================================

async function createAttendancePolicy(businessId, data) {
  return await prisma.attendancePolicy.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getAttendancePolicies(businessId) {
  return await prisma.attendancePolicy.findMany({
    where: { businessId, isActive: true }
  })
}

async function updateAttendancePolicy(id, data) {
  return await prisma.attendancePolicy.update({
    where: { id },
    data
  })
}

// ============================================================================
// ATTENDANCE RECORDS
// ============================================================================

async function recordCheckIn(employeeId, checkInData = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check if already checked in today
  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: today
      }
    }
  })

  if (existing && existing.checkIn) {
    throw ApiError.badRequest('Already checked in today')
  }

  const checkIn = new Date()

  return await prisma.attendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: today
      }
    },
    create: {
      employeeId,
      date: today,
      checkIn,
      status: 'present',
      location: checkInData.location,
      deviceId: checkInData.deviceId
    },
    update: {
      checkIn,
      status: 'present',
      location: checkInData.location,
      deviceId: checkInData.deviceId
    }
  })
}

async function recordCheckOut(employeeId, checkOutData = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: today
      }
    }
  })

  if (!record || !record.checkIn) {
    throw ApiError.badRequest('No check-in record found for today')
  }

  if (record.checkOut) {
    throw ApiError.badRequest('Already checked out today')
  }

  const checkOut = new Date()
  const workHours = (checkOut - record.checkIn) / (1000 * 60 * 60) // hours

  return await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOut,
      workHours: Math.round(workHours * 100) / 100,
      notes: checkOutData.notes
    }
  })
}

async function getAttendanceRecords(filters = {}) {
  const where = {}
  
  if (filters.employeeId) where.employeeId = filters.employeeId
  if (filters.status) where.status = filters.status
  
  if (filters.startDate && filters.endDate) {
    where.date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  return await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          department: { select: { name: true } },
          position: { select: { title: true } }
        }
      }
    },
    orderBy: { date: 'desc' }
  })
}

async function markAttendance(employeeId, date, status, notes) {
  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  return await prisma.attendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: attendanceDate
      }
    },
    create: {
      employeeId,
      date: attendanceDate,
      status,
      notes
    },
    update: {
      status,
      notes
    }
  })
}

async function updateAttendanceRecord(id, data) {
  return await prisma.attendanceRecord.update({
    where: { id },
    data
  })
}

// ============================================================================
// ATTENDANCE REPORTS
// ============================================================================

async function getAttendanceReport(businessId, filters = {}) {
  const where = {
    employee: { businessId }
  }

  if (filters.departmentId) {
    where.employee = { ...where.employee, departmentId: filters.departmentId }
  }

  if (filters.employeeId) {
    where.employeeId = filters.employeeId
  }

  if (filters.startDate && filters.endDate) {
    where.date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          department: { select: { name: true } }
        }
      }
    },
    orderBy: { date: 'desc' }
  })

  // Summary statistics
  const summary = await prisma.attendanceRecord.groupBy({
    by: ['status'],
    where,
    _count: true
  })

  const totalWorkHours = await prisma.attendanceRecord.aggregate({
    where: { ...where, workHours: { not: null } },
    _sum: { workHours: true },
    _avg: { workHours: true }
  })

  return {
    records,
    summary,
    totalWorkHours: Number(totalWorkHours._sum.workHours || 0),
    avgWorkHours: Number(totalWorkHours._avg.workHours || 0)
  }
}

async function getEmployeeAttendanceSummary(employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const summary = {
    totalDays: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    halfDay: records.filter(r => r.status === 'half_day').length,
    onLeave: records.filter(r => r.status === 'on_leave').length,
    totalWorkHours: records.reduce((sum, r) => sum + Number(r.workHours || 0), 0),
    totalOvertime: records.reduce((sum, r) => sum + Number(r.overtime || 0), 0)
  }

  return {
    employeeId,
    month,
    year,
    summary,
    records
  }
}

module.exports = {
  // Policies
  createAttendancePolicy,
  getAttendancePolicies,
  updateAttendancePolicy,

  // Records
  recordCheckIn,
  recordCheckOut,
  getAttendanceRecords,
  markAttendance,
  updateAttendanceRecord,

  // Reports
  getAttendanceReport,
  getEmployeeAttendanceSummary
}
