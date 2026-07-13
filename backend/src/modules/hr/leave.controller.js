const asyncHandler = require('../../helpers/asyncHandler')
const leaveService = require('./leave.service')
const { successResponse } = require('../../helpers/response')

// Leave Types
exports.createLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.createLeaveType(req.businessId, req.body)
  successResponse(res, leaveType, 'Leave type created', 201)
})

exports.getLeaveTypes = asyncHandler(async (req, res) => {
  const types = await leaveService.getLeaveTypes(req.businessId, req.query.isActive)
  successResponse(res, types)
})

exports.updateLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.updateLeaveType(req.params.id, req.body)
  successResponse(res, leaveType, 'Leave type updated')
})

// Leave Balances
exports.initializeLeaveBalances = asyncHandler(async (req, res) => {
  const { employeeId, year } = req.body
  const balances = await leaveService.initializeLeaveBalances(employeeId, year)
  successResponse(res, balances, 'Leave balances initialized', 201)
})

exports.getEmployeeLeaveBalances = asyncHandler(async (req, res) => {
  const { employeeId } = req.params
  const { year } = req.query
  const balances = await leaveService.getEmployeeLeaveBalances(employeeId, parseInt(year))
  successResponse(res, balances)
})

// Leave Requests
exports.createLeaveRequest = asyncHandler(async (req, res) => {
  const request = await leaveService.createLeaveRequest(req.body.employeeId, req.body)
  successResponse(res, request, 'Leave request created', 201)
})

exports.getLeaveRequests = asyncHandler(async (req, res) => {
  const requests = await leaveService.getLeaveRequests(req.query)
  successResponse(res, requests)
})

exports.approveLeaveRequest = asyncHandler(async (req, res) => {
  const request = await leaveService.approveLeaveRequest(req.params.id, req.userId)
  successResponse(res, request, 'Leave request approved')
})

exports.rejectLeaveRequest = asyncHandler(async (req, res) => {
  const request = await leaveService.rejectLeaveRequest(
    req.params.id,
    req.userId,
    req.body.rejectionReason
  )
  successResponse(res, request, 'Leave request rejected')
})

exports.cancelLeaveRequest = asyncHandler(async (req, res) => {
  const request = await leaveService.cancelLeaveRequest(req.params.id)
  successResponse(res, request, 'Leave request cancelled')
})

// Reports
exports.getLeaveReport = asyncHandler(async (req, res) => {
  const report = await leaveService.getLeaveReport(req.businessId, req.query)
  successResponse(res, report)
})
