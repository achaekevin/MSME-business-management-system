import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'James Kamau',
    role: 'Owner',
    business: 'Kamau Hardware Store',
    location: 'Nairobi',
    rating: 5,
    text: 'SSME transformed how we manage our hardware store. Inventory tracking is now effortless, and we can see our profits in real-time. Highly recommend!',
    avatar: '👨🏾‍💼'
  },
  {
    name: 'Grace Wanjiru',
    role: 'Manager',
    business: 'Grace Supermarket',
    location: 'Nakuru',
    rating: 5,
    text: 'Managing multiple branches was a nightmare before SSME. Now I can monitor all locations from my phone. The POS system is incredibly fast!',
    avatar: '👩🏾‍💼'
  },
  {
    name: 'David Ochieng',
    role: 'Pharmacist',
    business: 'MediCare Pharmacy',
    location: 'Kisumu',
    rating: 5,
    text: 'The expiry tracking feature alone has saved us thousands. SSME helps us maintain compliance and serve our customers better.',
    avatar: '👨🏾‍⚕️'
  },
  {
    name: 'Mary Muthoni',
    role: 'Owner',
    business: 'Muthoni Fashion Boutique',
    location: 'Mombasa',
    rating: 5,
    text: 'As a small business owner, I needed something simple yet powerful. SSME is perfect! The support team is amazing too.',
    avatar: '👩🏾'
  },
  {
    name: 'Peter Kipchoge',
    role: 'Operations Manager',
    business: 'Fresh Foods Ltd',
    location: 'Eldoret',
    rating: 5,
    text: 'The accounting module syncs perfectly with our operations. We\'ve reduced errors significantly and our accountant loves the automated reports.',
    avatar: '👨🏾'
  }
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section id="testimonials" className="py-20 bg-white dark:bg-gray-900">
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
            Testimonials
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Real stories from real Kenyan business owners
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <div className="relative bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 md:p-12 shadow-2xl">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Quote className="w-6 h-6 text-white" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="pt-6"
              >
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-xl md:text-2xl text-gray-900 dark:text-white font-medium mb-8 leading-relaxed">
                  "{testimonials[currentIndex].text}"
                </p>

                {/* Author Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-3xl">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {testimonials[currentIndex].role}, {testimonials[currentIndex].business}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {testimonials[currentIndex].location}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={previous}
              className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
            </motion.button>

            {/* Dots */}
            <div className="flex items-center space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`transition-all ${
                    index === currentIndex
                      ? 'w-8 h-2 bg-blue-600'
                      : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  } rounded-full`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={next}
              className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
            </motion.button>
          </div>
        </div>

        {/* All Testimonials Grid - Hidden on Mobile */}
        <div className="hidden lg:grid grid-cols-3 gap-6 mt-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => setCurrentIndex(index)}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 ${
                index === currentIndex
                  ? 'border-blue-500'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center space-x-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                "{testimonial.text}"
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {testimonial.business}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
