/**
 * @swagger
 * tags:
 *   name: Payroll Workflow
 *   description: Complete payroll workflow - Attendance → Leave → Overtime → Payroll → Accounting
 */

/**
 * @swagger
 * /hr/payroll-workflow/{periodId}/generate:
 *   post:
 *     summary: Generate payroll for a period (Step 1-4)
 *     description: |
 *       Comprehensive payroll generation that:
 *       1. Records attendance
 *       2. Deducts leave
 *       3. Calculates overtime
 *       4. Generates payslips
 *     tags: [Payroll Workflow]
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payroll generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     processedCount:
 *                       type: integer
 *                     failedCount:
 *                       type: integer
 *                     totalGross:
 *                       type: number
 *                     totalDeductions:
 *                       type: number
 *                     totalNet:
 *                       type: number
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Payroll period not found
 */

/**
 * @swagger
 * /hr/payroll-workflow/{periodId}/post-to-accounting:
 *   post:
 *     summary: Post payroll to accounting system (Step 5)
 *     description: |
 *       Creates journal entry:
 *       - Debit: Salary Expense
 *       - Credit: Salaries Payable
 *     tags: [Payroll Workflow]
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Posted to accounting successfully
 *       400:
 *         description: Payroll not approved or already posted
 */

/**
 * @swagger
 * /hr/payroll-workflow/{periodId}/execute:
 *   post:
 *     summary: Execute complete payroll workflow
 *     description: |
 *       Executes all steps in one go:
 *       1. Generate payroll
 *       2. Approve payroll
 *       3. Post to accounting
 *     tags: [Payroll Workflow]
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complete workflow executed successfully
 *       400:
 *         description: Workflow execution failed
 */

/**
 * @swagger
 * /hr/payroll-workflow/calculate-workdays:
 *   get:
 *     summary: Calculate employee work days
 *     description: Calculate paid days including attendance and leave
 *     tags: [Payroll Workflow]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Work days calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDays:
 *                   type: integer
 *                 presentDays:
 *                   type: integer
 *                 leaveDays:
 *                   type: integer
 *                 paidDays:
 *                   type: number
 */

/**
 * @swagger
 * /hr/payroll-workflow/calculate-overtime:
 *   get:
 *     summary: Calculate employee overtime
 *     tags: [Payroll Workflow]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hourlyRate
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Overtime calculated
 */

/**
 * @swagger
 * /hr/payroll-workflow/preview:
 *   post:
 *     summary: Preview payroll calculation
 *     description: Preview payroll before generation
 *     tags: [Payroll Workflow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - startDate
 *               - endDate
 *             properties:
 *               employeeId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Payroll preview
 */

/**
 * @swagger
 * /hr/payroll-workflow/payslip/{payslipId}:
 *   get:
 *     summary: Get detailed payslip
 *     tags: [Payroll Workflow]
 *     parameters:
 *       - in: path
 *         name: payslipId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed payslip
 *       404:
 *         description: Payslip not found
 */

/**
 * @swagger
 * /hr/payroll-workflow/summary:
 *   get:
 *     summary: Get payroll summary
 *     tags: [Payroll Workflow]
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Payroll summary
 */
