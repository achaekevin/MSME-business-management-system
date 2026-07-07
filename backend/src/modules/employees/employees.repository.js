const { prisma } = require('../../config/database')
const { buildSearchClause } = require('../../helpers/pagination')

// ── Employees ─────────────────────────────────────────────────────────────────

function findEmployees(businessId, { skip, take, orderBy, departmentId, status, branchId, search }) {
  const where = {
    businessId,
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
    ...(branchId ? { branchId } : {}),
    ...(search ? buildSearchClause(search, ['name', 'email', 'employeeNumber']) : {})
  }
  return Promise.all([
    prisma.employee.findMany({
      where, skip, take, orderBy,
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
        branch: { select: { id: true, name: true } }
      }
    }),
    prisma.employee.count({ where })
  ])
}

function findEmployeeById(businessId, id) {
  return prisma.employee.findFirst({
    where: { id, businessId },
    include: {
      department: true, position: true, branch: true,
      user: { select: { id: true, name: true, email: true } },
      documents: true,
      _count: { select: { attendance: true, leaves: true } }
    }
  })
}

function findByEmployeeNumber(businessId, employeeNumber) {
  return prisma.employee.findFirst({ where: { businessId, employeeNumber } })
}

function countEmployees(businessId) {
  return prisma.employee.count({ where: { businessId } })
}

function createEmployee(businessId, data) {
  const { businessId: _b, ...rest } = data
  return prisma.employee.create({
    data: { ...rest, businessId },
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } }
    }
  })
}

function updateEmployee(id, data) {
  const { businessId: _b, employeeNumber: _en, ...rest } = data
  return prisma.employee.update({
    where: { id }, data: rest,
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } }
    }
  })
}

function terminateEmployee(id) {
  return prisma.employee.update({ where: { id }, data: { status: 'terminated' } })
}

function createDocument(employeeId, name, type, url) {
  return prisma.employeeDocument.create({ data: { employeeId, name, type, url } })
}

// ── Departments ───────────────────────────────────────────────────────────────

function findDepartments(businessId) {
  return prisma.department.findMany({
    where: { businessId }, orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true, positions: true } } }
  })
}

function findDepartmentById(businessId, id) {
  return prisma.department.findFirst({ where: { id, businessId } })
}

function createDepartment(businessId, data) {
  const { businessId: _b, ...rest } = data
  return prisma.department.create({ data: { ...rest, businessId } })
}

function updateDepartment(id, data) {
  return prisma.department.update({ where: { id }, data })
}

function deleteDepartment(id) {
  return prisma.department.delete({ where: { id } })
}

function countEmployeesInDept(departmentId) {
  return prisma.employee.count({ where: { departmentId } })
}

// ── Positions ─────────────────────────────────────────────────────────────────

function findPositions(businessId, departmentId) {
  return prisma.position.findMany({
    where: { businessId, ...(departmentId ? { departmentId } : {}) },
    include: {
      department: { select: { id: true, name: true } },
      _count: { select: { employees: true } }
    },
    orderBy: { title: 'asc' }
  })
}

function createPosition(businessId, data) {
  const { businessId: _b, ...rest } = data
  return prisma.position.create({ data: { ...rest, businessId } })
}

// ── Attendance ────────────────────────────────────────────────────────────────

function findAttendance(businessId, { skip, take, employeeId, date, startDate, endDate }) {
  const where = {
    employee: { businessId },
    ...(employeeId ? { employeeId } : {}),
    ...(date ? { date: new Date(date) } : startDate || endDate ? {
      date: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {})
  }
  return Promise.all([
    prisma.attendance.findMany({
      where, skip, take,
      orderBy: { date: 'desc' },
      include: { employee: { select: { id: true, name: true, employeeNumber: true } } }
    }),
    prisma.attendance.count({ where })
  ])
}

function upsertAttendance(employeeId, dateOnly, checkIn, checkOut, status, notes) {
  return prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: dateOnly } },
    create: { employeeId, date: dateOnly, checkIn, checkOut, status: status || 'present', notes },
    update: {
      ...(checkIn !== undefined ? { checkIn } : {}),
      ...(checkOut !== undefined ? { checkOut } : {}),
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {})
    }
  })
}

// ── Leaves ────────────────────────────────────────────────────────────────────

function findLeaves(businessId, { skip, take, orderBy, employeeId, status, type }) {
  const where = {
    employee: { businessId },
    ...(employeeId ? { employeeId } : {}),
    ...(status ? { status } : {}),
    ...(type ? { type } : {})
  }
  return Promise.all([
    prisma.leave.findMany({
      where, skip, take, orderBy,
      include: { employee: { select: { id: true, name: true, employeeNumber: true } } }
    }),
    prisma.leave.count({ where })
  ])
}

function findLeaveById(leaveId, businessId) {
  return prisma.leave.findFirst({ where: { id: leaveId, employee: { businessId } } })
}

function findOverlappingLeave(employeeId, start, end) {
  return prisma.leave.findFirst({
    where: {
      employeeId,
      status: { not: 'rejected' },
      OR: [{ startDate: { lte: end }, endDate: { gte: start } }]
    }
  })
}

function createLeave(employeeId, type, start, end, reason) {
  return prisma.leave.create({
    data: { employeeId, type, startDate: start, endDate: end, reason, status: 'pending' }
  })
}

function updateLeaveStatus(leaveId, status, approvedBy, reason) {
  return prisma.leave.update({
    where: { id: leaveId },
    data: { status, approvedBy, ...(reason ? { reason } : {}) }
  })
}

// ── Performance Reviews ───────────────────────────────────────────────────────

function createReview(employeeId, reviewerId, data) {
  return prisma.performanceReview.create({
    data: { employeeId, reviewerId, period: data.period, rating: data.rating, comments: data.comments }
  })
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function getEmployeeStats(businessId) {
  return Promise.all([
    prisma.employee.count({ where: { businessId } }),
    prisma.employee.groupBy({ by: ['departmentId'], where: { businessId }, _count: true }),
    prisma.employee.groupBy({ by: ['status'], where: { businessId }, _count: true }),
    prisma.employee.findMany({
      where: { businessId, joinDate: { gte: new Date(Date.now() - 90 * 86400000) } },
      orderBy: { joinDate: 'desc' }, take: 5,
      select: {
        id: true, name: true, employeeNumber: true, joinDate: true,
        department: { select: { name: true } }
      }
    })
  ])
}

function findDepartmentsByIds(ids) {
  return prisma.department.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
}

module.exports = {
  findEmployees, findEmployeeById, findByEmployeeNumber, countEmployees,
  createEmployee, updateEmployee, terminateEmployee, createDocument,
  findDepartments, findDepartmentById, createDepartment, updateDepartment,
  deleteDepartment, countEmployeesInDept,
  findPositions, createPosition,
  findAttendance, upsertAttendance,
  findLeaves, findLeaveById, findOverlappingLeave, createLeave, updateLeaveStatus,
  createReview,
  getEmployeeStats, findDepartmentsByIds
}
