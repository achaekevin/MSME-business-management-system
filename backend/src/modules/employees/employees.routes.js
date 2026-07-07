const express = require('express')
const router = express.Router()
const controller = require('./employees.controller')
const validators = require('./employees.validators')
const { validate } = require('../../middleware/validation.middleware')
const { authenticate } = require('../../middleware/auth.middleware')
const { tenantContext } = require('../../middleware/tenant.middleware')
const { requirePermission } = require('../../middleware/permission.middleware')
const auditMiddleware = require('../../middleware/audit.middleware')
const { uploadDocument } = require('../../middleware/upload.middleware')
const { PERMISSIONS } = require('../../constants/permissions')

router.use(authenticate, tenantContext, auditMiddleware)

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: HR management — employees, departments, attendance, leaves
 */

// Analytics
router.get('/analytics', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), controller.analytics)

// Departments
router.get('/departments', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), controller.listDepts)
router.post('/departments', requirePermission(PERMISSIONS.EMPLOYEES_CREATE), validate(validators.departmentSchema), controller.createDept)
router.put('/departments/:id', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), validate(validators.departmentSchema.partial()), controller.updateDept)
router.delete('/departments/:id', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), controller.deleteDept)

// Positions
router.get('/positions', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), controller.listPositions)
router.post('/positions', requirePermission(PERMISSIONS.EMPLOYEES_CREATE), validate(validators.positionSchema), controller.createPosition)

// Attendance
router.get('/attendance', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), controller.listAttendance)
router.post('/attendance', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), validate(validators.attendanceSchema), controller.recordAttendance)

// Leaves
router.get('/leaves', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), controller.listLeaves)
router.post('/leaves', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), validate(validators.leaveSchema), controller.applyLeave)
router.patch('/leaves/:id/approve', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), controller.approveLeave)
router.patch('/leaves/:id/reject', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), controller.rejectLeave)

// Employees CRUD
router.get('/', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), controller.list)
router.get('/:id', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), controller.getOne)
router.post('/', requirePermission(PERMISSIONS.EMPLOYEES_CREATE), validate(validators.employeeSchema), controller.create)
router.put('/:id', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), validate(validators.employeeSchema.partial()), controller.update)
router.post('/:id/terminate', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), controller.terminate)
router.post('/:id/documents', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), uploadDocument.single('document'), controller.uploadDoc)
router.post('/:id/reviews', requirePermission(PERMISSIONS.EMPLOYEES_EDIT), validate(validators.reviewSchema), controller.addReview)

module.exports = router
