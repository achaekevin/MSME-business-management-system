const { prisma } = require('../../config/database')
const { ApiError } = require('../../helpers/response')
const { parsePagination } = require('../../helpers/pagination')
const { emitToBusiness } = require('../../config/socket')
const { invalidateTenantCache } = require('../../config/redis')
const { notificationsQueue } = require('../../queues')
const repo = require('./sales.repository')
const inventoryService = require('../inventory/inventory.service')
const customerRepo = require('../customers/customers.repository')

// ─────────────────────────────────────────────────────────────────────────────
// SALE ORDERS
// ─────────────────────────────────────────────────────────────────────────────

async function listSales(businessId, query) {
  const { page, limit, skip, take, orderBy } = parsePagination(query)
  const [items, total] = await repo.findMany(businessId, {
    skip, take, orderBy, ...query
  })
  return { items, total, page, limit }
}

async function getSale(businessId, id) {
  const sale = await repo.findById(businessId, id)
  if (!sale) throw ApiError.notFound('Sale not found')
  return sale
}

/**
 * Creating a sale is the most complex operation in the system:
 *   1. Validate all items exist and belong to this business.
 *   2. Check inventory availability.
 *   3. Compute totals (subtotal, tax, discount, balance).
 *   4. Create the SaleOrder and items.
 *   5. Deduct inventory stock for each item.
 *   6. Update the customer's balance and total purchases.
 *   7. Create journal entries (double-entry: DR Accounts Receivable, CR Sales Revenue).
 *   8. Emit a real-time event to business sockets.
 *   9. Enqueue a notification.
 * All steps 1-7 happen inside a single Prisma transaction.
 */
async function createSale(businessId, data, userId, req) {
  const orderNumber = await repo.findNextOrderNumber(businessId)

  const { customerId, branchId, items, discountAmount = 0, paymentMethod, amountPaid = 0, notes } = data

  // ── Validate products and check stock ──────────────────────────────────────
  const products = await prisma.product.findMany({
    where: { businessId, id: { in: items.map((i) => i.productId) } },
    include: { inventoryStocks: true }
  })

  if (products.length !== items.length) {
    throw ApiError.badRequest('One or more products not found or do not belong to this business')
  }

  // Check stock availability per item
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product.trackInventory) continue
    const totalStock = product.inventoryStocks.reduce((sum, s) => sum + Number(s.quantity), 0)
    if (totalStock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for "${product.name}". Available: ${totalStock}, Requested: ${item.quantity}`)
    }
  }

  // ── Compute totals ─────────────────────────────────────────────────────────
  let subtotal = 0, taxAmount = 0
  const enrichedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    const itemSubtotal = item.unitPrice * item.quantity
    const itemDiscount = item.discount || 0
    const itemTax = (itemSubtotal - itemDiscount) * (item.tax / 100)
    const total = itemSubtotal - itemDiscount + itemTax
    subtotal += itemSubtotal
    taxAmount += itemTax
    return { ...item, total }
  })

  const total = subtotal - discountAmount + taxAmount
  const balance = Math.max(0, total - amountPaid)
  const status = balance === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'confirmed'

  const result = await prisma.$transaction(async (tx) => {
    // ── Create sale order ──────────────────────────────────────────────────
    const sale = await tx.saleOrder.create({
      data: {
        businessId, branchId, orderNumber, customerId, notes, paymentMethod, amountPaid,
        subtotal, discountAmount, taxAmount, total, balance, status,
        createdById: userId,
        items: { create: enrichedItems }
      },
      include: { items: { include: { product: true } }, customer: true }
    })

    // ── Deduct inventory ───────────────────────────────────────────────────
    for (const item of enrichedItems) {
      const product = products.find((p) => p.id === item.productId)
      if (!product.trackInventory) continue

      const stocks = product.inventoryStocks.filter((s) => s.branchId === branchId || !s.branchId)
      let remaining = item.quantity

      for (const stock of stocks) {
        if (remaining <= 0) break
        const deduct = Math.min(remaining, Number(stock.quantity))

        await tx.inventoryStock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: deduct } }
        })

        await tx.inventoryTransaction.create({
          data: {
            businessId, productId: item.productId,
            warehouseId: stock.warehouseId,
            type: 'out', quantity: deduct,
            previousStock: Number(stock.quantity),
            newStock: Number(stock.quantity) - deduct,
            referenceType: 'sale', referenceId: sale.id,
            performedById: userId
          }
        })
        remaining -= deduct
      }
    }

    // ── Update customer balance ────────────────────────────────────────────
    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: { increment: balance },
          totalPurchases: { increment: total }
        }
      })

      // Append to customer ledger
      const current = await tx.customer.findUnique({ where: { id: customerId }, select: { balance: true } })
      await tx.customerLedger.create({
        data: {
          customerId,
          type: 'invoice', referenceId: sale.id,
          debit: total, credit: 0,
          balance: Number(current.balance),
          description: `Sale ${orderNumber}`
        }
      })
    }

    // ── Double-entry: DR Accounts Receivable / DR Cash, CR Revenue ─────────
    const arAccount = await tx.account.findFirst({ where: { businessId, type: 'asset', name: { contains: 'Receivable' } } })
    const revenueAccount = await tx.account.findFirst({ where: { businessId, type: 'income' } })

    if (arAccount && revenueAccount) {
      const count = await tx.journalEntry.count({ where: { businessId } })
      await tx.journalEntry.create({
        data: {
          businessId,
          entryNumber: `JE-${String(count + 1).padStart(5, '0')}`,
          date: new Date(), description: `Sale ${orderNumber}`,
          referenceType: 'sale', referenceId: sale.id,
          createdById: userId,
          lines: {
            create: [
              { accountId: arAccount.id, debit: total, credit: 0 },
              { accountId: revenueAccount.id, debit: 0, credit: total }
            ]
          }
        }
      })
    }

    return sale
  })

  await invalidateTenantCache(businessId, 'dashboard')
  emitToBusiness(businessId, 'sale:created', { saleId: result.id, total, orderNumber })

  await notificationsQueue.add('sale-created-notification', {
    businessId, userId,
    title: 'New sale recorded',
    message: `Sale ${orderNumber} totaling ${total} has been created`,
    type: 'success', link: `/sales/${result.id}`
  })

  req?.audit?.('sale.created', 'SaleOrder', result.id, { orderNumber, total })
  return result
}

async function voidSale(businessId, id, reason, userId, req) {
  const sale = await repo.findById(businessId, id)
  if (!sale) throw ApiError.notFound('Sale not found')
  if (sale.status === 'voided') throw ApiError.conflict('Sale is already voided')

  await prisma.$transaction(async (tx) => {
    await tx.saleOrder.update({ where: { id }, data: { status: 'voided' } })

    // Reverse inventory: add back the stock that was deducted
    for (const item of sale.items) {
      if (!item.product.trackInventory) continue
      const stock = await tx.inventoryStock.findFirst({
        where: { productId: item.productId }
      })
      if (!stock) continue

      await tx.inventoryStock.update({ where: { id: stock.id }, data: { quantity: { increment: item.quantity } } })
      await tx.inventoryTransaction.create({
        data: {
          businessId, productId: item.productId,
          warehouseId: stock.warehouseId,
          type: 'in', quantity: Number(item.quantity),
          previousStock: Number(stock.quantity),
          newStock: Number(stock.quantity) + Number(item.quantity),
          referenceType: 'sale_void', referenceId: id,
          reason, performedById: userId
        }
      })
    }

    if (sale.customerId) {
      await tx.customer.update({
        where: { id: sale.customerId },
        data: {
          balance: { decrement: sale.balance },
          totalPurchases: { decrement: sale.total }
        }
      })
    }
  })

  await invalidateTenantCache(businessId, 'dashboard')
  emitToBusiness(businessId, 'sale:voided', { saleId: id })
  req?.audit?.('sale.voided', 'SaleOrder', id, { reason })
  return repo.findById(businessId, id)
}

async function createReturn(businessId, saleId, data, req) {
  const sale = await repo.findById(businessId, saleId)
  if (!sale) throw ApiError.notFound('Sale not found')
  if (sale.status === 'voided') throw ApiError.badRequest('Cannot create a return on a voided sale')
  if (data.amount > Number(sale.amountPaid)) throw ApiError.badRequest('Return amount exceeds amount paid')

  const result = await repo.createReturn(saleId, data)
  req?.audit?.('sale.return', 'SaleReturn', result.id, { saleId, amount: data.amount })
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function listQuotations(businessId, query) {
  const { page, limit, skip, take, orderBy } = parsePagination(query)
  const [items, total] = await repo.getQuotations(businessId, { skip, take, orderBy })
  return { items, total, page, limit }
}

async function createQuotation(businessId, data, req) {
  const { items, customerId, discountAmount = 0, validUntil, notes } = data

  let subtotal = 0, taxAmount = 0
  const enrichedItems = items.map((item) => {
    const itemTotal = item.unitPrice * item.quantity - (item.discount || 0)
    const itemTax = itemTotal * (item.tax / 100)
    subtotal += item.unitPrice * item.quantity
    taxAmount += itemTax
    return { ...item, total: itemTotal + itemTax }
  })

  const count = await prisma.quotation.count({ where: { businessId } })
  const quoteNumber = `QT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`
  const total = subtotal - discountAmount + taxAmount

  const quotation = await prisma.quotation.create({
    data: {
      businessId, customerId, quoteNumber, subtotal, discountAmount, taxAmount, total,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      notes, status: 'draft',
      items: { create: enrichedItems }
    },
    include: { customer: true, items: { include: { product: true } } }
  })

  req?.audit?.('quotation.created', 'Quotation', quotation.id)
  return quotation
}

async function convertQuotationToSale(businessId, quotationId, userId, req) {
  const quotation = await repo.findQuotationById(businessId, quotationId)
  if (!quotation) throw ApiError.notFound('Quotation not found')
  if (quotation.status !== 'draft' && quotation.status !== 'sent') {
    throw ApiError.conflict('Only draft or sent quotations can be converted to a sale')
  }

  const defaultBranch = await prisma.branch.findFirst({ where: { businessId, isHeadquarters: true } })

  const saleData = {
    customerId: quotation.customerId,
    branchId: defaultBranch?.id || req.branchId,
    items: quotation.items.map((i) => ({
      productId: i.productId,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      tax: Number(i.tax)
    })),
    discountAmount: Number(quotation.discountAmount),
    amountPaid: 0,
    notes: quotation.notes,
    businessId
  }

  const sale = await createSale(businessId, saleData, userId, req)
  await repo.updateQuotationStatus(businessId, quotationId, 'converted')
  return sale
}

module.exports = {
  listSales, getSale, createSale, voidSale, createReturn,
  listQuotations, createQuotation, convertQuotationToSale
}
