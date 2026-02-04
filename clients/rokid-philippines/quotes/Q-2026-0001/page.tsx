'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X, Download, Moon, Sun, Building, Calendar, Clock, User, ChevronRight } from 'lucide-react'

interface QuoteItem {
  id: string
  name: string
  description: string
  quantity: number
  unitPrice: string
}

interface RokidQuotePageProps {
  client: {
    companyName: string
    contactName: string
    email: string
  }
  quote: {
    id: string
    quoteNumber: string
    version: number
    validUntil: string
    total: string
    status: string
    items: QuoteItem[]
  }
  csrfToken?: string
  onAccept?: () => void
  onReject?: () => void
  onDownloadPDF?: () => void
}

// Timeline data
const timeline = [
  { week: 'Week 1', phase: 'Discovery & Planning', description: 'Kickoff meeting, requirements gathering, content collection, sitemap and wireframe approval, design mood board presentation' },
  { week: 'Weeks 2—3', phase: 'Design & Development', description: 'Custom homepage and template design, e-commerce functionality development, payment gateway integration, CMS configuration' },
  { week: 'Week 4', phase: 'Integration & QA', description: 'Product catalog upload and categorization, comprehensive testing (functionality, payment, mobile responsiveness), security testing' },
  { week: 'Week 5', phase: 'Final Review & Launch', description: 'Client feedback implementation, final content review and SEO optimization, training session with documentation delivery, website launch' },
]

// Terms data
const terms = [
  { number: '01', title: 'Project Initiation', description: 'Work commences upon receipt of 50% down payment and all required materials (logo files, brand guidelines, product catalog, content copy, reference websites).' },
  { number: '02', title: 'Scope Management', description: 'This quotation covers the specified deliverables. Additional features, custom integrations, or scope expansions will be quoted separately at ₱1,500/hour or via revised proposal.' },
  { number: '03', title: 'Client Collaboration Requirements', description: 'Timely provision of content, product information, brand assets, and feedback is essential. Delays exceeding 7 business days in client deliverables will extend project timeline accordingly.' },
  { number: '04', title: 'Payment Terms', description: 'Project follows milestone-based payments: 50% upon contract signing, 30% upon design approval, 20% before launch. Late payments beyond 7 days may pause project work.' },
  { number: '05', title: 'Post-Launch Support', description: 'Includes 30-day bug-fix warranty covering technical issues and functionality errors. Does not cover content updates, design changes, or feature additions.' },
  { number: '06', title: 'Third-Party Costs (Not Included)', description: 'Domain registration/renewal, web hosting services, SSL certificates, PayMongo transaction fees, premium plugins/themes, stock photos/videos, and SMS/email API costs are billed separately.' },
  { number: '07', title: 'Intellectual Property', description: 'Upon full payment completion, client receives full ownership of website files, custom code, and design assets. Vite SEO retains the right to showcase project in portfolio.' },
  { number: '08', title: 'Project Cancellation', description: 'Down payment is non-refundable. Mid-project cancellation requires payment for completed milestones based on percentage of work finished.' },
]

// Feature sections data
const featureSections = [
  {
    number: '01',
    title: 'Enterprise-Grade E-Commerce Platform',
    subsections: [
      {
        subtitle: 'Comprehensive E-Commerce Infrastructure',
        features: [
          { title: 'Product Management System', description: 'Multi-level product catalog with unlimited SKU capacity, advanced categorization with nested subcategories, and dynamic product filtering capabilities' },
          { title: 'Inventory Control', description: 'Real-time stock monitoring with automated low-stock alerts, batch inventory updates, and product variant management (size, color, specifications)' },
          { title: 'Shopping Experience', description: 'Intelligent shopping cart with product recommendations, wish list functionality, recently viewed items, and abandoned cart recovery system' },
          { title: 'Checkout Optimization', description: 'Streamlined multi-step checkout process with guest checkout option, address autofill, order summary preview, and multiple shipping method selections' },
          { title: 'Customer Account Portal', description: 'Secure user authentication with order history tracking, saved addresses, payment method storage, and personalized product recommendations' },
          { title: 'Order Management Dashboard', description: 'Complete order lifecycle management including processing, fulfillment tracking, invoice generation, and automated customer notifications' },
        ]
      },
      {
        subtitle: 'Advanced Sales Intelligence & Reporting',
        features: [
          { title: 'Revenue Analytics Dashboard', description: 'Real-time revenue tracking with daily, weekly, monthly, and yearly comparison charts, profit margin analysis, and revenue forecasting tools' },
          { title: 'Product Performance Insights', description: 'Best-seller identification, slow-moving inventory reports, product profitability analysis, and seasonal trend detection' },
          { title: 'Customer Behavior Analytics', description: 'Customer lifetime value calculation, repeat purchase rate tracking, customer segmentation by purchase behavior, and geographic sales distribution' },
        ]
      }
    ]
  },
  {
    number: '02',
    title: 'Premium Website Design & Development',
    subsections: [
      {
        subtitle: 'Design Excellence & User Experience',
        features: [
          { title: 'Custom UI/UX Architecture', description: 'Bespoke design system featuring modern, clean aesthetics specifically tailored for AI technology products with emphasis on innovation and sophistication' },
          { title: 'Responsive Design Framework', description: 'Fully optimized layouts for desktop (1920px+), tablet (768px-1024px), and mobile devices (320px-767px) ensuring pixel-perfect display across all screen sizes' },
          { title: 'Homepage Motion Design', description: 'Professionally crafted animations including smooth scroll effects, fade-in transitions, parallax scrolling, and micro-interactions that enhance user engagement' },
          { title: 'Brand Identity Integration', description: 'Seamless incorporation of Rokid\'s brand colors, typography, imagery style, and messaging tone throughout the entire website experience' },
        ]
      },
      {
        subtitle: 'Conversion Optimization Features',
        features: [
          { title: 'Smart Product Showcasing', description: 'High-impact product galleries with zoom functionality, 360-degree view options, specification comparison tools, and video demonstrations' },
          { title: 'Trust-Building Elements', description: 'Security badges, verified customer reviews display, money-back guarantee highlights, warranty information, and authorized dealer certifications' },
          { title: 'Speed & Performance', description: 'Optimized code structure, compressed images, lazy loading implementation, and CDN integration ensuring sub-3-second page load times' },
        ]
      }
    ]
  },
  {
    number: '03',
    title: 'Live Reviews & Community Engagement',
    subsections: [
      {
        subtitle: 'Comprehensive Review Platform',
        features: [
          { title: 'Multi-Format Review System', description: 'Support for star ratings (1-5 scale), written reviews with unlimited character count, photo/video upload capability, and verified purchase badges' },
          { title: 'User Profile Integration', description: 'Registered user profiles with review history, helpfulness ratings from other users, reviewer badges (Top Reviewer, Early Adopter), and display name options' },
          { title: 'Review Management Tools', description: 'Admin moderation panel with spam filtering, inappropriate content flagging, review approval workflow, and bulk management capabilities' },
          { title: 'Review Analytics', description: 'Aggregate rating calculations, sentiment analysis display, common keyword extraction, and rating distribution graphs visible on product pages' },
        ]
      }
    ]
  },
  {
    number: '04',
    title: 'Professional WordPress CMS',
    subsections: [
      {
        subtitle: 'Enterprise CMS Configuration',
        features: [
          { title: 'Custom WordPress Installation', description: 'Latest WordPress core with optimized configuration, security hardening measures, automated backup scheduling, and staging environment setup' },
          { title: 'Intuitive Content Management', description: 'Drag-and-drop page builder integration (Elementor Pro or WPBakery) enabling visual editing without coding knowledge' },
          { title: 'User Role Management', description: 'Customized access levels (Administrator, Editor, Content Manager, Product Manager) with granular permission controls' },
        ]
      },
      {
        subtitle: 'Comprehensive Training & Documentation',
        features: [
          { title: 'Video Tutorial Library', description: '15+ screen-recorded training videos covering: homepage updates, product management, blog posting, image uploading, menu editing, and basic troubleshooting' },
          { title: 'Written User Manual', description: 'Detailed PDF documentation (40+ pages) with step-by-step instructions, screenshots, best practices, and FAQ section' },
          { title: 'Live Training Session', description: '2-hour virtual training workshop with Rokid\'s team covering all CMS functionalities with Q&A segment' },
        ]
      }
    ]
  },
  {
    number: '05',
    title: 'Secure Payment Integration',
    subsections: [
      {
        subtitle: 'PayMongo Complete Integration',
        features: [
          { title: 'Multiple Payment Methods', description: 'QR Ph & GCash (instant QR code generation with real-time confirmation), Credit/Debit Cards (Visa, Mastercard, JCB with 3D Secure authentication), and Bank Transfers' },
          { title: 'Transaction Security', description: 'PCI-DSS compliance with industry-standard security protocols, customer payment data never stored on your server, all transactions processed through encrypted PayMongo gateway' },
          { title: 'Fraud Detection', description: 'Automatic risk assessment on transactions, IP geolocation verification, and suspicious activity alerts' },
          { title: 'Automated Processes', description: 'Instant order confirmation upon successful payment, automatic invoice generation, failed payment retry logic, and abandoned cart recovery with payment links' },
        ]
      }
    ]
  },
  {
    number: '06',
    title: 'Social Media & Real-Time Support',
    subsections: [
      {
        subtitle: 'Facebook Messenger Live Chat Integration',
        features: [
          { title: 'Seamless Inquiry Routing', description: 'Custom-designed chat widget embedded on all website pages, automatically connecting visitors to Rokid\'s official Facebook Messenger' },
          { title: 'Conversation Management', description: 'All customer inquiries consolidated in Facebook Messenger dashboard for centralized support team management' },
        ]
      },
      {
        subtitle: 'Dynamic Social Media Content Display',
        features: [
          { title: 'Automatic Facebook Feed Integration', description: 'Real-time fetching and display of Rokid Philippines\' latest Facebook posts directly on website with hourly synchronization' },
          { title: 'Visual Content Showcase', description: 'Product launches, customer stories, promotional announcements, and event coverage automatically published on website' },
        ]
      }
    ]
  },
  {
    number: '07',
    title: 'SEO & Performance Optimization',
    subsections: [
      {
        subtitle: 'Technical SEO Implementation',
        features: [
          { title: 'Search Engine Optimization Structure', description: 'Clean URL structure, comprehensive XML sitemap generation with automatic updates, robots.txt configuration for optimal crawling, Schema markup integration' },
          { title: 'On-Page SEO Setup', description: 'Customizable meta titles and descriptions (60/160 character optimization), heading tag hierarchy (H1, H2, H3) properly structured, image alt text fields for all media' },
        ]
      },
      {
        subtitle: 'Performance Optimization',
        features: [
          { title: 'Speed Enhancement Techniques', description: 'Image compression and WebP format conversion (up to 70% size reduction), CSS and JavaScript minification, browser caching configuration (1-year cache), lazy loading for images' },
          { title: 'Core Web Vitals Optimization', description: 'Target LCP under 2.5 seconds, FID under 100 milliseconds, CLS under 0.1, mobile-first responsive design ensuring 90+ mobile performance score' },
          { title: 'Analytics Framework', description: 'Google Analytics 4 (GA4) tracking code structure ready for activation, e-commerce event tracking setup, conversion goal tracking framework for lead generation' },
        ]
      }
    ]
  },
]

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function RokidQuotePage({
  client,
  quote,
  csrfToken,
  onAccept,
  onReject,
  onDownloadPDF,
}: RokidQuotePageProps) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isAnimated, setIsAnimated] = useState(false)
  const [quoteStatus, setQuoteStatus] = useState(quote.status)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('rokid-quote-theme')
    if (savedTheme === 'light') {
      setIsDarkMode(false)
    }

    // Setup intersection observer for animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    // Observe all animatable elements
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observerRef.current?.observe(el)
    })

    setIsAnimated(true)

    return () => observerRef.current?.disconnect()
  }, [])

  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('rokid-quote-theme', newMode ? 'dark' : 'light')
  }

  const handleAccept = () => {
    if (confirm('Are you sure you want to accept this quotation?')) {
      setQuoteStatus('accepted')
      onAccept?.()
    }
  }

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this quotation?')) {
      setQuoteStatus('rejected')
      onReject?.()
    }
  }

  const canTakeAction = quoteStatus === 'viewed' || quoteStatus === 'sent'
  const isExpired = new Date(quote.validUntil) < new Date()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Theme Toggle */}
      <div className="flex justify-end p-5 md:p-6">
        <button
          onClick={toggleTheme}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg ${
            isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Document Container */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20 pb-12">
        {/* Header */}
        <header className={`border-b-[3px] pb-5 mb-8 ${isDarkMode ? 'border-white' : 'border-black'} ${isAnimated ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-bold mb-2 tracking-tight">VITE SEO DIGITAL ADVERTISING OPC</h2>
              <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Burgundy Corporate Tower<br />
                252 Sen. Gil Puyat Avenue<br />
                Makati, 1200 Metro Manila<br />
                Phone: (02) 5310 5820
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-3 text-xs">
                <span className={`w-20 font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Date</span>
                <span className="font-semibold">16 January 2026</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className={`w-20 font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Project</span>
                <span className="font-semibold">{client.companyName}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className={`w-20 font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Duration</span>
                <span className="font-semibold">1 to 2 months</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className={`w-20 font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Attention</span>
                <span className="font-semibold">{client.contactName}</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
            Website Development Quotation
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Phase 1 — Professional Proposal
          </p>

          {/* Status Badge */}
          {quoteStatus === 'accepted' && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              <Check className="w-4 h-4" /> Accepted
            </div>
          )}
          {quoteStatus === 'rejected' && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              <X className="w-4 h-4" /> Rejected
            </div>
          )}
        </header>

        {/* Feature Sections */}
        {featureSections.map((section, sectionIdx) => (
          <section key={section.number} className="animate-on-scroll opacity-0 translate-y-5 transition-all duration-500">
            {sectionIdx > 0 && <div className={`h-px my-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />}
            
            <div className={`flex items-baseline gap-4 mb-3 pb-2 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}>
              <span className="text-3xl font-light">{section.number}</span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">{section.title}</h2>
            </div>

            {section.subsections.map((subsection, subIdx) => (
              <div key={subIdx} className="mb-4">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mt-4 mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {subsection.subtitle}
                </h3>
                <div className="space-y-2">
                  {subsection.features.map((feature, featIdx) => (
                    <div
                      key={featIdx}
                      className={`border-l-[3px] pl-3 py-2 transition-transform duration-200 hover:translate-x-1 ${isDarkMode ? 'border-white' : 'border-black'}`}
                    >
                      <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}

        {/* Timeline */}
        <section className="animate-on-scroll opacity-0 translate-y-5 transition-all duration-500">
          <div className={`h-px my-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          
          <div className={`flex items-baseline gap-4 mb-3 pb-2 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}>
            <span className="text-3xl font-light">—</span>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Project Timeline & Milestones</h2>
          </div>

          <div className="mt-4 space-y-3">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className={`grid md:grid-cols-[100px_180px_1fr] gap-4 py-3 border-b transition-all duration-200 hover:pl-2 ${
                  isDarkMode ? 'border-gray-800 hover:bg-white/[0.02]' : 'border-gray-200 hover:bg-black/[0.02]'
                } ${idx === timeline.length - 1 ? 'border-b-0' : ''}`}
              >
                <span className="font-semibold text-sm">{item.week}</span>
                <span className="font-semibold text-base">{item.phase}</span>
                <span className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.description}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Investment Section */}
        <section className={`my-8 p-8 animate-on-scroll opacity-0 scale-95 transition-all duration-500 ${isDarkMode ? 'bg-zinc-900' : 'bg-black text-white'}`}>
          <div className="text-center mb-8">
            <p className="text-[10px] uppercase tracking-[3px] text-gray-400 mb-2">Total Project Investment</p>
            <p className="text-5xl md:text-6xl font-bold tracking-tight">{formatCurrency(quote.total)}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { percent: '50%', label: 'Down Payment\nUpon Acceptance', amount: '₱40,000' },
              { percent: '30%', label: 'Progress Payment\nDesign Approval', amount: '₱24,000' },
              { percent: '20%', label: 'Final Payment\nBefore Launch', amount: '₱16,000' },
            ].map((payment, idx) => (
              <div
                key={idx}
                className="border border-gray-700 p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-gray-500"
              >
                <p className="text-3xl font-bold mb-2">{payment.percent}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 whitespace-pre-line leading-relaxed">
                  {payment.label}
                </p>
                <p className="text-xl font-semibold">{payment.amount}</p>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-xs text-gray-500 italic">
            Quotation valid until {formatDate(quote.validUntil)}
          </p>
        </section>

        {/* Terms & Conditions */}
        <section className="animate-on-scroll opacity-0 translate-y-5 transition-all duration-500">
          <div className={`h-px my-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          
          <div className={`flex items-baseline gap-4 mb-3 pb-2 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}>
            <span className="text-3xl font-light">—</span>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Terms & Conditions</h2>
          </div>

          <div className="space-y-3 mt-4">
            {terms.map((term) => (
              <div key={term.number} className="grid grid-cols-[32px_1fr] gap-3">
                <div className={`w-6 h-6 flex items-center justify-center text-xs font-semibold ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  {term.number}
                </div>
                <div className="pt-0.5">
                  <h4 className="font-semibold text-sm mb-1">{term.title}</h4>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {term.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        {canTakeAction && !isExpired && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-on-scroll opacity-0 translate-y-5 transition-all duration-500">
            <button
              onClick={handleReject}
              className="px-8 py-3 border border-red-500/50 text-red-400 rounded-full hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
            >
              Reject Quotation
            </button>
            <button
              onClick={handleAccept}
              className="px-8 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-200 text-sm font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Accept Quotation
            </button>
          </div>
        )}

        {/* Download PDF Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onDownloadPDF}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
              isDarkMode
                ? 'border border-white/20 hover:bg-white/10'
                : 'border border-black/20 hover:bg-black/5'
            }`}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        {/* Status Messages */}
        {quoteStatus === 'accepted' && (
          <div className="mt-8 p-6 rounded-lg border border-green-500/30 bg-green-500/10 text-center animate-on-scroll">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Quotation Accepted</h3>
            <p className="text-green-200/80 text-sm max-w-md mx-auto">
              Thank you for accepting this quotation. We have been notified and will be in touch shortly to proceed with the next steps.
            </p>
          </div>
        )}

        {quoteStatus === 'rejected' && (
          <div className="mt-8 p-6 rounded-lg border border-red-500/30 bg-red-500/10 text-center animate-on-scroll">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Quotation Rejected</h3>
            <p className="text-red-200/80 text-sm max-w-md mx-auto">
              You have rejected this quotation. If you would like to discuss alternatives or have any questions, please don't hesitate to contact us.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className={`mt-8 p-6 text-center ${isDarkMode ? 'bg-zinc-900' : 'bg-black text-white'}`}>
          <h3 className="text-sm font-semibold uppercase tracking-[3px] mb-4">For Questions or to Proceed</h3>
          <div className="text-sm leading-relaxed text-gray-400">
            <strong className="text-white">VITE SEO DIGITAL ADVERTISING OPC</strong><br />
            Burgundy Corporate Tower, 252 Sen. Gil Puyat Avenue<br />
            Makati, 1200 Metro Manila<br />
            Phone: (02) 5310 5820
          </div>
          <p className="mt-4 text-[11px] text-gray-500 italic leading-relaxed">
            This quotation provides comprehensive detail on deliverables while maintaining professional clarity.
            All specifications are designed to set clear expectations and demonstrate the value of the investment.
          </p>
        </footer>

        {/* Bottom Credit */}
        <div className="mt-8 text-center">
          <p className={`text-[10px] uppercase tracking-[3px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Vite SEO Digital Advertising OPC • Secure Client Portal
          </p>
        </div>
      </div>

      <style jsx>{`
        .animate-on-scroll.animate-in {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
