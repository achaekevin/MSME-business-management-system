import { motion } from 'framer-motion'
import { 
  Layers, 
  Eye, 
  RefreshCcw, 
  ShieldCheck, 
  FileCheck2, 
  History 
} from 'lucide-react'

export default function WhyMSME() {
  const points = [
    {
      icon: Layers,
      title: 'Centralized Business Operations',
      description: 'Replace fragmented spreadsheets and disconnected standalone POS apps with a single, synchronized platform for your entire company.'
    },
    {
      icon: Eye,
      title: 'Real-Time Multi-Warehouse Visibility',
      description: 'Know exactly what is in stock at each branch, warehouse bin, or in-transit delivery without waiting for end-of-month manual stock counts.'
    },
    {
      icon: RefreshCcw,
      title: 'Zero Manual Reconciliation',
      description: 'Till sales automatically balance with bank and M-Pesa receipts, posting balanced double-entry debits and credits into your general ledger.'
    },
    {
      icon: ShieldCheck,
      title: 'Strict Role-Based Permissions',
      description: 'Control what each staff member can view or modify. Restrict cashiers to POS till checkout and accountants to ledger journals.'
    },
    {
      icon: FileCheck2,
      title: 'KRA-Compliant Tax & Invoicing',
      description: 'Issue standard commercial tax invoices with 16% VAT breakdown, withholding tax classifications, and automated trial balances.'
    },
    {
      icon: History,
      title: 'Comprehensive Anti-Fraud Audit Trails',
      description: 'Every invoice cancellation, price adjustment, cash drawer opening, and stock transfer is permanently recorded with staff timestamps.'
    }
  ]

  return (
    <section id="why-us" className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            Enterprise Value
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Built to simplify business operations
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal">
            Engineered specifically to solve inventory shrinkages, cash discrepancies, and accounting bottlenecks facing growing commercial businesses.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {points.map((point, index) => {
            const Icon = point.icon
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-5 group-hover:scale-105 transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2.5">
                  {point.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {point.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
