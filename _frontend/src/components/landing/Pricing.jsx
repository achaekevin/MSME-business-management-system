import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '2,500',
    period: 'month',
    description: 'Perfect for small businesses just starting out',
    features: [
      'Up to 2 users',
      '1 branch/location',
      'Basic inventory management',
      'POS system',
      'Basic reports',
      'Email support',
      '5GB storage'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    price: '5,500',
    period: 'month',
    description: 'Most popular for growing businesses',
    features: [
      'Up to 10 users',
      '3 branches/locations',
      'Advanced inventory',
      'Multi-branch POS',
      'Accounting & Finance',
      'HR & Payroll',
      'Advanced reports',
      'Priority support',
      '50GB storage',
      'API access'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large businesses with specific needs',
    features: [
      'Unlimited users',
      'Unlimited branches',
      'All Professional features',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom training',
      'Unlimited storage',
      'SLA guarantee',
      'White-label option'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800/50">
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
            className="inline-block px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-semibold mb-4"
          >
            Pricing
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include 14-day free trial.
          </p>
          
          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className="text-gray-600 dark:text-gray-400">Monthly</span>
            <button className="relative w-14 h-7 bg-blue-600 rounded-full p-1 transition-colors">
              <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-7 transition-transform" />
            </button>
            <span className="text-gray-900 dark:text-white font-semibold">
              Annual
              <span className="ml-2 text-sm text-emerald-600 dark:text-emerald-400">
                Save 20%
              </span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl transition-all duration-300 ${
                plan.popular
                  ? 'ring-2 ring-blue-600 dark:ring-blue-500'
                  : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-1 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm font-semibold shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {plan.description}
                </p>
                
                {/* Price */}
                <div className="flex items-baseline justify-center">
                  {plan.price !== 'Custom' && (
                    <span className="text-gray-500 dark:text-gray-400 text-lg mr-1">
                      KES
                    </span>
                  )}
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      /{plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-4 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 dark:text-gray-400">
            All plans include 14-day free trial. No credit card required.
            <br />
            Need help choosing? <button className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Contact our sales team</button>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
