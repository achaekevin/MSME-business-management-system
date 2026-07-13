const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

async function createPerformanceMetric(businessId, data) {
  return await prisma.performanceMetric.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getPerformanceMetrics(businessId, isActive) {
  const where = { businessId }
  if (isActive !== undefined) where.isActive = isActive

  return await prisma.performanceMetric.findMany({
    where,
    orderBy: { category: 'asc' }
  })
}

async function updatePerformanceMetric(id, data) {
  return await prisma.performanceMetric.update({
    where: { id },
    data
  })
}

// ============================================================================
// PERFORMANCE CYCLES
// ============================================================================

async function createPerformanceCycle(businessId, data) {
  return await prisma.performanceCycle.create({
    data: {
      businessId,
      ...data
    }
  })
}

async function getPerformanceCycles(businessId, status) {
  const where = { businessId }
  if (status) where.status = status

  return await prisma.performanceCycle.findMany({
    where,
    include: {
      _count: {
        select: { reviews: true }
      }
    },
    orderBy: { startDate: 'desc' }
  })
}

async function updatePerformanceCycle(id, data) {
  return await prisma.performanceCycle.update({
    where: { id },
    data
  })
}

// ============================================================================
// PERFORMANCE REVIEWS
// ============================================================================

async function createPerformanceReview(cycleId, employeeId, reviewerId, data) {
  return await prisma.performanceReviewRecord.create({
    data: {
      cycleId,
      employeeId,
      reviewerId,
      ...data
    }
  })
}

async function getPerformanceReviews(filters = {}) {
  const where = {}
  
  if (filters.cycleId) where.cycleId = filters.cycleId
  if (filters.employeeId) where.employeeId = filters.employeeId
  if (filters.status) where.status = filters.status

  return await prisma.performanceReviewRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          department: { select: { name: true } },
          position: { select: { title: true } }
        }
      },
      cycle: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function updatePerformanceReview(reviewId, data) {
  const review = await prisma.performanceReviewRecord.findUnique({
    where: { id: reviewId }
  })

  if (!review) throw ApiError.notFound('Performance review not found')

  return await prisma.performanceReviewRecord.update({
    where: { id: reviewId },
    data
  })
}

async function submitPerformanceReview(reviewId, overallRating, reviewerComments) {
  return await prisma.performanceReviewRecord.update({
    where: { id: reviewId },
    data: {
      overallRating,
      reviewerComments,
      status: 'completed',
      reviewDate: new Date()
    }
  })
}

async function acknowledgeReview(reviewId, employeeComments) {
  return await prisma.performanceReviewRecord.update({
    where: { id: reviewId },
    data: {
      employeeComments,
      status: 'acknowledged',
      acknowledgedAt: new Date()
    }
  })
}

// ============================================================================
// PERFORMANCE REPORTS
// ============================================================================

async function getEmployeePerformanceHistory(employeeId) {
  const reviews = await prisma.performanceReviewRecord.findMany({
    where: { employeeId, status: { not: 'pending' } },
    include: {
      cycle: true
    },
    orderBy: { reviewDate: 'desc' }
  })

  const ratings = reviews
    .filter(r => r.overallRating !== null)
    .map(r => ({
      cycle: r.cycle.name,
      date: r.reviewDate,
      rating: Number(r.overallRating)
    }))

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null

  return {
    employeeId,
    totalReviews: reviews.length,
    averageRating: avgRating,
    ratings,
    reviews
  }
}

async function getCyclePerformanceReport(cycleId) {
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: cycleId },
    include: {
      reviews: {
        where: { status: { not: 'pending' } },
        include: {
          employee: {
            select: {
              name: true,
              employeeNumber: true,
              department: { select: { name: true } }
            }
          }
        }
      }
    }
  })

  if (!cycle) throw ApiError.notFound('Performance cycle not found')

  const completedReviews = cycle.reviews.filter(r => r.overallRating !== null)
  const avgRating = completedReviews.length > 0
    ? completedReviews.reduce((sum, r) => sum + Number(r.overallRating), 0) / completedReviews.length
    : null

  const ratingDistribution = {
    excellent: completedReviews.filter(r => Number(r.overallRating) >= 4.5).length,
    good: completedReviews.filter(r => Number(r.overallRating) >= 3.5 && Number(r.overallRating) < 4.5).length,
    average: completedReviews.filter(r => Number(r.overallRating) >= 2.5 && Number(r.overallRating) < 3.5).length,
    poor: completedReviews.filter(r => Number(r.overallRating) < 2.5).length
  }

  return {
    cycle: {
      id: cycle.id,
      name: cycle.name,
      startDate: cycle.startDate,
      endDate: cycle.endDate
    },
    summary: {
      totalReviews: cycle.reviews.length,
      completed: completedReviews.length,
      pending: cycle.reviews.filter(r => r.status === 'pending').length,
      averageRating: avgRating,
      ratingDistribution
    },
    reviews: cycle.reviews
  }
}

module.exports = {
  // Metrics
  createPerformanceMetric,
  getPerformanceMetrics,
  updatePerformanceMetric,

  // Cycles
  createPerformanceCycle,
  getPerformanceCycles,
  updatePerformanceCycle,

  // Reviews
  createPerformanceReview,
  getPerformanceReviews,
  updatePerformanceReview,
  submitPerformanceReview,
  acknowledgeReview,

  // Reports
  getEmployeePerformanceHistory,
  getCyclePerformanceReport
}
