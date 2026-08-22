import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Server
} from 'lucide-react'

export default function ClosingFooter() {
  const navigate = useNavigate()

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MSME BMS</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Business management system built for Kenyan commercial enterprises. Unified POS cashier checkout, multi-warehouse stock management, and automated double-entry accounting.
            </p>
          </div>

          {/* Core Modules Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-sm font-semibold text-white">System Modules</div>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => navigate('/auth/login')} className="text-slate-400 hover:text-white transition-colors">
                  Point of Sale (POS)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/auth/login')} className="text-slate-400 hover:text-white transition-colors">
                  Warehouse & Inventory
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/auth/login')} className="text-slate-400 hover:text-white transition-colors">
                  Double-Entry Accounting
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/auth/login')} className="text-slate-400 hover:text-white transition-colors">
                  HR & Payroll Processing
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Support & Contact */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-sm font-semibold text-white">Headquarters & Support</div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-slate-300">Kisii, Kenya</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-slate-300">+254 104504692</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-slate-300">kevinachae@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright and system details */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} MSME Business Management System. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <span>Production Version 1.0.0</span>
            <span>·</span>
            <span>Relational MySQL 3NF</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
