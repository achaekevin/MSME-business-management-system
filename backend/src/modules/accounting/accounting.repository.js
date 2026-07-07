const { prisma } = require('../../config/database')

// ── Chart of Accounts ─────────────────────────────────────────────────────────

function findAllAccounts(businessId) {
  return prisma.account.findMany({
    where: { businessId },
    include: {
      parent: { select: { id: true, name: true, code: true } },
      children: { select: { id: true, name: true, code: true } }
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }]
  })
}

function findAccountById(businessId, id) {
  return prisma.account.findFirst({
    where: { id, businessId },
    include: {
      parent: { select: { id: true, name: true, code: true } },
      children: { select: { id: true, name: true, code: true } },
      journalLines: {
        take: 20,
        orderBy: { entry: { date: 'desc' } },
        include: { entry: { select: { entryNumber: true, date: true, description: true } } }
      }
    }
  })
}

function findAccountByCode(businessId, code, excludeId) {
  return prisma.account.findFirst({
    where: { businessId, code, ...(excludeId ? { id: { not: excludeId } } : {}) }
  })
}

function findAccountById_parent(businessId, id) {
  return prisma.account.findFirst({ where: { id, businessId } })
}

function aggregateJournalLineBalances(businessId) {
  return prisma.journalLine.groupBy({
    by: ['accountId'],
    where: { entry: { businessId } },
    _sum: { debit: true, credit: true }
  })
}

function createAccount(businessId, data) {
  const { businessId: _b, ...rest } = data
  return prisma.account.create({ data: { ...rest, businessId } })
}

function updateAccount(id, data) {
  const { businessId: _b, ...rest } = data
  return prisma.account.update({ where: { id }, data: rest })
}

// ── Journal Entries ───────────────────────────────────────────────────────────

function findJournals(businessId, { skip, take, orderBy, startDate, endDate, search }) {
  const where = {
    businessId,
    ...(startDate || endDate ? {
      date: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {}),
    ...(search ? {
      OR: [
        { entryNumber: { contains: search } },
        { description: { contains: search } }
      ]
    } : {})
  }
  return Promise.all([
    prisma.journalEntry.findMany({
      where, skip, take, orderBy,
      include: {
        lines: { include: { account: { select: { id: true, code: true, name: true, type: true } } } },
        createdBy: { select: { id: true, name: true } }
      }
    }),
    prisma.journalEntry.count({ where })
  ])
}

function findJournalById(businessId, id) {
  return prisma.journalEntry.findFirst({
    where: { id, businessId },
    include: {
      lines: { include: { account: true } },
      createdBy: { select: { id: true, name: true } }
    }
  })
}

function countJournals(businessId) {
  return prisma.journalEntry.count({ where: { businessId } })
}

function findAccountsByIds(businessId, ids) {
  return prisma.account.findMany({ where: { businessId, id: { in: ids } } })
}

function createJournal(businessId, entryNumber, date, description, reference, userId, lines) {
  return prisma.journalEntry.create({
    data: {
      businessId, entryNumber,
      date: new Date(date), description, reference,
      createdById: userId,
      lines: {
        create: lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit || 0,
          credit: l.credit || 0,
          memo: l.memo
        }))
      }
    },
    include: {
      lines: { include: { account: { select: { id: true, code: true, name: true } } } }
    }
  })
}

// ── Reporting queries ─────────────────────────────────────────────────────────

function getJournalLinesForTrialBalance(businessId, asOf) {
  return prisma.journalLine.findMany({
    where: {
      entry: {
        businessId,
        ...(asOf ? { date: { lte: new Date(asOf) } } : {})
      }
    },
    include: { account: { select: { id: true, code: true, name: true, type: true } } }
  })
}

function getJournalLinesForPL(businessId, startDate, endDate) {
  return prisma.journalLine.findMany({
    where: {
      entry: {
        businessId,
        ...(startDate || endDate ? {
          date: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {})
          }
        } : {})
      },
      account: { type: { in: ['income', 'expense'] } }
    },
    include: { account: { select: { id: true, code: true, name: true, type: true } } }
  })
}

function getLedgerLines(accountId, businessId, { skip, take, startDate, endDate }) {
  const where = {
    accountId,
    entry: {
      businessId,
      ...(startDate || endDate ? {
        date: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {})
        }
      } : {})
    }
  }
  return Promise.all([
    prisma.journalLine.findMany({
      where, skip, take,
      orderBy: { entry: { date: 'asc' } },
      include: { entry: { select: { entryNumber: true, date: true, description: true, reference: true } } }
    }),
    prisma.journalLine.count({ where })
  ])
}

function getTaxData(businessId, startDate, endDate) {
  const where = {
    businessId,
    status: { not: 'voided' },
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {})
  }
  return Promise.all([
    prisma.saleOrder.aggregate({ where, _sum: { taxAmount: true, total: true }, _count: true }),
    prisma.purchaseOrder.aggregate({
      where: { ...where, status: 'received' },
      _sum: { taxAmount: true, total: true },
      _count: true
    })
  ])
}

module.exports = {
  findAllAccounts, findAccountById, findAccountByCode, findAccountById_parent,
  aggregateJournalLineBalances, createAccount, updateAccount,
  findJournals, findJournalById, countJournals, findAccountsByIds, createJournal,
  getJournalLinesForTrialBalance, getJournalLinesForPL, getLedgerLines, getTaxData
}
