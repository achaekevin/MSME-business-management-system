import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  FileLock2 
} from 'lucide-react'

export default function Security() {
  const securityFeatures = [
    {
      icon: ShieldCheck,
      title: 'Granular Role-Based Access Control (RBAC)',
      description: 'Define exact permissions per staff member. Cashiers can only access their assigned POS till, while financial ledgers remain restricted to authorized accountants.'
    },
    {
      icon: Database,
      title: 'Strict Multi-Tenant Isolation',
      description: 'Enterprise data architecture guarantees complete company isolation. Your branches, customer records, and ledger balances are strictly partitioned.'
    },
    {
      icon: FileLock2,
      title: 'Immutable Audit Logging',
      description: 'All system transactions, price overrides, stock write-offs, and till drawer operations generate tamper-proof audit trails with user and timestamp metadata.'
    },
    {
      icon: Lock,
      title: 'Encrypted Data & Secure Authentication',
      description: 'All communication is protected via TLS 1.3 encryption. User sessions are secured with cryptographically signed JSON Web Tokens (JWT) and optional two-factor authentication.'
    }
  ]

  return (
    <section id="security" className="py-24 bg-slate-950 border-t border-slate-800 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            Data Protection
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Your business data stays protected
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal">
            Built with strict commercial security principles to ensure your financial integrity, employee authorizations, and operational records remain secure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {securityFeatures.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition-all flex items-start gap-6"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 mt-1">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
