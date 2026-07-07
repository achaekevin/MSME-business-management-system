const { parsePagination, buildSearchClause } = require('../../src/helpers/pagination')

describe('parsePagination', () => {
  it('uses defaults when query is empty', () => {
    const result = parsePagination({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(25)
    expect(result.skip).toBe(0)
    expect(result.take).toBe(25)
  })

  it('parses valid page and limit', () => {
    const result = parsePagination({ page: '3', limit: '10' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(10)
    expect(result.skip).toBe(20) // (3-1) * 10
  })

  it('clamps page to minimum 1', () => {
    const result = parsePagination({ page: '-5' })
    expect(result.page).toBe(1)
  })

  it('clamps limit to maximum 100', () => {
    const result = parsePagination({ limit: '500' })
    expect(result.limit).toBe(100)
  })

  it('builds correct orderBy when sortBy is provided', () => {
    const { orderBy } = parsePagination({ sortBy: 'name', sortOrder: 'asc' })
    expect(orderBy).toEqual({ name: 'asc' })
  })

  it('defaults orderBy to createdAt desc', () => {
    const { orderBy } = parsePagination({})
    expect(orderBy).toEqual({ createdAt: 'desc' })
  })
})

describe('buildSearchClause', () => {
  it('returns undefined when search is empty', () => {
    expect(buildSearchClause('', ['name', 'email'])).toBeUndefined()
    expect(buildSearchClause(null, ['name'])).toBeUndefined()
  })

  it('builds OR clause across given fields', () => {
    const clause = buildSearchClause('acme', ['name', 'email', 'phone'])
    expect(clause).toEqual({
      OR: [
        { name: { contains: 'acme' } },
        { email: { contains: 'acme' } },
        { phone: { contains: 'acme' } }
      ]
    })
  })
})
