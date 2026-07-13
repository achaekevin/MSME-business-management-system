import { lazy, Suspense } from 'react'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// Lazy load sections for better performance
const TrustedBy = lazy(() => import('../components/landing/TrustedBy'))
const Features = lazy(() => import('../components/landing/Features'))
const DashboardShowcase = lazy(() => import('../components/landing/DashboardShowcase'))
const Solutions = lazy(() => import('../components/landing/Solutions'))
const WhyChoose = lazy(() => import('../components/landing/WhyChoose'))
const Statistics = lazy(() => import('../components/landing/Statistics'))
const Workflow = lazy(() => import('../components/landing/Workflow'))
const Testimonials = lazy(() => import('../components/landing/Testimonials'))
const Pricing = lazy(() => import('../components/landing/Pricing'))
const FAQ = lazy(() => import('../components/landing/FAQ'))
const CTA = lazy(() => import('../components/landing/CTA'))
const Contact = lazy(() => import('../components/landing/Contact'))
const Footer = lazy(() => import('../components/landing/Footer'))

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>SSME Business Management System | Run Your Business From One Platform</title>
        <meta
          name="description"
          content="Complete business management solution for Kenyan SMEs. Manage inventory, sales, accounting, HR, and more from one powerful platform."
        />
        <meta
          name="keywords"
          content="business management system Kenya, SME management software, inventory management, POS system, accounting software Kenya, MSME software"
        />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SSME Business Management System" />
        <meta
          property="og:description"
          content="Complete business management solution for Kenyan SMEs"
        />
        <meta property="og:url" content="https://ssme.co.ke" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SSME Business Management System" />
        <meta
          name="twitter:description"
          content="Complete business management solution for Kenyan SMEs"
        />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'SSME Business Management System',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, Android, iOS',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'KES'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '250'
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <Hero />
        
        <Suspense fallback={<LoadingSpinner />}>
          <TrustedBy />
          <Features />
          <DashboardShowcase />
          <Solutions />
          <WhyChoose />
          <Statistics />
          <Workflow />
          <Testimonials />
          <Pricing />
          <FAQ />
          <CTA />
          <Contact />
          <Footer />
        </Suspense>
      </div>
    </>
  )
}
