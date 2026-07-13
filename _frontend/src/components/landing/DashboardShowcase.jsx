import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Package, ShoppingCart, DollarSign, Users, TrendingUp } from 'lucide-react'

const dashboards = [
  {
    id: 'sales',
    name: 'Sales Dashboard',
    icon: TrendingUp,
    description: 'Track revenue, orders, and sales performance in real-time'
  },
  {
    id: 'inventory',
    name: 'Inventory Dashboard',
    icon: Package,
    description: 'Monitor stock levels, product movements, and warehouse status'
  },
  {
    id: 'pos',
    name: 'POS Dashboard',
    icon: ShoppingCart,
    description: 'Manage sales transactions, checkout, and customer orders'
  },
  {
    id: 'accounting',
    name: 'Accounting Dashboard',
    icon: DollarSign,
    description: 'Financial overview, P&L, balance sheet, and cash flow'
  },
  {
    id: 'hr',
    name: 'HR Dashboard',
    icon: Users,
    description: 'Employee management, attendance, payroll, and performance'
  },
  {
    id: 'reports',
    name: 'Reports Dashboard',
    icon: BarChart3,
    description: 'Comprehensive business analytics and custom reports'
  }
]

export default function DashboardShowcase() {
  const [activeTab, setActiveTab] = useState('sales')

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
            Powerful Dashboards for Every Department
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get instant insights with beautifully designed, role-specific dashboards
          </p>
        </motion.div>

        {/* Dashboard Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {dashboards.map((dashboard) => (
            <motion.button
              key={dashboard.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(dashboard.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === dashboard.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              <dashboard.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{dashboard.name}</span>
              <span className="sm:hidden">{dashboard.name.split(' ')[0]}</span>
            </motion.button>
          ))}
        </div>

        {/* Dashboard Display */}
        <AnimatePresence mode="wait">
          {dashboards.map(
            (dashboard) =>
              activeTab === dashboard.id && (
                <motion.div
                  key={dashboard.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700"
                >
                  {/* Dashboard Header */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <dashboard.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dashboard.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {dashboard.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Mockup */}
                  <div className="space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 rounded-xl p-4"
                        >
                          <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                          <div className="h-6 w-24 bg-gray-400 dark:bg-gray-500 rounded" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Chart Area */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 rounded-xl p-6 h-64 flex items-end justify-between space-x-2"
                    >
                      {[65, 45, 70, 55, 80, 60, 75, 50, 85, 70, 90, 65].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
                          className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
                        />
                      ))}
                    </motion.div>

                    {/* Data Table */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-3"
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 rounded-xl"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg" />
                            <div className="space-y-2 flex-1">
                              <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
                              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                          </div>
                          <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
