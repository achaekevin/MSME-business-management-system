const repo = require('./payroll.repository')
const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const PDFDocument = require('pdfkit')

async function listPayrollRuns(businessId, query) {
  const { skip, take, page, limit, orderBy } = parsePagination(query)
  const [items, total] = await repo.findRuns(businessId, { skip, take, orderBy })
  return { items, total, page, limit }
}

async function getPayrollRun(businessId, id) {
  const run = await repo.findRunById(businessId, id)
  if (!run) throw ApiError.notFound('Payroll run not found')
  return run
}

async function processPayroll(businessId, data, userId, req) {
  const { period, employeeIds, allowances = [], deductions = [] } = data

  const existing = await repo.findRunByPeriod(businessId, period)
  if (existing) throw ApiError.conflict(`A payroll run for period "${period}" already exists`)

  const employees = await repo.findActiveEmployees(businessId, employeeIds)
  if (employees.length === 0) throw ApiError.badRequest('No active employees found to process')

  const payslipData = employees.map((emp) => {
    const grossSalary = Number(emp.salary)

    const totalAllowances = allowances
      .filter((a) => !a.employeeId || a.employeeId === emp.id)
      .reduce((s, a) => s + Number(a.amount || 0), 0)

    const customDeductions = deductions
      .filter((d) => !d.employeeId || d.employeeId === emp.id)
      .reduce((s, d) => s + Number(d.amount || 0), 0)

    // Kenya PAYE tax brackets (localize as needed)
    const taxableIncome = grossSalary + totalAllowances
    let tax = 0
    if (taxableIncome <= 24000) tax = taxableIncome * 0.1
    else if (taxableIncome <= 32333) tax = 2400 + (taxableIncome - 24000) * 0.25
    else tax = 2400 + 2083 + (taxableIncome - 32333) * 0.3
    const nhif = Math.min(1700, Math.max(150, taxableIncome * 0.015))
    const nssf = Math.min(2160, taxableIncome * 0.06)

    const totalDeductions = customDeductions + tax + nhif + nssf
    const netSalary = Math.max(0, grossSalary + totalAllowances - totalDeductions)

    return {
      employeeId: emp.id,
      grossSalary,
      deductions: totalDeductions,
      netSalary,
      breakdown: {
        allowances,
        deductions: [
          { name: 'PAYE Tax', amount: tax },
          { name: 'NHIF', amount: nhif },
          { name: 'NSSF', amount: nssf },
          ...deductions.filter((d) => !d.employeeId || d.employeeId === emp.id)
        ]
      }
    }
  })

  const totalAmount = payslipData.reduce((s, p) => s + p.netSalary, 0)
  const run = await repo.createRun(businessId, period, totalAmount, payslipData)
  req?.audit?.('payroll.processed', 'PayrollRun', run.id, { period, employeeCount: employees.length, totalAmount })
  return run
}

async function approvePayroll(businessId, id, req) {
  const run = await repo.findRunById(businessId, id)
  if (!run) throw ApiError.notFound('Payroll run not found')
  if (run.status !== 'draft') throw ApiError.conflict(`Cannot approve a run with status "${run.status}"`)

  const updated = await repo.approveRun(id)
  req?.audit?.('payroll.approved', 'PayrollRun', id, { period: run.period })
  return updated
}

async function disbursePayroll(businessId, id, req) {
  const run = await repo.findRunById(businessId, id)
  if (!run) throw ApiError.notFound('Payroll run not found')
  if (run.status !== 'approved') throw ApiError.conflict('Payroll must be approved before disbursement')

  await prisma.$transaction(async (tx) => {
    await repo.disburseRunTx(tx, run, req?.userId)
  })

  req?.audit?.('payroll.disbursed', 'PayrollRun', id, { period: run.period, totalAmount: run.totalAmount })
  return repo.findRunById(businessId, id)
}

async function getPayslip(businessId, payrollRunId, employeeId) {
  const run = await repo.findRunWithPayslip(businessId, payrollRunId, employeeId)
  if (!run || !run.payslips.length) throw ApiError.notFound('Payslip not found')
  return run.payslips[0]
}

async function generatePayslipPdf(businessId, payrollRunId, employeeId) {
  const run = await repo.findRunWithPayslip(businessId, payrollRunId, employeeId, true)
  if (!run || !run.payslips.length) throw ApiError.notFound('Payslip not found')

  const payslip = run.payslips[0]
  const emp = payslip.employee
  const business = await repo.findBusiness(businessId)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(20).font('Helvetica-Bold').text(business?.name || 'Business', { align: 'center' })
    doc.fontSize(14).font('Helvetica').text('PAYSLIP', { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).text(`Period: ${run.period}`, { align: 'right' })
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.5)

    doc.font('Helvetica-Bold').text('Employee Information')
    doc.font('Helvetica')
    doc.text(`Name: ${emp.name}`)
    doc.text(`Employee No: ${emp.employeeNumber}`)
    doc.text(`Department: ${emp.department?.name || '—'}`)
    doc.text(`Position: ${emp.position?.title || '—'}`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Earnings')
    doc.font('Helvetica')
    doc.text(`Basic Salary:`, { continued: true }).text(` ${Number(payslip.grossSalary).toFixed(2)}`, { align: 'right' })

    const breakdown = payslip.breakdown || {}
    if (breakdown.allowances?.length) {
      breakdown.allowances.forEach((a) => {
        doc.text(`${a.name}:`, { continued: true }).text(` ${Number(a.amount).toFixed(2)}`, { align: 'right' })
      })
    }
    doc.moveDown(0.3)

    doc.font('Helvetica-Bold').text('Deductions')
    doc.font('Helvetica')
    if (breakdown.deductions?.length) {
      breakdown.deductions.forEach((d) => {
        doc.text(`${d.name}:`, { continued: true }).text(` (${Number(d.amount).toFixed(2)})`, { align: 'right' })
      })
    }
    doc.moveDown(0.3)

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').fontSize(12)
    doc.text('NET SALARY:', { continued: true }).text(` ${Number(payslip.netSalary).toFixed(2)}`, { align: 'right' })
    doc.moveDown(2)
    doc.fontSize(8).font('Helvetica').fillColor('grey')
    doc.text('This is a computer-generated payslip and does not require a signature.', { align: 'center' })

    doc.end()
  })
}

module.exports = {
  listPayrollRuns, getPayrollRun, processPayroll,
  approvePayroll, disbursePayroll,
  generatePayslipPdf, getPayslip
}
