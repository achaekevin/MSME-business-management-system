import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      question: 'What is MSME BMS?',
      answer: 'MSME BMS is a unified business operating system designed for commercial enterprises. It integrates cashier Point of Sale (POS), multi-warehouse inventory tracking, double-entry general ledger accounting, procurement, and statutory payroll into a single synchronized platform.'
    },
    {
      question: 'Who is MSME BMS designed for?',
      answer: 'The system is built for retail shops, wholesale distributors, supermarkets, hardware merchants, pharmacies, electronics outlets, and commercial service enterprises that want to eliminate inventory shrinkage, cash drawer discrepancies, and manual month-end bookkeeping.'
    },
    {
      question: 'Does MSME BMS support multiple branches and warehouses?',
      answer: 'Yes. You can manage multiple retail branch floors, central storage depots, and transit bins from a single administrator dashboard. The platform supports inter-branch stock transfers with sender dispatch and receiver confirmation workflows.'
    },
    {
      question: 'Does it include Point of Sale (POS) and cashier till management?',
      answer: 'Yes. The POS module features barcode scanning, quick item lookup, till drawer shift opening/closing with cash float counting, variance audit reports, and thermal receipt printing.'
    },
    {
      question: 'How does the double-entry accounting system work?',
      answer: 'Every commercial action—such as completing a POS sale, receiving supplier goods, paying expenses, or running employee payroll—automatically creates balanced debit and credit journal entries. This keeps your Trial Balance, Profit & Loss (P&L), and Balance Sheet updated in real time.'
    },
    {
      question: 'Can different employees have different permissions?',
      answer: 'Yes. MSME BMS provides granular Role-Based Access Control (RBAC). For example, cashiers are restricted to ringing up sales at their assigned till, warehouse clerks can only manage inventory movements, and accountants can access financial ledgers.'
    },
    {
      question: 'Can I access the system on mobile devices and tablets?',
      answer: 'Yes. The interface is cloud-based and fully responsive. Managers and cashiers can operate the system on laptops, desktop PCs, iPads, Android tablets, or smartphones.'
    },
    {
      question: 'Does the system support M-Pesa payments?',
      answer: 'Yes. Cashiers can record M-Pesa transactions directly at checkout, split bills across Cash and M-Pesa, and reconcile till totals against bank and mobile money statements.'
    }
  ]

  return (
    <section id="faq" className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-slate-300 font-normal">
            Clear answers about system capabilities, multi-branch setup, and accounting workflows.
          </p>
        </motion.div>

        <div className="space-y-3.5 text-left">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800/60 transition-colors"
                >
                  <span className="font-semibold text-base sm:text-lg text-white pr-4">
                    {faq.question}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                    {isOpen ? <Minus className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-300 leading-relaxed border-t border-slate-800/60 font-normal">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
