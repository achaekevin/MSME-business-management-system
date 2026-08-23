import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

export default function ClosingFooter() {
  const navigate = useNavigate()

  const scrollTo = (id) => {
    const el = document.querySelector(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-slate-800 text-left">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">MSME BMS</span>
            </div>
            <p className="text-sm sm:text-base text-slate-300 max-w-sm leading-relaxed font-normal">
              Unified commercial business operating system. Connect cashier till checkouts, multi-warehouse stock transfers, and automated general ledger accounting in real time.
            </p>
          </div>

          {/* Product Modules */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="text-base font-bold text-white">Product</div>
            <ul className="space-y-2.5 text-sm sm:text-base">
              <li>
                <button onClick={() => scrollTo('#features')} className="text-slate-300 hover:text-white transition-colors">
                  Capabilities
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#showcase')} className="text-slate-300 hover:text-white transition-colors">
                  Live Showcase
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#workflow')} className="text-slate-300 hover:text-white transition-colors">
                  Workflow
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#pricing')} className="text-slate-300 hover:text-white transition-colors">
                  Pricing Plans
                </button>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="text-base font-bold text-white">Solutions</div>
            <ul className="space-y-2.5 text-sm sm:text-base">
              <li>
                <button onClick={() => scrollTo('#solutions')} className="text-slate-300 hover:text-white transition-colors">
                  Retail & Supermarkets
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#solutions')} className="text-slate-300 hover:text-white transition-colors">
                  Wholesale & Distribution
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#solutions')} className="text-slate-300 hover:text-white transition-colors">
                  Hardware & Construction
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#solutions')} className="text-slate-300 hover:text-white transition-colors">
                  Pharmacies & Chemists
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="text-base font-bold text-white">Headquarters & Support</div>
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-slate-200">Kisii, Kenya</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-slate-200">+254 104504692</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-slate-200">kevinachae@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-400">
          <div>
            © {new Date().getFullYear()} MSME Business Management System. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => scrollTo('#security')} className="hover:text-white transition-colors">
              Security & Privacy
            </button>
            <span>·</span>
            <button onClick={() => scrollTo('#faq')} className="hover:text-white transition-colors">
              Help & FAQ
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
