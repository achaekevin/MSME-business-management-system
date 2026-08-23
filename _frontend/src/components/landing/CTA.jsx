import { motion } from 'framer-motion'
import { ArrowRight, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function CTA() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            <span>Ready to transform your business?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight max-w-3xl mx-auto mb-6">
            Run your business from one connected platform.
          </h2>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Manage sales, inventory, finance, procurement, and operations from one place. Eliminate till errors and get real-time financial clarity today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/auth/register')}
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base sm:text-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="px-7 py-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-base sm:text-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
