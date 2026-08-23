import { motion } from 'framer-motion'
import { Building2, Sliders, LineChart } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Building2,
      title: 'Create your business',
      description: 'Register your company account, specify operating currency, and define your primary branch and warehouse locations in under two minutes.'
    },
    {
      number: '02',
      icon: Sliders,
      title: 'Configure your operations',
      description: 'Upload your product catalogue with barcodes, configure your cashier till drawers, and assign custom role permissions for your team.'
    },
    {
      number: '03',
      icon: LineChart,
      title: 'Manage your business',
      description: 'Start ringing up POS transactions, transfer stock between warehouse bins, and watch balanced general ledger reports generate automatically.'
    }
  ]

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            Simple Onboarding
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Get started in three steps
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal">
            Get your store up and running with enterprise-grade controls without weeks of complicated implementation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="font-mono text-3xl font-bold text-slate-700">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
