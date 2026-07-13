import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  'Inventory Management',
  'Point of Sale (POS)',
  'Accounting & Finance',
  'HR & Payroll',
  'Multi-Branch Support',
  'Real-time Reports'
]

const floatingIcons = [
  { icon: '📊', delay: 0, x: 20, y: 40 },
  { icon: '💰', delay: 0.2, x: -30, y: 60 },
  { icon: '📦', delay: 0.4, x: 40, y: 20 },
  { icon: '👥', delay: 0.6, x: -20, y: 80 },
  { icon: '📈', delay: 0.8, x: 60, y: 50 }
]

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-emerald-400/20 to-blue-600/20 rounded-full blur-3xl"
        />
      </div>

      {/* Floating Icons */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            y: [item.y, item.y - 20, item.y],
            x: [item.x, item.x + 10, item.x]
          }}
          transition={{
            duration: 4,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute text-4xl hidden lg:block"
          style={{
            right: `${20 + index * 15}%`,
            top: `${30 + index * 10}%`
          }}
        >
          {item.icon}
        </motion.div>
      ))}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6"
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
              <span className="text-sm font-medium">Trusted by Kenyan Businesses</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Run Your Entire Business{' '}
              <span className="text-emerald-400">From One Platform</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-blue-100 mb-8 leading-relaxed"
            >
              Complete business management solution for Kenyan MSMEs. Streamline operations, boost productivity, and grow your business with our all-in-one platform.
            </motion.p>

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3 mb-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth/register')}
                className="group px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-2xl hover:shadow-white/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/20 hover:bg-white/20 transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 flex items-center space-x-6 text-sm"
            >
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"
                    />
                  ))}
                </div>
                <span className="text-blue-100">Join our growing community</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Floating Cards */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [-2, 2, -2]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute -left-10 top-20 z-10"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-64">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Sales</span>
                  <span className="text-emerald-500 text-xs font-semibold">+12.5%</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  KES 234,500
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 2, delay: 1 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">75%</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{
                y: [0, 20, 0],
                rotate: [2, -2, 2]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5
              }}
              className="absolute -right-10 bottom-20 z-10"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-56">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Products</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">1,234</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">In Stock</span>
                    <span className="font-semibold text-gray-900 dark:text-white">987</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Low Stock</span>
                    <span className="font-semibold text-orange-500">45</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Dashboard Image Placeholder */}
            <motion.div
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/20 p-8 shadow-2xl"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg" />
                    <div>
                      <div className="h-3 w-24 bg-white/40 rounded" />
                      <div className="h-2 w-16 bg-white/20 rounded mt-2" />
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-4">
                      <div className="h-2 w-16 bg-white/40 rounded mb-3" />
                      <div className="h-4 w-20 bg-white/60 rounded" />
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="bg-white/10 rounded-xl p-4 h-40 flex items-end justify-between space-x-2">
                  {[40, 70, 45, 80, 60, 90, 55].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 1, delay: 1 + i * 0.1 }}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
