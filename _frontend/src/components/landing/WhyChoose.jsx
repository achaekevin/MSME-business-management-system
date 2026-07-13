import { motion } from 'framer-motion'
import { Cloud, Zap, Shield, Globe, Smartphone, HeadphonesIcon } from 'lucide-react'

const reasons = [
  {
    icon: Cloud,
    title: 'Cloud-Based',
    description: 'Access your business from anywhere, anytime. Your data is automatically backed up and secure in the cloud.',
    image: '☁️'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed. Handle thousands of transactions without slowdowns or delays.',
    image: '⚡'
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Your data is encrypted and protected with enterprise-grade security measures and regular backups.',
    image: '🔒'
  },
  {
    icon: Globe,
    title: 'Multi-Branch Ready',
    description: 'Manage multiple locations from one dashboard. Perfect for growing businesses with several branches.',
    image: '🌍'
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Run your business from your phone or tablet. Native mobile apps coming soon.',
    image: '📱'
  },
  {
    icon: HeadphonesIcon,
    title: 'Local Support',
    description: 'Kenyan-based support team available via phone, WhatsApp, and email. We speak your language.',
    image: '🎧'
  }
]

export default function WhyChoose() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose SSME?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Built specifically for Kenyan businesses with local needs in mind
          </p>
        </motion.div>

        {/* Reasons Grid - Alternating Layout */}
        <div className="space-y-24">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } items-center gap-12`}
            >
              {/* Image/Illustration Side */}
              <div className="flex-1">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-3xl blur-3xl opacity-20" />
                  <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-12 flex items-center justify-center">
                    <div className="text-9xl">{reason.image}</div>
                  </div>
                </motion.div>
              </div>

              {/* Content Side */}
              <div className="flex-1 space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <reason.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {reason.title}
                </h3>
                
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {reason.description}
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Easy to set up and use</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">No technical skills required</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Free updates and improvements</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
