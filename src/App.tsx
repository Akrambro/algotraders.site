import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { FeaturesSection } from './components/FeaturesSection.tsx';
import { HowItWorksSection } from './components/HowItWorksSection.tsx';
import { ScreenshotsSection } from './components/ScreenshotsSection.tsx';
import { PricingSection } from './components/PricingSection.tsx';
import { RiskDisclosureSection } from './components/RiskDisclosureSection.tsx';
import { FaqSection } from './components/FaqSection.tsx';
import { Footer } from './components/Footer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LegalModals } from './components/LegalModals.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { DocsView } from './components/DocsView.tsx';
import { CustomerFeedbackTicker } from './components/CustomerFeedbackTicker.tsx';
import { SEOKeywordsGuide } from './components/SEOKeywordsGuide.tsx';
import { SEOHead } from './components/SEOHead.tsx';

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin' | 'docs'>('landing');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | 'risk' | null>(null);

  // Scroll to top immediately whenever page/view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentView]);

  // Sync hash routing if present (e.g. #dashboard, #admin)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'dashboard') setCurrentView('dashboard');
      else if (hash === 'admin') setCurrentView('admin');
      else if (hash === 'docs') setCurrentView('docs');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handlePlanSelected = (planId: string) => {
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Dynamic SEO Tags per active View */}
      {currentView === 'landing' && (
        <SEOHead
          title="Algo Trders.site – Quotex Trading Bot & Binary Options Algorithms"
          description="Institutional-grade Quotex trading bot and binary options algorithmic execution software for Windows PC with real-time Android mobile companion app."
          keywords={[
            'quotex trading bot',
            'quotex algo bot',
            'binary options bot',
            'automated quotex trading',
            'quotex auto trade bot',
            'quotex trading bot download apk',
            'quotex bot for windows 11',
            'binary options automated trading software',
            'quotex 1 minute candlestick strategy bot',
            'quotex otc algorithm robot',
            'low latency quotex websocket bot',
            'quotex trading bot india'
          ]}
          canonicalPath="/"
          jsonLd={[
            {
              '@type': 'SoftwareApplication',
              'name': 'Algo Trders QBot2 Quotex Trading Bot',
              'operatingSystem': 'Windows 10, Windows 11, Android 8.0+',
              'applicationCategory': 'FinanceApplication',
              'softwareVersion': '2.4.1',
              'description':
                'Automated Quotex trading bot and algorithmic execution software for binary options trading with local Windows daemon, real-time OTC signal calculation, and Android mobile companion.',
              'offers': [
                {
                  '@type': 'Offer',
                  'name': 'Monthly Pro License',
                  'price': '4999',
                  'priceCurrency': 'INR',
                  'availability': 'https://schema.org/InStock',
                  'url': 'https://algotraders.site/#pricing'
                },
                {
                  '@type': 'Offer',
                  'name': 'Annual Pro License',
                  'price': '49999',
                  'priceCurrency': 'INR',
                  'availability': 'https://schema.org/InStock',
                  'url': 'https://algotraders.site/#pricing'
                }
              ],
              'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': '4.9',
                'reviewCount': '148',
                'bestRating': '5',
                'worstRating': '1'
              }
            },
            {
              '@type': 'Organization',
              'name': 'Algo Trders.site',
              'url': 'https://algotraders.site',
              'logo': 'https://algotraders.site/favicon.svg',
              'email': 'algotraders.site@zohomail.in'
            },
            {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                {
                  '@type': 'ListItem',
                  'position': 1,
                  'name': 'Home',
                  'item': 'https://algotraders.site'
                },
                {
                  '@type': 'ListItem',
                  'position': 2,
                  'name': 'Features',
                  'item': 'https://algotraders.site/#features'
                },
                {
                  '@type': 'ListItem',
                  'position': 3,
                  'name': 'Pricing',
                  'item': 'https://algotraders.site/#pricing'
                }
              ]
            }
          ]}
        />
      )}

      {currentView === 'dashboard' && (
        <SEOHead
          title="Customer Dashboard – License & Device Pairing Hub | Algo Trders.site"
          description="Manage your QBot2 Quotex bot subscription, view real-time binary options telemetry, pair hardware devices, and download the latest Windows & Android releases."
          keywords={[
            'quotex customer dashboard',
            'qbot2 device pairing',
            'quotex bot license status',
            'windows pc algo daemon',
            'android companion pairing'
          ]}
          canonicalPath="/#dashboard"
        />
      )}

      {currentView === 'docs' && (
        <SEOHead
          title="Technical Documentation & API Integration | Algo Trders.site"
          description="Complete technical specifications, local FastAPI port 8000 daemon setup, hardware fingerprint licensing, and WebSocket integration guide for QBot2 Quotex Bot."
          keywords={[
            'quotex trading bot documentation',
            'fastapi trading bot port 8000',
            'quotex websocket api',
            'hardware fingerprint license validation',
            'binary options algo documentation'
          ]}
          canonicalPath="/#docs"
          jsonLd={{
            '@type': 'TechArticle',
            'headline': 'QBot2 Quotex Trading Bot Architecture & Integration Guide',
            'description':
              'Technical blueprints and local daemon specifications for running QBot2 Quotex algorithmic bot on Windows with Android companion pairing.',
            'author': {
              '@type': 'Organization',
              'name': 'Algo Trders.site'
            }
          }}
        />
      )}

      {currentView === 'admin' && (
        <SEOHead
          title="Admin Control Portal | Algo Trders.site"
          description="Administrative portal for Algo Trders Quotex trading bots, user licensing management, manual payment verification, and server telemetry."
          keywords={['algo traders admin', 'quotex bot licensing management']}
          canonicalPath="/#admin"
        />
      )}

      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openAuthModal={openAuth}
        openLegalModal={(t) => setLegalModalType(t)}
      />

      {/* Main Content Areas */}
      <main className="flex-grow">
        {currentView === 'landing' && (
          <>
            <HeroSection
              onStartTrial={() => {
                if (user) {
                  setCurrentView('dashboard');
                } else {
                  openAuth('signup');
                }
              }}
              onSeeHowItWorks={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenDashboard={() => setCurrentView('dashboard')}
            />

            {/* Live Customer Feedback Marquee Strip */}
            <CustomerFeedbackTicker />

            <FeaturesSection />

            <HowItWorksSection
              onGetStarted={() => {
                if (user) {
                  setCurrentView('dashboard');
                } else {
                  openAuth('signup');
                }
              }}
            />

            <ScreenshotsSection />

            <SEOKeywordsGuide />

            <PricingSection
              onSelectPlan={handlePlanSelected}
              openAuthModal={openAuth}
            />

            <RiskDisclosureSection
              onOpenFullDisclosure={() => setLegalModalType('risk')}
            />

            <FaqSection />
          </>
        )}

        {currentView === 'dashboard' && (
          <CustomerDashboard
            onGoToPricing={() => {
              setCurrentView('landing');
              setTimeout(() => {
                const el = document.getElementById('pricing');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            onOpenDocs={() => setCurrentView('docs')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            onExitAdmin={() => {
              setCurrentView('landing');
              window.location.hash = '';
            }}
          />
        )}

        {currentView === 'docs' && <DocsView />}
      </main>

      {/* Footer */}
      <Footer
        openLegalModal={(t) => setLegalModalType(t)}
        openAuthModal={openAuth}
        setCurrentView={setCurrentView}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setCurrentView('dashboard');
        }}
      />

      <LegalModals
        activeModal={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
