import { motion } from 'framer-motion'
import { ShoppingCart, Package, TrendingUp, DollarSign, FileText, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: ShoppingCart,
    title: 'Procurement',
    description: 'Order from suppliers and manage purchases',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Package,
    title: 'Inventory',
    description: 'Track stock across warehouses and branches',
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    icon: TrendingUp,
    title: 'Sales',
    description: 'Sell products via POS or online channels',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: DollarSign,
    title: 'Accounting',
    description: 'Auto-sync financial records and invoices',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: FileText,
    title: 'Reports',
    description: 'Get insights and make data-driven decisions',
    color: 'from-pink-500 to-pink-600'
  }
]

export default function Workflow() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Seamless Business Workflow
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From procurement to reporting, everything flows smoothly
          </p>
        </motion.div>

        {/* Workflow Steps - Desktop */}
        <div className="hidden lg:block relative">
          {/* Connection Line */}
          <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-emerald-200 to-pink-200 dark:from-blue-900 dark:via-emerald-900 dark:to-pink-900" />

          <div className="relative flex justify-between items-start">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
                style={{ width: `${100 / steps.length}%` }}
              >
                {/* Icon Circle */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className={`relative w-32 h-32 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-2xl mb-8 z-10`}
                >
                  <step.icon className="w-14 h-14 text-white" />
                  
                  {/* Pulse Effect */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full`}
                  />
                </motion.div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="absolute top-24 transform -translate-y-1/2"
                    style={{ left: `${(index + 0.5) * (100 / steps.length)}%` }}
                  >
                    <ArrowRight className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </motion.div>
                )}

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Workflow Steps - Mobile */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-6"
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                <step.icon className="w-10 h-10 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl font-bold text-gray-300 dark:text-gray-700">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="absolute left-10 mt-24 ml-10">
                  <ArrowRight className="w-6 h-6 text-gray-400 dark:text-gray-600 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Ready to streamline your business workflow?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Start Free Trial
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
