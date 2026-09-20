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

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin' | 'docs'>('landing');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | 'risk' | null>(null);

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

        {currentView === 'admin' && <AdminDashboard />}

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
