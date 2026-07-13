const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')

// ============================================================================
// FIXED ASSETS
// ============================================================================

async function createFixedAsset(businessId, data) {
  const lastAsset = await prisma.fixedAsset.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: { assetNumber: true }
  })

  const assetNumber = generateAssetNumber(lastAsset?.assetNumber)
  const currentValue = Number(data.purchasePrice) - Number(data.accumulatedDepr || 0)

  return await prisma.fixedAsset.create({
    data: {
      businessId,
      assetNumber,
      currentValue,
      ...data
    }
  })
}

async function getFixedAssets(businessId, filters = {}) {
  const where = { businessId }
  if (filters.status) where.status = filters.status
  if (filters.category) where.category = filters.category

  return await prisma.fixedAsset.findMany({
    where,
    include: {
      _count: {
        select: { depreciationEntries: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function getFixedAssetDetails(assetId) {
  return await prisma.fixedAsset.findUnique({
    where: { id: assetId },
    include: {
      depreciationEntries: {
        orderBy: { periodStart: 'desc' }
      }
    }
  })
}

async function updateFixedAsset(assetId, data) {
  return await prisma.fixedAsset.update({
    where: { id: assetId },
    data
  })
}

async function disposeAsset(assetId, disposalData) {
  return await prisma.fixedAsset.update({
    where: { id: assetId },
    data: {
      status: 'disposed',
      disposalDate: disposalData.disposalDate || new Date(),
      disposalValue: disposalData.disposalValue,
      disposalNotes: disposalData.notes,
      currentValue: 0
    }
  })
}

// ============================================================================
// DEPRECIATION
// ============================================================================

async function calculateDepreciation(assetId, periodStart, periodEnd) {
  const asset = await prisma.fixedAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw ApiError.notFound('Asset not found')

  const openingValue = Number(asset.currentValue)
  const purchasePrice = Number(asset.purchasePrice)
  const residualValue = Number(asset.residualValue)
  const depreciableAmount = purchasePrice - residualValue

  let depreciationAmount = 0

  if (asset.depreciationMethod === 'straight_line') {
    // Straight Line: (Cost - Residual) / Useful Life
    const periodsInYear = asset.depreciationPeriod === 'monthly' ? 12 : 1
    depreciationAmount = depreciableAmount / asset.usefulLife / (asset.depreciationPeriod === 'monthly' ? 1 : periodsInYear)
  } else if (asset.depreciationMethod === 'declining_balance') {
    // Declining Balance: Current Value * (200% / Useful Life)
    const rate = 2 / asset.usefulLife
    depreciationAmount = openingValue * rate
  }

  const accumulatedDepr = Number(asset.accumulatedDepr) + depreciationAmount
  const closingValue = purchasePrice - accumulatedDepr

  return {
    openingValue,
    depreciationAmount,
    accumulatedDepr,
    closingValue: closingValue > 0 ? closingValue : 0
  }
}

async function createDepreciationEntry(assetId, periodStart, periodEnd) {
  const depreciation = await calculateDepreciation(assetId, periodStart, periodEnd)

  const entry = await prisma.depreciationEntry.create({
    data: {
      fixedAssetId: assetId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      ...depreciation
    }
  })

  // Update asset values
  await prisma.fixedAsset.update({
    where: { id: assetId },
    data: {
      accumulatedDepr: depreciation.accumulatedDepr,
      currentValue: depreciation.closingValue
    }
  })

  return entry
}

async function getDepreciationSchedule(assetId) {
  const asset = await prisma.fixedAsset.findUnique({ 
    where: { id: assetId },
    include: {
      depreciationEntries: {
        orderBy: { periodStart: 'asc' }
      }
    }
  })

  if (!asset) throw ApiError.notFound('Asset not found')

  const schedule = []
  let remainingValue = Number(asset.purchasePrice)
  const residualValue = Number(asset.residualValue)
  const periodsInYear = asset.depreciationPeriod === 'monthly' ? 12 : 1
  const totalPeriods = asset.usefulLife * (asset.depreciationPeriod === 'monthly' ? 1 : periodsInYear)

  for (let period = 1; period <= totalPeriods; period++) {
    if (remainingValue <= residualValue) break

    const periodStart = new Date(asset.purchaseDate)
    if (asset.depreciationPeriod === 'monthly') {
      periodStart.setMonth(periodStart.getMonth() + period - 1)
    } else {
      periodStart.setFullYear(periodStart.getFullYear() + period - 1)
    }

    const periodEnd = new Date(periodStart)
    if (asset.depreciationPeriod === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }

    let depreciationAmount = 0
    if (asset.depreciationMethod === 'straight_line') {
      depreciationAmount = (Number(asset.purchasePrice) - residualValue) / totalPeriods
    } else if (asset.depreciationMethod === 'declining_balance') {
      const rate = 2 / asset.usefulLife
      depreciationAmount = remainingValue * rate / periodsInYear
    }

    const accumulatedDepr = Number(asset.purchasePrice) - remainingValue + depreciationAmount
    remainingValue -= depreciationAmount

    schedule.push({
      period,
      periodStart,
      periodEnd,
      openingValue: remainingValue + depreciationAmount,
      depreciationAmount,
      accumulatedDepr,
      closingValue: remainingValue
    })
  }

  return {
    asset: {
      id: asset.id,
      name: asset.name,
      purchasePrice: Number(asset.purchasePrice),
      residualValue: Number(asset.residualValue),
      usefulLife: asset.usefulLife,
      depreciationMethod: asset.depreciationMethod,
      depreciationPeriod: asset.depreciationPeriod
    },
    schedule
  }
}

async function runMonthlyDepreciation(businessId, periodStart, periodEnd) {
  const assets = await prisma.fixedAsset.findMany({
    where: {
      businessId,
      status: 'active',
      depreciationPeriod: 'monthly',
      purchaseDate: { lte: new Date(periodStart) }
    }
  })

  const entries = []
  for (const asset of assets) {
    // Check if already depreciated for this period
    const existing = await prisma.depreciationEntry.findFirst({
      where: {
        fixedAssetId: asset.id,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd)
      }
    })

    if (!existing) {
      const entry = await createDepreciationEntry(asset.id, periodStart, periodEnd)
      entries.push(entry)
    }
  }

  return {
    period: { periodStart, periodEnd },
    processedAssets: entries.length,
    entries
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateAssetNumber(lastNumber) {
  if (!lastNumber) return 'AST-0001'
  const num = parseInt(lastNumber.split('-')[1]) + 1
  return `AST-${String(num).padStart(4, '0')}`
}

module.exports = {
  createFixedAsset,
  getFixedAssets,
  getFixedAssetDetails,
  updateFixedAsset,
  disposeAsset,
  calculateDepreciation,
  createDepreciationEntry,
  getDepreciationSchedule,
  runMonthlyDepreciation
}
