const asyncHandler = require('../../helpers/asyncHandler')
const { success, created, paginated, noContent } = require('../../helpers/response')
const service = require('./employees.service')

// Employees
const list = asyncHandler(async (req, res) => {
  const result = await service.listEmployees(req.businessId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const getOne = asyncHandler(async (req, res) => {
  success(res, await service.getEmployee(req.businessId, req.params.id))
})

const create = asyncHandler(async (req, res) => {
  created(res, await service.createEmployee(req.businessId, req.body, req), 'Employee created')
})

const update = asyncHandler(async (req, res) => {
  success(res, await service.updateEmployee(req.businessId, req.params.id, req.body, req))
})

const terminate = asyncHandler(async (req, res) => {
  success(res, await service.terminateEmployee(req.businessId, req.params.id, req.body.reason, req))
})

const uploadDoc = asyncHandler(async (req, res) => {
  if (!req.file) throw require('../../helpers/response').ApiError.badRequest('No file uploaded')
  created(res, await service.uploadDocument(req.businessId, req.params.id, req.file, req.body.type || 'other', req))
})

const addReview = asyncHandler(async (req, res) => {
  created(res, await service.addPerformanceReview(req.businessId, req.params.id, req.body, req.userId))
})

// Departments
const listDepts = asyncHandler(async (req, res) => {
  success(res, await service.listDepartments(req.businessId))
})

const createDept = asyncHandler(async (req, res) => {
  created(res, await service.createDepartment(req.businessId, req.body, req), 'Department created')
})

const updateDept = asyncHandler(async (req, res) => {
  success(res, await service.updateDepartment(req.businessId, req.params.id, req.body, req))
})

const deleteDept = asyncHandler(async (req, res) => {
  await service.deleteDepartment(req.businessId, req.params.id, req)
  noContent(res)
})

// Positions
const listPositions = asyncHandler(async (req, res) => {
  success(res, await service.listPositions(req.businessId, req.query.departmentId))
})

const createPosition = asyncHandler(async (req, res) => {
  created(res, await service.createPosition(req.businessId, req.body, req), 'Position created')
})

// Attendance
const listAttendance = asyncHandler(async (req, res) => {
  const result = await service.getAttendance(req.businessId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const recordAttendance = asyncHandler(async (req, res) => {
  success(res, await service.recordAttendance(req.businessId, req.body, req))
})

// Leaves
const listLeaves = asyncHandler(async (req, res) => {
  const result = await service.listLeaves(req.businessId, req.query)
  paginated(res, result.items, result.total, result.page, result.limit)
})

const applyLeave = asyncHandler(async (req, res) => {
  created(res, await service.applyLeave(req.businessId, req.body, req), 'Leave request submitted')
})

const approveLeave = asyncHandler(async (req, res) => {
  success(res, await service.updateLeaveStatus(req.businessId, req.params.id, 'approved', null, req))
})

const rejectLeave = asyncHandler(async (req, res) => {
  success(res, await service.updateLeaveStatus(req.businessId, req.params.id, 'rejected', req.body.reason, req))
})

// Analytics
const analytics = asyncHandler(async (req, res) => {
  success(res, await service.getEmployeeAnalytics(req.businessId))
})

module.exports = {
  list, getOne, create, update, terminate, uploadDoc, addReview,
  listDepts, createDept, updateDept, deleteDept,
  listPositions, createPosition,
  listAttendance, recordAttendance,
  listLeaves, applyLeave, approveLeave, rejectLeave,
  analytics
}
