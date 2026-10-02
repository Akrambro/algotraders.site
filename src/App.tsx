import React, { useState, useEffect, useCallback } from 'react';
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
import { SEOPage } from './components/SEOPage.tsx';
import { SEO_PAGES, SITE_BRAND, SITE_URL } from './seo/seo-data.ts';

function MainApp() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [currentView, setCurrentView] = useState<'landing' | 'seo-page' | 'dashboard' | 'admin' | 'docs'>('landing');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | 'risk' | null>(null);

  // Sync view based on path and hash
  const syncRoute = useCallback(() => {
    const pathname = window.location.pathname.replace(/\/$/, '') || '/';
    const hash = window.location.hash.replace('#', '');

    setCurrentPath(pathname);

    if (hash === 'admin' || pathname === '/admin') {
      setCurrentView('admin');
    } else if (hash === 'dashboard' || pathname === '/dashboard') {
      setCurrentView('dashboard');
    } else if (hash === 'docs' || pathname === '/docs') {
      setCurrentView('docs');
    } else if (SEO_PAGES[pathname]) {
      setCurrentView('seo-page');
    } else {
      setCurrentView('landing');
    }
  }, []);

  useEffect(() => {
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, [syncRoute]);

  // Scroll to top on view or path change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentView, currentPath]);

  const navigateTo = (path: string) => {
    if (path.startsWith('#')) {
      window.location.hash = path;
      return;
    }
    window.history.pushState({}, '', path);
    syncRoute();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handlePlanSelected = (planId: string) => {
    navigateTo('/dashboard');
  };

  const activeSeoPage = SEO_PAGES[currentPath];

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Landing Page SEO */}
      {currentView === 'landing' && (
        <SEOHead
          title={`${SITE_BRAND} – Quotex Trading Bot & Binary Options Algorithms`}
          description="Institutional-grade Quotex trading bot and binary options algorithmic execution software for Windows PC with real-time Android mobile companion app."
          canonicalPath="/"
          jsonLd={[
            {
              '@type': 'SoftwareApplication',
              'name': `${SITE_BRAND} QBot2 Quotex Trading Bot`,
              'operatingSystem': 'Windows 10, Windows 11, Android 8.0+',
              'applicationCategory': 'FinanceApplication',
              'softwareVersion': '2.5.0',
              'description':
                'Automated Quotex trading bot and algorithmic execution software for binary options trading with local Windows daemon, real-time OTC signal calculation, and Android mobile companion.',
              'offers': [
                {
                  '@type': 'Offer',
                  'name': 'Monthly Pro License',
                  'price': '4999',
                  'priceCurrency': 'INR',
                  'availability': 'https://schema.org/InStock',
                  'url': `${SITE_URL}/quotex-bot-pricing`
                },
                {
                  '@type': 'Offer',
                  'name': 'Annual Pro License',
                  'price': '49999',
                  'priceCurrency': 'INR',
                  'availability': 'https://schema.org/InStock',
                  'url': `${SITE_URL}/quotex-bot-pricing`
                }
              ]
            }
          ]}
        />
      )}

      {/* Customer Dashboard SEO (Noindex) */}
      {currentView === 'dashboard' && (
        <SEOHead
          title={`Customer Dashboard | ${SITE_BRAND}`}
          description="Manage your QBot2 Quotex bot subscription, view real-time binary options telemetry, pair hardware devices, and download software releases."
          canonicalPath="/dashboard"
          noindex={true}
        />
      )}

      {/* Documentation SEO */}
      {currentView === 'docs' && (
        <SEOHead
          title={`Technical Documentation & API Setup | ${SITE_BRAND}`}
          description="Complete technical specifications, local daemon setup, hardware fingerprint licensing, and binary options execution guide for QBot2."
          canonicalPath="/docs"
          jsonLd={{
            '@type': 'TechArticle',
            'headline': 'QBot2 Quotex Trading Bot Architecture & Integration Guide',
            'description':
              'Technical blueprints and local daemon specifications for running QBot2 Quotex algorithmic bot on Windows with Android companion pairing.',
            'author': {
              '@type': 'Organization',
              'name': SITE_BRAND
            }
          }}
        />
      )}

      {/* Admin Portal SEO (Noindex) */}
      {currentView === 'admin' && (
        <SEOHead
          title={`Admin Control Portal | ${SITE_BRAND}`}
          description="Administrative portal for AlgoTraders software licensing, user account management, and system telemetry."
          canonicalPath="/admin"
          noindex={true}
        />
      )}

      {/* Navigation Header */}
      <Navbar
        currentView={currentView === 'seo-page' ? 'landing' : currentView}
        setCurrentView={(view) => {
          if (view === 'landing') navigateTo('/');
          else if (view === 'dashboard') navigateTo('/dashboard');
          else if (view === 'admin') navigateTo('/admin');
          else if (view === 'docs') navigateTo('/docs');
        }}
        openAuthModal={openAuth}
        openLegalModal={(t) => setLegalModalType(t)}
        onNavigate={navigateTo}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {currentView === 'landing' && (
          <>
            <HeroSection
              onStartTrial={() => {
                if (user) {
                  navigateTo('/dashboard');
                } else {
                  openAuth('signup');
                }
              }}
              onSeeHowItWorks={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenDashboard={() => navigateTo('/dashboard')}
            />

            <CustomerFeedbackTicker />

            <FeaturesSection />

            <HowItWorksSection
              onGetStarted={() => {
                if (user) {
                  navigateTo('/dashboard');
                } else {
                  openAuth('signup');
                }
              }}
            />

            <ScreenshotsSection />

            {/* Interactive Knowledge Base with real crawlable SEO links */}
            <SEOKeywordsGuide onNavigate={navigateTo} />

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

        {currentView === 'seo-page' && activeSeoPage && (
          <SEOPage
            pageData={activeSeoPage}
            onOpenAuth={openAuth}
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'dashboard' && (
          <CustomerDashboard
            onGoToPricing={() => {
              navigateTo('/quotex-bot-pricing');
            }}
            onOpenDocs={() => navigateTo('/docs')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            onExitAdmin={() => {
              navigateTo('/');
            }}
          />
        )}

        {currentView === 'docs' && <DocsView />}
      </main>

      {/* Footer with Crawlable Links */}
      <Footer
        openLegalModal={(t) => setLegalModalType(t)}
        openAuthModal={openAuth}
        setCurrentView={(view) => {
          if (view === 'landing') navigateTo('/');
          else if (view === 'dashboard') navigateTo('/dashboard');
          else if (view === 'admin') navigateTo('/admin');
          else if (view === 'docs') navigateTo('/docs');
        }}
        onNavigate={navigateTo}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          navigateTo('/dashboard');
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
