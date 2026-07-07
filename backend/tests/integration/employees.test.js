const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')

describe('Employees API', () => {
  let token, business, branch, department, position

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
    branch = auth.branch

    department = await prisma.department.create({ data: { businessId: business.id, name: 'Engineering' } })
    position = await prisma.position.create({ data: { businessId: business.id, departmentId: department.id, title: 'Senior Engineer' } })
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('POST /api/employees', () => {
    it('creates an employee with auto-generated number', async () => {
      const res = await request(app).post('/api/employees').set(auth()).send({
        name: 'Jane Doe',
        email: `jane-${Date.now()}@test.com`,
        departmentId: department.id,
        positionId: position.id,
        branchId: branch.id,
        salary: 75000,
        salaryType: 'monthly',
        joinDate: '2024-01-15'
      })
      expect(res.status).toBe(201)
      expect(res.body.data.name).toBe('Jane Doe')
      expect(res.body.data.employeeNumber).toMatch(/^EMP-/)
      expect(res.body.data.businessId).toBe(business.id)
    })

    it('rejects employee with missing salary', async () => {
      const res = await request(app).post('/api/employees').set(auth()).send({
        name: 'No Salary', email: 'nosalary@test.com', joinDate: '2024-01-01'
      })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/employees', () => {
    it('returns paginated employee list', async () => {
      const res = await request(app).get('/api/employees').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('total')
      expect(Array.isArray(res.body.data.data)).toBe(true)
    })

    it('filters by department', async () => {
      const res = await request(app).get(`/api/employees?departmentId=${department.id}`).set(auth())
      expect(res.status).toBe(200)
      res.body.data.data.forEach((e) => expect(e.departmentId).toBe(department.id))
    })
  })

  describe('GET /api/employees/analytics', () => {
    it('returns headcount analytics', async () => {
      const res = await request(app).get('/api/employees/analytics').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('total')
      expect(res.body.data).toHaveProperty('byDepartment')
      expect(res.body.data).toHaveProperty('byStatus')
    })
  })

  describe('Employee CRUD flow', () => {
    let employeeId

    beforeAll(async () => {
      const res = await request(app).post('/api/employees').set(auth()).send({
        name: 'CRUD Employee',
        email: `crud-emp-${Date.now()}@test.com`,
        departmentId: department.id,
        salary: 50000,
        salaryType: 'monthly',
        joinDate: '2024-03-01'
      })
      employeeId = res.body.data.id
    })

    it('gets a single employee', async () => {
      const res = await request(app).get(`/api/employees/${employeeId}`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(employeeId)
    })

    it('updates employee salary', async () => {
      const res = await request(app).put(`/api/employees/${employeeId}`).set(auth()).send({ salary: 60000 })
      expect(res.status).toBe(200)
      expect(Number(res.body.data.salary)).toBe(60000)
    })

    it('terminates an employee', async () => {
      const res = await request(app).post(`/api/employees/${employeeId}/terminate`).set(auth()).send({ reason: 'Resignation' })
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('terminated')
    })
  })

  describe('Attendance', () => {
    let employeeId

    beforeAll(async () => {
      const res = await request(app).post('/api/employees').set(auth()).send({
        name: 'Attendance Employee',
        email: `att-${Date.now()}@test.com`,
        departmentId: department.id,
        salary: 40000,
        salaryType: 'monthly',
        joinDate: '2024-01-01'
      })
      employeeId = res.body.data.id
    })

    it('records attendance', async () => {
      const res = await request(app).post('/api/employees/attendance').set(auth()).send({
        employeeId,
        date: new Date().toISOString().slice(0, 10),
        checkIn: new Date().toISOString(),
        status: 'present'
      })
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('present')
    })

    it('upserts same-day attendance (check out)', async () => {
      const today = new Date().toISOString().slice(0, 10)
      const res = await request(app).post('/api/employees/attendance').set(auth()).send({
        employeeId, date: today, checkOut: new Date().toISOString(), status: 'present'
      })
      expect(res.status).toBe(200)
    })
  })

  describe('Leave Management', () => {
    let employeeId

    beforeAll(async () => {
      const res = await request(app).post('/api/employees').set(auth()).send({
        name: 'Leave Employee',
        email: `leave-${Date.now()}@test.com`,
        departmentId: department.id,
        salary: 45000,
        salaryType: 'monthly',
        joinDate: '2024-01-01'
      })
      employeeId = res.body.data.id
    })

    it('applies for leave', async () => {
      const res = await request(app).post('/api/employees/leaves').set(auth()).send({
        employeeId,
        type: 'annual',
        startDate: '2024-08-01',
        endDate: '2024-08-05',
        reason: 'Family vacation'
      })
      expect(res.status).toBe(201)
      expect(res.body.data.status).toBe('pending')
    })

    it('approves a leave request', async () => {
      const leaveRes = await request(app).post('/api/employees/leaves').set(auth()).send({
        employeeId, type: 'sick',
        startDate: '2024-09-10', endDate: '2024-09-12'
      })
      const leaveId = leaveRes.body.data.id
      const res = await request(app).patch(`/api/employees/leaves/${leaveId}/approve`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('approved')
    })
  })
})
