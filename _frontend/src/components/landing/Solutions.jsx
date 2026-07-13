import { motion } from 'framer-motion'
import { Store, ShoppingBag, Briefcase, Utensils, Hotel, Truck, Factory, Stethoscope, Sprout } from 'lucide-react'

const industries = [
  {
    icon: Store,
    name: 'Retail Shops',
    description: 'Perfect for small to medium retail stores with inventory, POS, and customer management',
    features: ['Inventory tracking', 'Quick checkout', 'Customer loyalty']
  },
  {
    icon: ShoppingBag,
    name: 'Supermarkets',
    description: 'Comprehensive solution for supermarkets with multi-category inventory management',
    features: ['Barcode scanning', 'Multi-location', 'Supplier management']
  },
  {
    icon: Briefcase,
    name: 'Hardware Stores',
    description: 'Manage construction materials, tools, and bulk orders efficiently',
    features: ['Bulk pricing', 'Unit conversion', 'Project tracking']
  },
  {
    icon: Stethoscope,
    name: 'Pharmacies',
    description: 'Specialized for medical supplies with expiry tracking and compliance',
    features: ['Expiry alerts', 'Batch tracking', 'Prescription management']
  },
  {
    icon: Utensils,
    name: 'Restaurants',
    description: 'Complete restaurant management with kitchen orders and table management',
    features: ['Table management', 'Kitchen display', 'Recipe costing']
  },
  {
    icon: Hotel,
    name: 'Hotels & Lodging',
    description: 'Room management, bookings, and guest services in one platform',
    features: ['Room booking', 'Guest management', 'Housekeeping']
  },
  {
    icon: Truck,
    name: 'Wholesalers',
    description: 'Bulk order management with distributor and agent tracking',
    features: ['Bulk orders', 'Agent tracking', 'Credit management']
  },
  {
    icon: Factory,
    name: 'Manufacturers',
    description: 'Production planning, raw materials, and finished goods management',
    features: ['Production planning', 'BOM management', 'Quality control']
  },
  {
    icon: Sprout,
    name: 'Agribusiness',
    description: 'Farm management, crop tracking, and agricultural product sales',
    features: ['Crop tracking', 'Harvest planning', 'Market linkage']
  }
]

export default function Solutions() {
  return (
    <section id="solutions" className="py-20 bg-gray-50 dark:bg-gray-800/50">
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
            Industries We Serve
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Built for Every Type of Business
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Tailored solutions for diverse Kenyan business sectors
          </p>
        </motion.div>

        {/* Industries Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <industry.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {industry.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {industry.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                {industry.features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
