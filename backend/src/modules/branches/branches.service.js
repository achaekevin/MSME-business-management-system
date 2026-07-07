const repo = require('./branches.repository')
const { ApiError } = require('../../helpers/response')

async function listBranches(businessId) {
  return repo.findMany(businessId)
}

async function getBranch(businessId, id) {
  const branch = await repo.findById(businessId, id)
  if (!branch) throw ApiError.notFound('Branch not found')
  return branch
}

async function createBranch(businessId, data, req) {
  const existing = await repo.findByCode(businessId, data.code)
  if (existing) throw ApiError.conflict(`Branch code "${data.code}" is already in use`)

  // Check subscription branch limit
  const sub = await repo.getSubscription(businessId)
  const branchLimit = sub?.limits?.branches ?? 1
  if (branchLimit !== -1) {
    const count = await repo.count(businessId)
    if (count >= branchLimit) {
      throw ApiError.forbidden(`Your plan allows a maximum of ${branchLimit} branch(es). Upgrade to add more.`)
    }
  }

  const branch = await repo.create(businessId, data)
  req?.audit?.('branch.created', 'Branch', branch.id, { name: branch.name, code: branch.code })
  return branch
}

async function updateBranch(businessId, id, data, req) {
  const branch = await repo.findById(businessId, id)
  if (!branch) throw ApiError.notFound('Branch not found')

  if (data.code && data.code !== branch.code) {
    const conflict = await repo.findByCode(businessId, data.code, id)
    if (conflict) throw ApiError.conflict(`Branch code "${data.code}" is already in use`)
  }

  const updated = await repo.update(id, data)
  req?.audit?.('branch.updated', 'Branch', id, { changes: data })
  return updated
}

async function deleteBranch(businessId, id, req) {
  const branch = await repo.findById(businessId, id)
  if (!branch) throw ApiError.notFound('Branch not found')
  if (branch.isHeadquarters) throw ApiError.badRequest('Cannot delete the headquarters branch')

  const hasUsers = await repo.countUsers(id)
  if (hasUsers > 0) throw ApiError.badRequest('Reassign all users before deleting this branch')

  await repo.remove(id)
  req?.audit?.('branch.deleted', 'Branch', id)
  return { deleted: true }
}

async function setBranchActive(businessId, id, isActive, req) {
  const branch = await repo.findById(businessId, id)
  if (!branch) throw ApiError.notFound('Branch not found')
  if (branch.isHeadquarters && !isActive) throw ApiError.badRequest('Cannot deactivate the headquarters branch')

  const updated = await repo.setActive(id, isActive)
  req?.audit?.('branch.status_changed', 'Branch', id, { isActive })
  return updated
}

module.exports = { listBranches, getBranch, createBranch, updateBranch, deleteBranch, setBranchActive }
