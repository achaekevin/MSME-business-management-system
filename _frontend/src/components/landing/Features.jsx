import { motion } from 'framer-motion'
import {
  Package, ShoppingCart, DollarSign, Users, TrendingUp, FileText,
  Bell, BarChart3, Settings, Building2, Shield, Zap
} from 'lucide-react'

const features = [
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels, manage warehouses, and automate reordering with real-time inventory updates.'
  },
  {
    icon: ShoppingCart,
    title: 'Point of Sale (POS)',
    description: 'Fast checkout, receipt printing, multiple payment methods including M-Pesa integration.'
  },
  {
    icon: DollarSign,
    title: 'Accounting & Finance',
    description: 'Complete accounting system with invoicing, expenses, tax management, and financial reports.'
  },
  {
    icon: Users,
    title: 'HR & Payroll',
    description: 'Employee management, attendance tracking, leave management, and automated payroll processing.'
  },
  {
    icon: FileText,
    title: 'Procurement',
    description: 'Manage suppliers, purchase orders, and streamline your procurement process.'
  },
  {
    icon: TrendingUp,
    title: 'CRM',
    description: 'Build customer relationships, track interactions, and manage loyalty programs.'
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Powerful insights with customizable reports and real-time business analytics.'
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Stay informed with automated alerts for low stock, pending approvals, and more.'
  },
  {
    icon: Building2,
    title: 'Multi-Branch Support',
    description: 'Manage multiple locations from one dashboard with centralized control.'
  },
  {
    icon: Shield,
    title: 'Security & Compliance',
    description: 'Bank-level security with role-based access control and audit trails.'
  },
  {
    icon: Settings,
    title: 'Customizable',
    description: 'Adapt the system to your business needs with flexible configuration options.'
  },
  {
    icon: Zap,
    title: 'Fast & Reliable',
    description: 'Cloud-based infrastructure ensures 99.9% uptime and lightning-fast performance.'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Features
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Run Your Business
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful features designed specifically for Kenyan MSMEs
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                {/* Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 0 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="mt-4 text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-2"
                >
                  <span>Learn more</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
