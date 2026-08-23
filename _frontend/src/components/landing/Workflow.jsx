import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  Package, 
  FileText, 
  CreditCard, 
  BookOpen, 
  BarChart3, 
  ArrowRight 
} from 'lucide-react'

export default function Workflow() {
  const steps = [
    {
      step: '01',
      title: 'POS Checkout',
      subtitle: 'Cashier Terminal',
      description: 'Cashier scans barcodes and captures split payments (M-Pesa / Cash / Card).',
      icon: ShoppingCart
    },
    {
      step: '02',
      title: 'Inventory Sync',
      subtitle: 'Multi-Warehouse',
      description: 'Stock batch is deducted in real time from the assigned branch warehouse bin.',
      icon: Package
    },
    {
      step: '03',
      title: 'Tax Invoicing',
      subtitle: 'KRA Compliant',
      description: 'Serial-tracked commercial invoice is generated with itemized VAT breakdown.',
      icon: FileText
    },
    {
      step: '04',
      title: 'Payment Clearance',
      subtitle: 'Settlement Match',
      description: 'Automated receipting links payment directly to the cashier till session.',
      icon: CreditCard
    },
    {
      step: '05',
      title: 'General Ledger',
      subtitle: 'Double-Entry Post',
      description: 'Debits Cash/Bank and credits Revenue & VAT Liability automatically.',
      icon: BookOpen
    },
    {
      step: '06',
      title: 'Executive Reports',
      subtitle: 'Real-Time Insights',
      description: 'Trial balance, P&L statement, and product gross margin dashboards update live.',
      icon: BarChart3
    }
  ]

  return (
    <section id="workflow" className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            Automated Operations Pipeline
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            From transaction to insight
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal">
            See how everyday front-counter sales automatically sync warehouse inventory, generate tax invoices, and balance general ledger accounts without manual data entry.
          </p>
        </motion.div>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="relative rounded-2xl bg-slate-900 border border-slate-800 p-7 hover:border-slate-700 hover:bg-slate-900/90 transition-all text-left group"
              >
                {/* Step Number Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-sm font-bold px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                    Step {item.step}
                  </span>
                </div>

                <div className="text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider mb-1.5">
                  {item.subtitle}
                </div>
                <h3 className="text-xl font-bold text-white mb-2.5">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {item.description}
                </p>

                {/* Subtle Arrow Indicator for Sequence (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400 shadow-md">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
