const request = require('supertest')
const { app, getAuthToken, cleanupBusiness } = require('../helpers')
const { prisma } = require('../../src/config/database')

describe('Payroll API', () => {
  let token, business, branch, department, employees

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    business = auth.business
    branch = auth.branch

    department = await prisma.department.create({ data: { businessId: business.id, name: 'Operations' } })

    // Create 3 active employees
    employees = await Promise.all([
      prisma.employee.create({ data: { businessId: business.id, branchId: branch.id, departmentId: department.id, employeeNumber: `PR-001-${Date.now()}`, name: 'Alice K', email: `alice-pr-${Date.now()}@test.com`, salary: 60000, salaryType: 'monthly', joinDate: new Date('2023-01-01'), status: 'active' } }),
      prisma.employee.create({ data: { businessId: business.id, branchId: branch.id, departmentId: department.id, employeeNumber: `PR-002-${Date.now()}`, name: 'Bob M', email: `bob-pr-${Date.now()}@test.com`, salary: 45000, salaryType: 'monthly', joinDate: new Date('2023-03-01'), status: 'active' } }),
      prisma.employee.create({ data: { businessId: business.id, branchId: branch.id, departmentId: department.id, employeeNumber: `PR-003-${Date.now()}`, name: 'Carol N', email: `carol-pr-${Date.now()}@test.com`, salary: 80000, salaryType: 'monthly', joinDate: new Date('2023-06-01'), status: 'active' } })
    ])
  })

  afterAll(async () => { await cleanupBusiness(business?.id) })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('POST /api/payroll/process', () => {
    it('processes payroll for all active employees', async () => {
      const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      const res = await request(app).post('/api/payroll/process').set(auth()).send({
        period,
        allowances: [{ name: 'Transport Allowance', amount: 5000 }],
        deductions: [{ name: 'Loan Repayment', amount: 2000, employeeId: employees[0].id }]
      })

      expect(res.status).toBe(201)
      expect(res.body.data.period).toBe(period)
      expect(res.body.data.status).toBe('draft')
      expect(res.body.data.payslips).toHaveLength(employees.length)

      // All net salaries should be positive
      res.body.data.payslips.forEach((ps) => {
        expect(Number(ps.netSalary)).toBeGreaterThan(0)
        expect(Number(ps.grossSalary)).toBeGreaterThan(0)
        expect(Number(ps.deductions)).toBeGreaterThan(0) // tax deducted
      })

      // Total amount should be sum of net salaries
      const totalNet = res.body.data.payslips.reduce((s, ps) => s + Number(ps.netSalary), 0)
      expect(Math.abs(Number(res.body.data.totalAmount) - totalNet)).toBeLessThan(1)
    })

    it('rejects duplicate period', async () => {
      const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      const res = await request(app).post('/api/payroll/process').set(auth()).send({ period })
      expect(res.status).toBe(409)
    })

    it('rejects invalid period format', async () => {
      const res = await request(app).post('/api/payroll/process').set(auth()).send({ period: '2024/01' })
      expect(res.status).toBe(400)
    })
  })

  describe('Payroll approval and disbursement flow', () => {
    let runId, period

    beforeAll(async () => {
      period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, '0')}` // next month
      const res = await request(app).post('/api/payroll/process').set(auth()).send({
        period,
        employeeIds: [employees[0].id, employees[1].id]
      })
      runId = res.body.data.id
    })

    it('approves a draft payroll run', async () => {
      const res = await request(app).post(`/api/payroll/${runId}/approve`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('approved')
      expect(res.body.data.approvedAt).not.toBeNull()
    })

    it('cannot approve an already-approved run', async () => {
      const res = await request(app).post(`/api/payroll/${runId}/approve`).set(auth())
      expect(res.status).toBe(409)
    })

    it('disburses an approved payroll run', async () => {
      const res = await request(app).post(`/api/payroll/${runId}/disburse`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('disbursed')
      expect(res.body.data.disbursedAt).not.toBeNull()
    })

    it('cannot disburse a non-approved run', async () => {
      const res = await request(app).post(`/api/payroll/${runId}/disburse`).set(auth())
      expect(res.status).toBe(409)
    })
  })

  describe('GET /api/payroll', () => {
    it('lists payroll runs', async () => {
      const res = await request(app).get('/api/payroll').set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.data).toBeInstanceOf(Array)
    })
  })

  describe('Payslip', () => {
    it('retrieves a payslip for a specific employee', async () => {
      const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 3).padStart(2, '0')}`
      const runRes = await request(app).post('/api/payroll/process').set(auth()).send({
        period, employeeIds: [employees[2].id]
      })
      const runId = runRes.body.data.id
      const employeeId = employees[2].id

      const res = await request(app).get(`/api/payroll/${runId}/payslips/${employeeId}`).set(auth())
      expect(res.status).toBe(200)
      expect(res.body.data.employeeId).toBe(employeeId)
      expect(Number(res.body.data.netSalary)).toBeGreaterThan(0)
    })
  })
})
