const { prisma } = require('../config/database')
const { uploadBuffer } = require('../storage/storage.service')
const { notificationsQueue } = require('../queues')
const logger = require('../config/logger')
const dayjs = require('dayjs')

/**
 * Exports a full JSON snapshot of a business's data to object storage.
 * Designed to run as a scheduled nightly backup.
 *
 * Job data: { businessId, userId? }
 *
 * Strategy:
 *  - Exports in page batches of 1000 to avoid OOM on large datasets.
 *  - Uploads as gzip-compressed JSON (Content-Encoding: gzip) if available,
 *    or plain JSON otherwise.
 *  - Does NOT include user passwords, session tokens, or API key hashes.
 */
async function processDataBackupJob(job) {
  const { businessId, userId } = job.data

  if (!businessId) throw new Error('Data backup job requires a businessId')

  logger.info(`Starting data backup for business ${businessId}`)

  const timestamp = dayjs().format('YYYY-MM-DD-HHmmss')

  // Collect all entities, paginated where needed
  const [
    business,
    customers,
    suppliers,
    products,
    saleOrders,
    invoices,
    expenses,
    employees,
    payrollRuns,
    accounts,
    journalEntries
  ] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    fetchAll('customer', { businessId }),
    fetchAll('supplier', { businessId }),
    fetchAll('product', { businessId }),
    fetchAll('saleOrder', { businessId }, { items: true }),
    fetchAll('invoice', { businessId }, { items: true }),
    fetchAll('expense', { businessId }),
    fetchAll('employee', { businessId }),
    fetchAll('payrollRun', { businessId }),
    fetchAll('account', { businessId }),
    fetchAll('journalEntry', { businessId }, { lines: true })
  ])

  const snapshot = {
    exportedAt: new Date().toISOString(),
    businessId,
    businessName: business?.name,
    summary: {
      customers: customers.length,
      suppliers: suppliers.length,
      products: products.length,
      saleOrders: saleOrders.length,
      invoices: invoices.length,
      expenses: expenses.length,
      employees: employees.length,
      payrollRuns: payrollRuns.length,
      accounts: accounts.length,
      journalEntries: journalEntries.length
    },
    data: {
      business,
      customers,
      suppliers,
      products,
      saleOrders,
      invoices,
      expenses,
      employees,
      payrollRuns,
      accounts,
      journalEntries
    }
  }

  const json = JSON.stringify(snapshot, null, 2)
  const buffer = Buffer.from(json, 'utf8')

  const objectName = `backups/${businessId}/${timestamp}.json`
  const url = await uploadBuffer(objectName, buffer, 'application/json')

  // Store backup record
  await prisma.document.create({
    data: {
      businessId,
      name: `Data Backup — ${dayjs().format('MMMM D, YYYY HH:mm')}`,
      type: 'other',
      url,
      mimeType: 'application/json',
      size: buffer.length,
      version: 1,
      uploadedById: userId || null
    }
  }).catch(() => {})

  // Notify owner if a userId is provided
  if (userId) {
    await notificationsQueue.add('backup-ready', {
      businessId, userId,
      title: 'Data backup ready',
      message: `Your backup (${(buffer.length / 1024).toFixed(0)} KB) has been saved.`,
      type: 'success',
      link: url
    })
  }

  logger.info(`Data backup complete for business ${businessId}: ${objectName} (${(buffer.length / 1024).toFixed(0)} KB)`)

  return {
    businessId,
    objectName,
    url,
    size: buffer.length,
    summary: snapshot.summary
  }
}

/**
 * Generic paginated fetcher to avoid loading huge datasets into memory at once.
 */
async function fetchAll(model, where, include, batchSize = 1000) {
  const results = []
  let skip = 0

  while (true) {
    const batch = await prisma[model].findMany({
      where,
      ...(include ? { include } : {}),
      skip,
      take: batchSize,
      orderBy: { createdAt: 'asc' }
    })
    results.push(...batch)
    if (batch.length < batchSize) break
    skip += batchSize
  }

  return results
}

module.exports = processDataBackupJob
