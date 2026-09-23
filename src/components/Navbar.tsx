import React, { useState } from 'react';
import {
  ShieldAlert,
  Cpu,
  Smartphone,
  Layers,
  HelpCircle,
  CreditCard,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { BrandLogo } from './BrandLogo.tsx';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'admin' | 'docs';
  setCurrentView: (view: 'landing' | 'dashboard' | 'admin' | 'docs') => void;
  openAuthModal: (mode: 'signin' | 'signup') => void;
  openLegalModal: (type: 'terms' | 'privacy' | 'refund' | 'risk') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openAuthModal,
  openLegalModal
}) => {
  const { user, subscription, logout, switchUserRoleDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isSubActive =
    subscription &&
    (subscription.status === 'active' || subscription.status === 'trialing');

  const scrollToSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }}
          className="cursor-pointer group"
          id="navbar-brand-logo"
        >
          <BrandLogo size="md" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`text-sm font-medium transition-colors ${
              currentView === 'landing' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('screenshots')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Screenshots
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* Right Action & Profile Button */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-cyan-500/50 transition-colors text-sm"
                id="user-profile-menu-button"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider">
                  {user.name
                    ? user.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : user.email.slice(0, 2).toUpperCase()}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                    subscription?.status === 'active'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                      : subscription?.status === 'trialing'
                      ? 'bg-blue-950/80 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {subscription?.status === 'active'
                    ? subscription.planId === 'annual'
                      ? 'Annual Pro'
                      : 'Monthly Pro'
                    : subscription?.status === 'trialing'
                    ? 'Trial Version'
                    : 'Trial Version'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 rounded-xl bg-[#0e1626] border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-[11px] font-medium text-slate-400">Signed in</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          subscription?.status === 'active'
                            ? 'bg-emerald-400'
                            : subscription?.status === 'trialing'
                            ? 'bg-blue-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-200 capitalize">
                        {subscription?.status === 'active'
                          ? `${subscription.planId === 'annual' ? 'Annual Pro' : 'Monthly Pro'} Subscription`
                          : 'Trial Version'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentView('dashboard');
                      setUserDropdownOpen(false);
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors ${
                      currentView === 'dashboard' ? 'text-cyan-400 bg-cyan-950/30 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    Customer Dashboard
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      setCurrentView('landing');
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                id="navbar-sign-in-btn"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg shadow-cyan-500/20 transition-colors cursor-pointer"
                id="navbar-start-trial-btn"
              >
                Start Free Trial
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-2.5 py-1 text-xs rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500 text-slate-950 font-bold"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#070b14] px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                setCurrentView('landing');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 rounded-lg"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 rounded-lg"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 rounded-lg"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 rounded-lg"
            >
              Pricing
            </button>
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="text-left px-3 py-2 text-sm font-medium text-cyan-400 hover:bg-slate-800/50 rounded-lg"
            >
              Customer Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
