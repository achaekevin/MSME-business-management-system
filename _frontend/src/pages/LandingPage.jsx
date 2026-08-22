import { Helmet } from 'react-helmet-async'
import HeroShowcase from '../components/landing/HeroShowcase'
import ClosingFooter from '../components/landing/ClosingFooter'

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>MSME Business Management System | Unified Business OS</title>
        <meta
          name="description"
          content="Unified MSME business management system with real-time POS, multi-warehouse inventory, double-entry accounting, and HR payroll."
        />
        <meta
          name="keywords"
          content="MSME business management system, POS Kenya, inventory management, double-entry accounting, payroll"
        />
      </Helmet>

      {/* 2-Section Streamlined Layout */}
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* 1. Hero Showcase with Interactive Live System Engine */}
        <HeroShowcase />

        {/* 2. Closing Action & System Footer */}
        <ClosingFooter />
      </main>
    </>
  )
}
