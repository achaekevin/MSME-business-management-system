const asyncHandler = require('../../helpers/asyncHandler')
const performanceService = require('./performance.service')
const { successResponse } = require('../../helpers/response')

// Metrics
exports.createPerformanceMetric = asyncHandler(async (req, res) => {
  const metric = await performanceService.createPerformanceMetric(req.businessId, req.body)
  successResponse(res, metric, 'Performance metric created', 201)
})

exports.getPerformanceMetrics = asyncHandler(async (req, res) => {
  const metrics = await performanceService.getPerformanceMetrics(req.businessId, req.query.isActive)
  successResponse(res, metrics)
})

exports.updatePerformanceMetric = asyncHandler(async (req, res) => {
  const metric = await performanceService.updatePerformanceMetric(req.params.id, req.body)
  successResponse(res, metric, 'Performance metric updated')
})

// Cycles
exports.createPerformanceCycle = asyncHandler(async (req, res) => {
  const cycle = await performanceService.createPerformanceCycle(req.businessId, req.body)
  successResponse(res, cycle, 'Performance cycle created', 201)
})

exports.getPerformanceCycles = asyncHandler(async (req, res) => {
  const cycles = await performanceService.getPerformanceCycles(req.businessId, req.query.status)
  successResponse(res, cycles)
})

exports.updatePerformanceCycle = asyncHandler(async (req, res) => {
  const cycle = await performanceService.updatePerformanceCycle(req.params.id, req.body)
  successResponse(res, cycle, 'Performance cycle updated')
})

// Reviews
exports.createPerformanceReview = asyncHandler(async (req, res) => {
  const { cycleId, employeeId, reviewerId, ...data } = req.body
  const review = await performanceService.createPerformanceReview(cycleId, employeeId, reviewerId, data)
  successResponse(res, review, 'Performance review created', 201)
})

exports.getPerformanceReviews = asyncHandler(async (req, res) => {
  const reviews = await performanceService.getPerformanceReviews(req.query)
  successResponse(res, reviews)
})

exports.updatePerformanceReview = asyncHandler(async (req, res) => {
  const review = await performanceService.updatePerformanceReview(req.params.id, req.body)
  successResponse(res, review, 'Performance review updated')
})

exports.submitPerformanceReview = asyncHandler(async (req, res) => {
  const { overallRating, reviewerComments } = req.body
  const review = await performanceService.submitPerformanceReview(
    req.params.id,
    overallRating,
    reviewerComments
  )
  successResponse(res, review, 'Performance review submitted')
})

exports.acknowledgeReview = asyncHandler(async (req, res) => {
  const review = await performanceService.acknowledgeReview(req.params.id, req.body.employeeComments)
  successResponse(res, review, 'Performance review acknowledged')
})

// Reports
exports.getEmployeePerformanceHistory = asyncHandler(async (req, res) => {
  const history = await performanceService.getEmployeePerformanceHistory(req.params.employeeId)
  successResponse(res, history)
})

exports.getCyclePerformanceReport = asyncHandler(async (req, res) => {
  const report = await performanceService.getCyclePerformanceReport(req.params.cycleId)
  successResponse(res, report)
})
