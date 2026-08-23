import { motion } from 'framer-motion'
import { 
  Store, 
  Truck, 
  Hammer, 
  Pill, 
  Cpu, 
  Briefcase 
} from 'lucide-react'

export default function BusinessTypes() {
  const industries = [
    {
      icon: Store,
      title: 'Retail & Supermarkets',
      description: 'High-speed checkout with barcode scanners, multi-lane cashier tills, and instant M-Pesa split payments.'
    },
    {
      icon: Truck,
      title: 'Wholesale & Distribution',
      description: 'Bulk tier pricing, carton-to-piece unit conversions, customer credit limits, and delivery dispatch tracking.'
    },
    {
      icon: Hammer,
      title: 'Hardware & Building Materials',
      description: 'Multi-warehouse bin tracking, contractor quotation conversions, and heavy goods stock movement verification.'
    },
    {
      icon: Pill,
      title: 'Pharmacies & Chemists',
      description: 'Batch number logging, expiry date thresholds, prescription record receipts, and regulatory compliance.'
    },
    {
      icon: Cpu,
      title: 'Electronics & Auto Spares',
      description: 'Serial number tracking, supplier warranty logging, and rapid SKU searches across hundreds of product variants.'
    },
    {
      icon: Briefcase,
      title: 'Commercial Service Firms',
      description: 'Professional client tax invoicing, milestone billing, contractor expense ledgers, and cash flow statements.'
    }
  ]

  return (
    <section id="solutions" className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            Industry Solutions
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Built for different types of businesses
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal">
            Whether you operate high-frequency retail checkout lanes or complex multi-depot distribution networks, MSME BMS adapts to your trade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {industries.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
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
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {item.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
