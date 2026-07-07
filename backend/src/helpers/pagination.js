const appConfig = require('../config/app')

/**
 * Parses page/limit/sort/search query params into Prisma-ready options.
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(
    appConfig.pagination.maxLimit,
    Math.max(1, parseInt(query.limit, 10) || appConfig.pagination.defaultLimit)
  )
  const skip = (page - 1) * limit

  let orderBy = { createdAt: 'desc' }
  if (query.sortBy) {
    orderBy = { [query.sortBy]: query.sortOrder === 'asc' ? 'asc' : 'desc' }
  }

  return { page, limit, skip, take: limit, orderBy }
}

/**
 * Builds a Prisma `OR` search clause across the given string fields.
 */
function buildSearchClause(search, fields) {
  if (!search) return undefined
  return {
    OR: fields.map((field) => ({ [field]: { contains: search } }))
  }
}

module.exports = { parsePagination, buildSearchClause }
