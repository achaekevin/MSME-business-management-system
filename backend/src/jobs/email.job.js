const nodemailer = require('nodemailer')
const appConfig = require('../config/app')
const logger = require('../config/logger')

const transporter = nodemailer.createTransport({
  host: appConfig.mail.host,
  port: appConfig.mail.port,
  secure: appConfig.mail.port === 465,
  auth: appConfig.mail.user ? { user: appConfig.mail.user, pass: appConfig.mail.pass } : undefined
})

const front = appConfig.frontendUrl

function layout(title, body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:24px}
    .card{background:#fff;border-radius:8px;padding:32px;max-width:520px;margin:0 auto;box-shadow:0 1px 4px rgba(0,0,0,.08)}
    h1{margin:0 0 8px;font-size:22px;color:#111}
    p{color:#374151;line-height:1.6;margin:12px 0}
    .btn{display:inline-block;background:#3b82f6;color:#fff!important;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0}
    .footer{color:#9ca3af;font-size:12px;margin-top:24px;text-align:center}
    .badge{display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 8px;font-size:13px;color:#374151}
  </style></head><body><div class="card">
    <h1>${title}</h1>${body}
    <div class="footer">© ${new Date().getFullYear()} MSME BMS · You're receiving this because you have an account with us.</div>
  </div></body></html>`
}

const templates = {
  'send-welcome-email': ({ name }) => ({
    subject: 'Welcome to MSME BMS! Your 14-day trial has started 🎉',
    html: layout('Welcome aboard, ' + name + '!', `
      <p>Your free trial has started. You have <strong>14 days</strong> to explore every feature.</p>
      <a href="${front}/dashboard" class="btn">Go to your dashboard →</a>
      <p>Need help getting started? Reply to this email and we'll assist you.</p>`)
  }),

  'send-password-reset': ({ name, token }) => ({
    subject: 'Reset your MSME BMS password',
    html: layout('Reset your password', `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${front}/auth/reset-password?token=${token}" class="btn">Reset password →</a>
      <p>If you didn't request this, you can safely ignore this email.</p>`)
  }),

  'send-verification-email': ({ name, token }) => ({
    subject: 'Verify your email address',
    html: layout('Verify your email', `
      <p>Hi ${name}, please verify your email to complete setup.</p>
      <a href="${front}/auth/verify-email?token=${token}" class="btn">Verify email →</a>`)
  }),

  'send-invitation': ({ name, businessName, token }) => ({
    subject: `You've been invited to join ${businessName} on MSME BMS`,
    html: layout(`You're invited to ${businessName}`, `
      <p>Hi ${name},</p>
      <p><strong>${businessName}</strong> has invited you to join their workspace on MSME BMS.</p>
      <a href="${front}/auth/invitation/accept?token=${token}" class="btn">Accept invitation →</a>
      <p>This invitation expires in 7 days.</p>`)
  }),

  'send-invoice': ({ customerName, businessName, invoiceNumber, total, dueDate, pdfUrl }) => ({
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html: layout(`Invoice ${invoiceNumber}`, `
      <p>Dear ${customerName},</p>
      <p>Please find your invoice from <strong>${businessName}</strong> below.</p>
      <p>Amount due: <strong>${total}</strong><br>Due date: <strong>${dueDate}</strong></p>
      ${pdfUrl ? `<a href="${pdfUrl}" class="btn">Download invoice →</a>` : ''}
      <p>Thank you for your business!</p>`)
  }),

  'trial-expiring': ({ name, daysLeft, expiresAt }) => ({
    subject: `⚠️ Your MSME BMS trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html: layout('Your trial is ending soon', `
      <p>Hi ${name},</p>
      <p>Your free trial expires on <strong>${new Date(expiresAt).toLocaleDateString()}</strong> (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left).</p>
      <p>Upgrade now to keep your data, users, and access to all features.</p>
      <a href="${front}/subscriptions" class="btn">Upgrade your plan →</a>`)
  }),

  'subscription-renewed': ({ name, renewedTo }) => ({
    subject: 'Your MSME BMS subscription has been renewed',
    html: layout('Subscription renewed ✅', `
      <p>Hi ${name},</p>
      <p>Your subscription has been automatically renewed. Your next billing date is <strong>${new Date(renewedTo).toLocaleDateString()}</strong>.</p>
      <a href="${front}/subscriptions/billing" class="btn">View billing history →</a>`)
  }),

  'low-stock-alert': ({ productName, currentStock, reorderPoint, businessName }) => ({
    subject: `⚠️ Low stock: ${productName}`,
    html: layout('Low stock alert', `
      <p>A product in <strong>${businessName}</strong> is running low.</p>
      <p>Product: <strong>${productName}</strong><br>
      Current stock: <span class="badge">${currentStock} units</span><br>
      Reorder point: <span class="badge">${reorderPoint} units</span></p>
      <a href="${front}/inventory/stock" class="btn">View inventory →</a>`)
  }),

  'payroll-processed': ({ ownerName, period, employeeCount, totalAmount }) => ({
    subject: `Payroll for ${period} has been processed`,
    html: layout('Payroll processed ✅', `
      <p>Hi ${ownerName},</p>
      <p>Payroll for <strong>${period}</strong> has been successfully processed.</p>
      <p>Employees: <strong>${employeeCount}</strong><br>Total payroll: <strong>${totalAmount}</strong></p>
      <a href="${front}/payroll" class="btn">Review payroll →</a>`)
  })
}

async function processEmailJob(job) {
  const { name, data } = job
  const templateFn = templates[name]

  if (!templateFn) {
    logger.warn(`No email template for job type: "${name}"`)
    return { skipped: true }
  }

  const { subject, html } = templateFn(data)

  if (!appConfig.mail.user) {
    logger.info(`[DEV EMAIL] To: ${data.email} | Subject: ${subject}`)
    return { simulated: true }
  }

  const info = await transporter.sendMail({
    from: appConfig.mail.from,
    to: data.email,
    subject,
    html
  })

  logger.info(`Email sent: ${info.messageId}`)
  return { sent: true, messageId: info.messageId }
}

module.exports = processEmailJob
