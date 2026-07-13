import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    question: 'Is the system cloud-based?',
    answer: 'Yes, SSME is 100% cloud-based. You can access your business from anywhere with an internet connection. Your data is automatically backed up and secured in the cloud.'
  },
  {
    question: 'Does it support multiple branches?',
    answer: 'Absolutely! SSME is designed for multi-branch businesses. You can manage inventory, sales, and staff across all your locations from one dashboard. Different plans support different numbers of branches.'
  },
  {
    question: 'Can I use it on my mobile phone?',
    answer: 'Yes! SSME works perfectly on mobile browsers. You can manage your business from your smartphone or tablet. We\'re also developing native mobile apps for even better performance.'
  },
  {
    question: 'Does it integrate with M-Pesa?',
    answer: 'Yes, M-Pesa integration is available. Customers can pay via M-Pesa, and payments are automatically recorded in the system. We also support cash, card, and bank transfers.'
  },
  {
    question: 'Can I export reports?',
    answer: 'Yes, all reports can be exported to PDF and Excel formats. You can also schedule automated reports to be sent to your email daily, weekly, or monthly.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Security is our top priority. We use bank-level encryption for all data. Your information is backed up daily, and we have strict access controls. Only you and your authorized staff can access your data.'
  },
  {
    question: 'Can I customize user permissions?',
    answer: 'Yes, SSME has a comprehensive role-based permission system. You can create custom roles and control exactly what each user can see and do in the system.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can explore the system and see if it fits your business needs.'
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'We provide email and WhatsApp support for all plans. Professional and Enterprise plans get priority support. Enterprise customers also get phone support and a dedicated account manager.'
  },
  {
    question: 'Can I migrate my existing data?',
    answer: 'Yes, we offer data migration services. Our team can help you import your existing inventory, customers, and other data from Excel spreadsheets or other systems.'
  }
]

function FAQItem({ faq, index }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white pr-8">
          {faq.question}
        </span>
        <div className="flex-shrink-0">
          {isOpen ? (
            <Minus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Plus className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold mb-4"
          >
            FAQ
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about SSME
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>

        {/* Still Have Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Can't find the answer you're looking for? Our team is here to help.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Contact Support
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
