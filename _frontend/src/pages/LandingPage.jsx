import { Helmet } from 'react-helmet-async'
import HeroShowcase from '../components/landing/HeroShowcase'
import ProductShowcase from '../components/landing/ProductShowcase'
import Workflow from '../components/landing/Workflow'
import WhyMSME from '../components/landing/WhyMSME'
import BusinessTypes from '../components/landing/BusinessTypes'
import HowItWorks from '../components/landing/HowItWorks'
import Security from '../components/landing/Security'
import Pricing from '../components/landing/Pricing'
import FAQ from '../components/landing/FAQ'
import ClosingFooter from '../components/landing/ClosingFooter'

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>MSME Business Management System | Unified POS, Inventory & Accounting</title>
        <meta
          name="description"
          content="Unified commercial business management system with real-time POS cashier tills, multi-warehouse inventory, double-entry general ledger, and HR payroll."
        />
        <meta
          name="keywords"
          content="MSME business management system, POS Kenya, inventory management, multi-warehouse, double-entry accounting, payroll PAYE, KRA compliant"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'MSME Business Management System',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Web, Cloud',
            'offers': {
              '@type': 'Offer',
              'price': '2500',
              'priceCurrency': 'KES'
            },
            'description': 'Unified commercial business management system for retail POS, warehouse inventory, double-entry accounting, and payroll.'
          })}
        </script>
      </Helmet>

      {/* Complete Connected Enterprise Landing Page */}
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        {/* 1. Hero Showcase with Product Preview & Core Capabilities */}
        <HeroShowcase />

        {/* 2. Interactive Tabbed Product Showcase */}
        <ProductShowcase />

        {/* 3. Operational Workflow */}
        <Workflow />

        {/* 4. Why MSME BMS Value Highlights */}
        <WhyMSME />

        {/* 5. Supported Business Industries */}
        <BusinessTypes />

        {/* 6. Simple 3-Step Onboarding */}
        <HowItWorks />

        {/* 7. Enterprise Security & Isolation */}
        <Security />

        {/* 8. Commercial Pricing Plans */}
        <Pricing />

        {/* 9. Key Questions FAQ */}
        <FAQ />

        {/* 10. Customer-Facing Footer */}
        <ClosingFooter />
      </main>
    </>
  )
}
