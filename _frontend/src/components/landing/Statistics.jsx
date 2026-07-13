import { motion } from 'framer-motion'
import { Building2, TrendingUp, Users, Award } from 'lucide-react'

const features = [
  {
    icon: Building2,
    label: 'Multi-Business Support',
    description: 'Manage multiple branches and locations',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    icon: TrendingUp,
    label: 'Real-Time Analytics',
    description: 'Track performance as it happens',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  {
    icon: Users,
    label: 'Team Collaboration',
    description: 'Built for businesses of all sizes',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    icon: Award,
    label: 'Reliable & Secure',
    description: 'Always available when you need it',
    gradient: 'from-orange-500 to-orange-600'
  }
]

export default function Statistics() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why Businesses Choose SSME
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Powerful features designed for Kenyan businesses
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="relative group"
            >
              {/* Card */}
              <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                
                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl mb-6 flex items-center justify-center`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Label */}
                  <div className="text-xl font-semibold text-white mb-3">
                    {feature.label}
                  </div>

                  {/* Description */}
                  <p className="text-blue-100 text-sm">
                    {feature.description}
                  </p>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
