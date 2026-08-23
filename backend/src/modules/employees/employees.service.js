const repo = require('./employees.repository')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { uploadBuffer } = require('../../storage/storage.service')

async function listEmployees(businessId, query) {
  let count = await repo.countEmployees(businessId)
  if (count === 0) {
    const { prisma } = require('../../config/database')
    const users = await prisma.user.findMany({
      where: { businessId, status: 'active' },
      include: { role: true }
    })
    
    await listDepartments(businessId)
    const allDepts = await repo.findDepartments(businessId)
    const allPositions = await repo.findPositions(businessId)

    let idx = 1
    for (const u of users) {
      const roleName = u.role?.name || u.role?.displayName || ''
      const dept = allDepts.find(d => 
        (roleName.includes('Sales') || roleName.includes('Cashier')) ? d.name.includes('Sales') :
        (roleName.includes('Inventory') || roleName.includes('Warehouse')) ? d.name.includes('Inventory') :
        (roleName.includes('Account') || roleName.includes('Finance')) ? d.name.includes('Finance') :
        (roleName.includes('HR') || roleName.includes('Human')) ? d.name.includes('Human') :
        d.name.includes('Operations')
      ) || allDepts[0]

      const pos = allPositions.find(p => p.departmentId === dept?.id && (p.title?.toLowerCase() === roleName.toLowerCase() || p.title?.includes(roleName))) || allPositions.find(p => p.departmentId === dept?.id) || allPositions[0]

      const employeeNumber = `EMP-${String(idx).padStart(5, '0')}`
      try {
        await repo.createEmployee(businessId, {
          userId: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          employeeNumber,
          departmentId: dept?.id || null,
          positionId: pos?.id || null,
          branchId: u.branchId || null,
          salary: 50000,
          salaryType: 'monthly',
          joinDate: u.createdAt || new Date(),
          status: 'active'
        })
        idx++
      } catch (err) {
        // ignore duplicate
      }
    }
  }

  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total] = await repo.findEmployees(businessId, {
    skip, take, orderBy,
    departmentId: query.departmentId,
    status: query.status,
    branchId: query.branchId,
    search: query.search
  })
  return { items, total, page, limit }
}

async function getEmployee(businessId, id) {
  let emp = await repo.findEmployeeById(businessId, id)
  if (!emp) {
    const { prisma } = require('../../config/database')
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id, businessId: businessId || undefined },
          { id }
        ]
      },
      include: { role: true }
    })
    
    if (user) {
      await listDepartments(user.businessId || businessId)
      const allDepts = await repo.findDepartments(user.businessId || businessId)
      const allPositions = await repo.findPositions(user.businessId || businessId)
      const roleName = user.role?.name || user.role?.displayName || ''
      
      const dept = allDepts.find(d => 
        (roleName.includes('Sales') || roleName.includes('Cashier')) ? d.name.includes('Sales') :
        (roleName.includes('Inventory') || roleName.includes('Warehouse')) ? d.name.includes('Inventory') :
        (roleName.includes('Account') || roleName.includes('Finance')) ? d.name.includes('Finance') :
        (roleName.includes('HR') || roleName.includes('Human')) ? d.name.includes('Human') :
        d.name.includes('Operations')
      ) || allDepts[0]

      const pos = allPositions.find(p => p.departmentId === dept?.id && (p.title?.toLowerCase() === roleName.toLowerCase() || p.title?.includes(roleName))) || allPositions.find(p => p.departmentId === dept?.id) || allPositions[0]

      const count = await repo.countEmployees(user.businessId || businessId)
      const employeeNumber = `EMP-${String(count + 1).padStart(5, '0')}`

      emp = await repo.createEmployee(user.businessId || businessId, {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        employeeNumber,
        departmentId: dept?.id || null,
        positionId: pos?.id || null,
        branchId: user.branchId || null,
        salary: 50000,
        salaryType: 'monthly',
        joinDate: user.createdAt || new Date(),
        status: 'active'
      })
      
      emp = await repo.findEmployeeById(user.businessId || businessId, emp.id)
    }
  }

  if (!emp) throw ApiError.notFound('Employee not found')
  return emp
}

async function createEmployee(businessId, data, req) {
  const count = await repo.countEmployees(businessId)
  const employeeNumber = data.employeeNumber || `EMP-${String(count + 1).padStart(5, '0')}`

  const existing = await repo.findByEmployeeNumber(businessId, employeeNumber)
  if (existing) throw ApiError.conflict(`Employee number "${employeeNumber}" is already in use`)

  const joinDate = new Date(data.joinDate)
  const emp = await repo.createEmployee(businessId, { ...data, employeeNumber, joinDate })
  req?.audit?.('employee.created', 'Employee', emp.id, { name: emp.name, employeeNumber })
  return emp
}

async function updateEmployee(businessId, id, data, req) {
  const existing = await repo.findEmployeeById(businessId, id)
  if (!existing) throw ApiError.notFound('Employee not found')

  if (data.joinDate) data.joinDate = new Date(data.joinDate)
  const updated = await repo.updateEmployee(id, data)
  req?.audit?.('employee.updated', 'Employee', id, { changes: data })
  return updated
}

async function terminateEmployee(businessId, id, reason, req) {
  const emp = await repo.findEmployeeById(businessId, id)
  if (!emp) throw ApiError.notFound('Employee not found')
  if (emp.status === 'terminated') throw ApiError.conflict('Employee is already terminated')

  const updated = await repo.terminateEmployee(id)
  req?.audit?.('employee.terminated', 'Employee', id, { reason })
  return updated
}

async function deleteEmployee(businessId, id, req) {
  const emp = await repo.findEmployeeById(businessId, id)
  if (!emp) throw ApiError.notFound('Employee not found')

  const { prisma } = require('../../config/database')
  await prisma.$transaction([
    prisma.leaveRequest.deleteMany({ where: { employeeId: id } }).catch(() => {}),
    prisma.attendance.deleteMany({ where: { employeeId: id } }).catch(() => {}),
    prisma.employeeDocument.deleteMany({ where: { employeeId: id } }).catch(() => {}),
    prisma.performanceReview.deleteMany({ where: { employeeId: id } }).catch(() => {}),
    prisma.payrollItem.deleteMany({ where: { employeeId: id } }).catch(() => {}),
    prisma.employee.deleteMany({ where: { id, businessId } })
  ])

  req?.audit?.('employee.deleted', 'Employee', id)
  return { deleted: true }
}

async function uploadDocument(businessId, employeeId, file, type, req) {
  const emp = await repo.findEmployeeById(businessId, employeeId)
  if (!emp) throw ApiError.notFound('Employee not found')

  const ext = file.mimetype.split('/')[1]
  const url = await uploadBuffer(
    `employees/${businessId}/${employeeId}/${type}-${Date.now()}.${ext}`,
    file.buffer, file.mimetype
  )
  const doc = await repo.createDocument(employeeId, file.originalname || type, type, url)
  req?.audit?.('employee.document_uploaded', 'Employee', employeeId, { type })
  return doc
}

// ── Departments ───────────────────────────────────────────────────────────────

async function listDepartments(businessId) {
  const { prisma } = require('../../config/database')
  let depts = await repo.findDepartments(businessId)
  if (!depts || depts.length === 0) {
    const defaultDepts = [
      {
        name: 'Operations',
        positions: ['Operations Manager', 'Operations Officer', 'Shift Supervisor']
      },
      {
        name: 'Sales & Marketing',
        positions: ['Sales Manager', 'Sales Representative', 'Cashier', 'Marketing Executive']
      },
      {
        name: 'Inventory & Warehousing',
        positions: ['Inventory Officer', 'Warehouse Supervisor', 'Storekeeper']
      },
      {
        name: 'Finance & Accounting',
        positions: ['Accountant', 'Accounts Assistant', 'Billing Specialist']
      },
      {
        name: 'Human Resources & Admin',
        positions: ['HR Manager', 'HR Officer', 'Administrative Assistant']
      },
      {
        name: 'Procurement',
        positions: ['Procurement Officer', 'Purchasing Agent']
      },
      {
        name: 'Information Technology',
        positions: ['IT Support Officer', 'Systems Administrator']
      }
    ]

    for (const d of defaultDepts) {
      let dept = await prisma.department.findFirst({ where: { businessId, name: d.name } })
      if (!dept) {
        dept = await repo.createDepartment(businessId, { name: d.name })
      }
      for (const posTitle of d.positions) {
        const posExisting = await prisma.position.findFirst({
          where: { businessId, departmentId: dept.id, title: posTitle }
        })
        if (!posExisting) {
          await repo.createPosition(businessId, { departmentId: dept.id, title: posTitle })
        }
      }
    }
    depts = await repo.findDepartments(businessId)
  }
  return depts
}

async function createDepartment(businessId, data, req) {
  const dept = await repo.createDepartment(businessId, data)
  req?.audit?.('department.created', 'Department', dept.id, { name: dept.name })
  return dept
}

async function updateDepartment(businessId, id, data, req) {
  const dept = await repo.findDepartmentById(businessId, id)
  if (!dept) throw ApiError.notFound('Department not found')
  const updated = await repo.updateDepartment(id, data)
  req?.audit?.('department.updated', 'Department', id, { changes: data })
  return updated
}

async function deleteDepartment(businessId, id, req) {
  const dept = await repo.findDepartmentById(businessId, id)
  if (!dept) throw ApiError.notFound('Department not found')
  const empCount = await repo.countEmployeesInDept(id)
  if (empCount > 0) throw ApiError.badRequest('Cannot delete a department with employees. Reassign them first.')
  await repo.deleteDepartment(id)
  req?.audit?.('department.deleted', 'Department', id)
  return { deleted: true }
}

// ── Positions ─────────────────────────────────────────────────────────────────

async function listPositions(businessId, departmentId) {
  await listDepartments(businessId)
  const positions = await repo.findPositions(businessId, departmentId && departmentId.trim() !== '' ? departmentId : undefined)
  return positions
}

async function createPosition(businessId, data, req) {
  const pos = await repo.createPosition(businessId, data)
  req?.audit?.('position.created', 'Position', pos.id)
  return pos
}

// ── Attendance ────────────────────────────────────────────────────────────────

async function getAttendance(businessId, query) {
  const { skip, take, page, limit } = parsePagination(query)
  const [items, total] = await repo.findAttendance(businessId, {
    skip, take,
    employeeId: query.employeeId,
    date: query.date,
    startDate: query.startDate,
    endDate: query.endDate
  })
  return { items, total, page, limit }
}

async function recordAttendance(businessId, data, req) {
  const emp = await repo.findEmployeeById(businessId, data.employeeId)
  if (!emp) throw ApiError.notFound('Employee not found')

  const dateOnly = new Date(data.date)
  dateOnly.setHours(0, 0, 0, 0)

  return repo.upsertAttendance(
    data.employeeId, dateOnly,
    data.checkIn ? new Date(data.checkIn) : null,
    data.checkOut ? new Date(data.checkOut) : null,
    data.status, data.notes
  )
}

// ── Leaves ────────────────────────────────────────────────────────────────────

async function listLeaves(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total] = await repo.findLeaves(businessId, {
    skip, take, orderBy,
    employeeId: query.employeeId,
    status: query.status,
    type: query.type
  })
  return { items, total, page, limit }
}

async function applyLeave(businessId, data, req) {
  const emp = await repo.findEmployeeById(businessId, data.employeeId)
  if (!emp) throw ApiError.notFound('Employee not found')

  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  if (start > end) throw ApiError.badRequest('Start date must be before end date')

  const overlap = await repo.findOverlappingLeave(data.employeeId, start, end)
  if (overlap) throw ApiError.conflict('Employee already has a leave request for this period')

  const leave = await repo.createLeave(data.employeeId, data.type, start, end, data.reason)
  req?.audit?.('leave.applied', 'Leave', leave.id, { employeeId: data.employeeId, type: data.type })
  return leave
}

async function updateLeaveStatus(businessId, leaveId, status, reason, req) {
  const leave = await repo.findLeaveById(leaveId, businessId)
  if (!leave) throw ApiError.notFound('Leave request not found')
  if (leave.status !== 'pending') throw ApiError.conflict('Only pending leaves can be approved or rejected')

  const updated = await repo.updateLeaveStatus(leaveId, status, req?.userId, reason)
  req?.audit?.(`leave.${status}`, 'Leave', leaveId)
  return updated
}

// ── Performance Reviews ───────────────────────────────────────────────────────

async function addPerformanceReview(businessId, employeeId, data, reviewerId) {
  const emp = await repo.findEmployeeById(businessId, employeeId)
  if (!emp) throw ApiError.notFound('Employee not found')
  return repo.createReview(employeeId, reviewerId, data)
}

// ── Analytics ─────────────────────────────────────────────────────────────────

async function getEmployeeAnalytics(businessId) {
  const [total, byDept, byStatus, recentHires] = await repo.getEmployeeStats(businessId)

  const deptIds = byDept.map((d) => d.departmentId).filter(Boolean)
  const depts = await repo.findDepartmentsByIds(deptIds)
  const deptMap = Object.fromEntries(depts.map((d) => [d.id, d.name]))

  return {
    total,
    byDepartment: byDept.map((d) => ({ department: deptMap[d.departmentId] || 'Unassigned', count: d._count })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    recentHires
  }
}

module.exports = {
  listEmployees, getEmployee, createEmployee, updateEmployee, terminateEmployee, deleteEmployee, uploadDocument,
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listPositions, createPosition,
  getAttendance, recordAttendance,
  listLeaves, applyLeave, updateLeaveStatus,
  addPerformanceReview, getEmployeeAnalytics
}
