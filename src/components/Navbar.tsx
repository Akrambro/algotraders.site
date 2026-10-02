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
  Lock,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { BrandLogo } from './BrandLogo.tsx';
import { hasActiveSubscription } from '../subscriptions.ts';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'admin' | 'docs';
  setCurrentView: (view: 'landing' | 'dashboard' | 'admin' | 'docs') => void;
  openAuthModal: (mode: 'signin' | 'signup') => void;
  openLegalModal: (type: 'terms' | 'privacy' | 'refund' | 'risk') => void;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openAuthModal,
  openLegalModal,
  onNavigate
}) => {
  const { user, subscription, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [guidesDropdownOpen, setGuidesDropdownOpen] = useState(false);

  const isSubActive = hasActiveSubscription(subscription);

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.pathname = path;
    }
    setMobileMenuOpen(false);
    setGuidesDropdownOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      if (onNavigate) {
        onNavigate('/');
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        setCurrentView('landing');
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
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
          onClick={(e) => handleNavClick(e, '/')}
          className="cursor-pointer group"
          id="navbar-brand-logo"
        >
          <BrandLogo size="md" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
            className={`text-sm font-medium transition-colors ${
              currentView === 'landing' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </a>
          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            How It Works
          </button>

          {/* Guides & SEO Landing Pages Dropdown */}
          <div className="relative">
            <button
              onClick={() => setGuidesDropdownOpen(!guidesDropdownOpen)}
              onMouseEnter={() => setGuidesDropdownOpen(true)}
              className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <span>Bot Guides</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {guidesDropdownOpen && (
              <div
                onMouseLeave={() => setGuidesDropdownOpen(false)}
                className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-[#090f20] border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <a
                  href="/quotex-trading-bot"
                  onClick={(e) => handleNavClick(e, '/quotex-trading-bot')}
                  className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  Quotex Trading Bot
                </a>
                <a
                  href="/quotex-auto-trading-bot"
                  onClick={(e) => handleNavClick(e, '/quotex-auto-trading-bot')}
                  className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  Auto Trading Bot
                </a>
                <a
                  href="/quotex-trade-analysis"
                  onClick={(e) => handleNavClick(e, '/quotex-trade-analysis')}
                  className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  Trade Analysis Logic
                </a>
                <a
                  href="/quotex-otc-trading-bot"
                  onClick={(e) => handleNavClick(e, '/quotex-otc-trading-bot')}
                  className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  OTC Weekend Algorithm
                </a>
                <a
                  href="/quotex-bot-features"
                  onClick={(e) => handleNavClick(e, '/quotex-bot-features')}
                  className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  Features & Specs
                </a>
                <a
                  href="/quotex-bot-guide"
                  onClick={(e) => handleNavClick(e, '/quotex-bot-guide')}
                  className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  Setup Guide & Docs
                </a>
              </div>
            )}
          </div>

          <a
            href="/quotex-bot-pricing"
            onClick={(e) => handleNavClick(e, '/quotex-bot-pricing')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Pricing
          </a>
          <button
            onClick={() => scrollToSection('faq')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
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
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-cyan-500/50 transition-colors text-sm cursor-pointer"
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
                    isSubActive
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isSubActive
                    ? subscription?.planId === 'annual'
                      ? 'Annual Pro'
                      : 'Monthly Pro'
                    : 'Customer'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#090f20] border border-slate-800 shadow-2xl p-2 z-50">
                  <div className="p-3 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{user.name || 'Trader'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        setUserDropdownOpen(false);
                        handleNavClick(e as any, '/dashboard');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Customer Dashboard</span>
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          setUserDropdownOpen(false);
                          handleNavClick(e as any, '/admin');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-purple-300 hover:bg-purple-950/40 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                        <span>Admin Portal</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#070b14] p-4 space-y-3">
          <a
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            Home Overview
          </a>
          <a
            href="/quotex-trading-bot"
            onClick={(e) => handleNavClick(e, '/quotex-trading-bot')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            Quotex Trading Bot
          </a>
          <a
            href="/quotex-auto-trading-bot"
            onClick={(e) => handleNavClick(e, '/quotex-auto-trading-bot')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            Auto Trading Rules
          </a>
          <a
            href="/quotex-trade-analysis"
            onClick={(e) => handleNavClick(e, '/quotex-trade-analysis')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            Trade Analysis Logic
          </a>
          <a
            href="/quotex-otc-trading-bot"
            onClick={(e) => handleNavClick(e, '/quotex-otc-trading-bot')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            OTC Weekend Algorithm
          </a>
          <a
            href="/quotex-bot-features"
            onClick={(e) => handleNavClick(e, '/quotex-bot-features')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            Features & Specs
          </a>
          <a
            href="/quotex-bot-pricing"
            onClick={(e) => handleNavClick(e, '/quotex-bot-pricing')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            Pricing Plans
          </a>
          <a
            href="/quotex-bot-guide"
            onClick={(e) => handleNavClick(e, '/quotex-bot-guide')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            Setup Guide & Docs
          </a>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <button
                onClick={(e) => handleNavClick(e as any, '/dashboard')}
                className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signin');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signup');
                  }}
                  className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
