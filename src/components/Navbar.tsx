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
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 cursor-pointer group"
          id="navbar-brand-logo"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400/60 transition-all">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
            Algo Trders<span className="text-cyan-400">.site</span>
          </span>
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
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider">
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
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors ${
                      currentView === 'dashboard' ? 'text-cyan-400 bg-cyan-950/30 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    Customer Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('admin');
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors ${
                      currentView === 'admin' ? 'text-purple-400 bg-purple-950/30 font-semibold' : 'text-purple-300'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-purple-400" />
                    Admin Control Panel
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      setCurrentView('landing');
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
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
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
              }}
              className="text-left px-3 py-2 text-sm font-medium text-cyan-400 hover:bg-slate-800/50 rounded-lg"
            >
              Customer Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentView('admin');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium text-purple-400 hover:bg-slate-800/50 rounded-lg"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
