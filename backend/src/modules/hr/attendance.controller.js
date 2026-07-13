const asyncHandler = require('../../helpers/asyncHandler')
const attendanceService = require('./attendance.service')
const { successResponse } = require('../../helpers/response')

// Policies
exports.createAttendancePolicy = asyncHandler(async (req, res) => {
  const policy = await attendanceService.createAttendancePolicy(req.businessId, req.body)
  successResponse(res, policy, 'Attendance policy created', 201)
})

exports.getAttendancePolicies = asyncHandler(async (req, res) => {
  const policies = await attendanceService.getAttendancePolicies(req.businessId)
  successResponse(res, policies)
})

exports.updateAttendancePolicy = asyncHandler(async (req, res) => {
  const policy = await attendanceService.updateAttendancePolicy(req.params.id, req.body)
  successResponse(res, policy, 'Attendance policy updated')
})

// Records
exports.recordCheckIn = asyncHandler(async (req, res) => {
  const record = await attendanceService.recordCheckIn(req.body.employeeId, req.body)
  successResponse(res, record, 'Check-in recorded', 201)
})

exports.recordCheckOut = asyncHandler(async (req, res) => {
  const record = await attendanceService.recordCheckOut(req.body.employeeId, req.body)
  successResponse(res, record, 'Check-out recorded')
})

exports.getAttendanceRecords = asyncHandler(async (req, res) => {
  const records = await attendanceService.getAttendanceRecords(req.query)
  successResponse(res, records)
})

exports.markAttendance = asyncHandler(async (req, res) => {
  const { employeeId, date, status, notes } = req.body
  const record = await attendanceService.markAttendance(employeeId, date, status, notes)
  successResponse(res, record, 'Attendance marked', 201)
})

exports.updateAttendanceRecord = asyncHandler(async (req, res) => {
  const record = await attendanceService.updateAttendanceRecord(req.params.id, req.body)
  successResponse(res, record, 'Attendance record updated')
})

// Reports
exports.getAttendanceReport = asyncHandler(async (req, res) => {
  const report = await attendanceService.getAttendanceReport(req.businessId, req.query)
  successResponse(res, report)
})

exports.getEmployeeAttendanceSummary = asyncHandler(async (req, res) => {
  const { employeeId } = req.params
  const { month, year } = req.query
  const summary = await attendanceService.getEmployeeAttendanceSummary(
    employeeId,
    parseInt(month),
    parseInt(year)
  )
  successResponse(res, summary)
})
