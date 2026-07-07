const QUEUE_NAMES = {
  EMAIL: 'email',
  SMS: 'sms',
  NOTIFICATIONS: 'notifications',
  REPORT_GENERATION: 'report-generation',
  INVOICE_GENERATION: 'invoice-generation',
  DATA_BACKUPS: 'data-backups',
  AUDIT_LOGGING: 'audit-logging',
  SUBSCRIPTION_RENEWALS: 'subscription-renewals',
  INVENTORY_ALERTS: 'inventory-alerts',
  SCHEDULED_REPORTS: 'scheduled-reports',
  WEBHOOKS: 'webhooks'
}

// Domain events — published internally and optionally mirrored to webhooks.
const EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_INVITED: 'user.invited',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  PRODUCT_LOW_STOCK: 'product.low_stock',
  SALE_CREATED: 'sale.created',
  SALE_VOIDED: 'sale.voided',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_SENT: 'invoice.sent',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  PAYMENT_RECEIVED: 'payment.received',
  PURCHASE_RECEIVED: 'purchase.received',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_EXPIRING: 'subscription.expiring'
}

const SALE_STATUSES = ['draft', 'confirmed', 'partial', 'paid', 'voided']
const INVOICE_STATUSES = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled']
const PURCHASE_STATUSES = ['draft', 'sent', 'partial', 'received', 'cancelled']
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque', 'credit']

module.exports = { QUEUE_NAMES, EVENTS, SALE_STATUSES, INVOICE_STATUSES, PURCHASE_STATUSES, PAYMENT_METHODS }
