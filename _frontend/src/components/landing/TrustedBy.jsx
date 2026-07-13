import { motion } from 'framer-motion'

export default function TrustedBy() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Businesses Across Kenya
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join growing businesses managing their operations with SSME
          </p>
        </motion.div>

        {/* Company Logos Placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-3 md:grid-cols-6 gap-8 items-center"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
            >
              <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                Partner {i}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
