import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Pricing() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Starter',
      subtitle: 'For small shops & single retailers',
      price: '2,500',
      period: 'month',
      features: [
        '1 Branch / Store Location',
        'Single Cashier POS Till Terminal',
        'Multi-product Inventory & Barcodes',
        'Tax Invoicing & Customer Receipts',
        'Daily Sales & Cash Drawer Reports',
        'Standard Email Support'
      ],
      popular: false,
      cta: 'Get Started',
      route: '/auth/register'
    },
    {
      name: 'Business',
      subtitle: 'For growing retail & wholesale businesses',
      price: '5,500',
      period: 'month',
      features: [
        'Up to 3 Branches / Warehouses',
        'Multi-Till POS with Split Payments (M-Pesa)',
        'Full Double-Entry General Ledger (GL)',
        'Procurement, POs, & Goods Received Notes',
        'HR & Statutory Payroll (PAYE/NSSF/NHIF)',
        'Inter-Branch Stock Transfer Requisitions',
        'Priority Phone & WhatsApp Support'
      ],
      popular: true,
      cta: 'Get Started',
      route: '/auth/register'
    },
    {
      name: 'Enterprise',
      subtitle: 'For large commercial chains & distributors',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited Branches & Warehouses',
        'Unlimited POS Till Terminals & Users',
        'Custom Chart of Accounts & GL Integrations',
        'Multi-Company Consolidated Reporting',
        'Dedicated Technical Account Manager',
        'Custom Data Migration & Staff On-site Training',
        '24/7 SLA Priority Guarantee'
      ],
      popular: false,
      cta: 'Contact Sales',
      route: '/auth/register'
    }
  ]

  return (
    <section id="pricing" className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            Transparent Plans
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Predictable plans for every stage of growth
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal">
            Choose the plan that fits your business. All plans include a 14-day full-access trial with no credit card required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 sm:p-9 flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'bg-slate-900 border-2 border-blue-600 shadow-xl shadow-blue-600/15'
                  : 'bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1 bg-blue-600 text-white rounded-full text-xs sm:text-sm font-semibold shadow-md">
                    <Sparkles className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-1.5">{plan.name}</h3>
                  <p className="text-sm text-slate-300 font-normal">{plan.subtitle}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1.5">
                  {plan.price !== 'Custom' && (
                    <span className="text-sm font-mono font-semibold text-slate-400">KES</span>
                  )}
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-slate-300 font-medium">/{plan.period}</span>
                  )}
                </div>

                <div className="space-y-3.5 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate(plan.route)}
                className={`w-full py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 text-center text-sm text-slate-400">
          Need a multi-entity or custom corporate deployment?{' '}
          <button 
            onClick={() => navigate('/auth/register')}
            className="text-blue-400 hover:underline font-semibold"
          >
            Speak with our commercial deployment team
          </button>
        </div>
      </div>
    </section>
  )
}
