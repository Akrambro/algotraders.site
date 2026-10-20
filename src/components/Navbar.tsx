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
  currentPath?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openAuthModal,
  openLegalModal,
  onNavigate,
  currentPath = '/'
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
    if (currentPath !== '/' || currentView !== 'landing') {
      if (onNavigate) {
        onNavigate('/');
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      } else {
        window.location.pathname = '/';
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
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
              currentPath === '/' && currentView === 'landing' ? 'text-cyan-400 font-bold' : 'text-slate-300 hover:text-white'
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
              <span>Bot Guides & Research</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {guidesDropdownOpen && (
              <div
                onMouseLeave={() => setGuidesDropdownOpen(false)}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[720px] rounded-2xl bg-[#090f20] border border-slate-800 shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <div className="grid grid-cols-3 gap-6 text-xs">
                  {/* Col 1: Software & Platform */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 tracking-wider block border-b border-slate-800 pb-1.5 mb-2">
                      Software & Setup
                    </span>
                    <a
                      href="/quotex-trading-bot"
                      onClick={(e) => handleNavClick(e, '/quotex-trading-bot')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/quotex-trading-bot'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Quotex Trading Bot
                    </a>
                    <a
                      href="/quotex-auto-trading-bot"
                      onClick={(e) => handleNavClick(e, '/quotex-auto-trading-bot')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/quotex-auto-trading-bot'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Auto Trading Rules
                    </a>
                    <a
                      href="/quotex-bot-windows"
                      onClick={(e) => handleNavClick(e, '/quotex-bot-windows')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/quotex-bot-windows'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Windows 10/11 Daemon
                    </a>
                    <a
                      href="/quotex-bot-android"
                      onClick={(e) => handleNavClick(e, '/quotex-bot-android')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/quotex-bot-android'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Android Companion App
                    </a>
                    <a
                      href="/quotex-bot-demo"
                      onClick={(e) => handleNavClick(e, '/quotex-bot-demo')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/quotex-bot-demo'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Practice Account Testing
                    </a>
                    <a
                      href="/quotex-bot-risk-controls"
                      onClick={(e) => handleNavClick(e, '/quotex-bot-risk-controls')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/quotex-bot-risk-controls'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Risk Controls & Stops
                    </a>
                  </div>

                  {/* Col 2: Strategies & Analysis */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 tracking-wider block border-b border-slate-800 pb-1.5 mb-2">
                      Strategies & Math
                    </span>
                    <a
                      href="/quotex-trade-analysis"
                      onClick={(e) => handleNavClick(e, '/quotex-trade-analysis')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/quotex-trade-analysis'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Trade Analysis Confluence
                    </a>
                    <a
                      href="/quotex-otc-trading-bot"
                      onClick={(e) => handleNavClick(e, '/quotex-otc-trading-bot')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/quotex-otc-trading-bot'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      OTC Weekend Algorithm
                    </a>
                    <a
                      href="/guides/quotex-1-minute-strategy"
                      onClick={(e) => handleNavClick(e, '/guides/quotex-1-minute-strategy')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/guides/quotex-1-minute-strategy'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      1-Minute Strategy Guide
                    </a>
                    <a
                      href="/guides/quotex-5-minute-strategy"
                      onClick={(e) => handleNavClick(e, '/guides/quotex-5-minute-strategy')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/guides/quotex-5-minute-strategy'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      5-Minute Strategy Guide
                    </a>
                    <a
                      href="/guides/payout-percentage-and-expectancy"
                      onClick={(e) => handleNavClick(e, '/guides/payout-percentage-and-expectancy')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/guides/payout-percentage-and-expectancy'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Payout & Expectancy Math
                    </a>
                    <a
                      href="/guides/martingale-in-binary-options"
                      onClick={(e) => handleNavClick(e, '/guides/martingale-in-binary-options')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/guides/martingale-in-binary-options'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Martingale Drawdown Math
                    </a>
                  </div>

                  {/* Col 3: Comparisons & Technical */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 tracking-wider block border-b border-slate-800 pb-1.5 mb-2">
                      Buyer Guides & Tech
                    </span>
                    <a
                      href="/comparisons/quotex-trading-bots"
                      onClick={(e) => handleNavClick(e, '/comparisons/quotex-trading-bots')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/comparisons/quotex-trading-bots'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Bot Comparison Guide 2026
                    </a>
                    <a
                      href="/comparisons/free-vs-paid-quotex-bots"
                      onClick={(e) => handleNavClick(e, '/comparisons/free-vs-paid-quotex-bots')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/comparisons/free-vs-paid-quotex-bots'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Free vs Paid Quotex Bots
                    </a>
                    <a
                      href="/comparisons/quotex-bot-vs-browser-extension"
                      onClick={(e) => handleNavClick(e, '/comparisons/quotex-bot-vs-browser-extension')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/comparisons/quotex-bot-vs-browser-extension'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      Desktop vs Chrome Extension
                    </a>
                    <a
                      href="/technical/qbot2-architecture"
                      onClick={(e) => handleNavClick(e, '/technical/qbot2-architecture')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/technical/qbot2-architecture'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      QBot2 System Architecture
                    </a>
                    <a
                      href="/guides/quotex-bot-risks"
                      onClick={(e) => handleNavClick(e, '/guides/quotex-bot-risks')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/guides/quotex-bot-risks'
                          ? 'bg-amber-900/40 text-amber-300 font-bold'
                          : 'hover:bg-amber-950/40 text-amber-300 font-semibold'
                      }`}
                    >
                      Platform Rules & Bot Risks
                    </a>
                    <a
                      href="/about"
                      onClick={(e) => handleNavClick(e, '/about')}
                      className={`block p-1.5 rounded-lg transition-colors ${
                        currentPath === '/about'
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'hover:bg-slate-800/80 font-semibold text-slate-200 hover:text-cyan-300'
                      }`}
                    >
                      About Our Engineering Team
                    </a>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Explore all 37 guides, technical blueprints & research topics</span>
                  <button
                    onClick={() => scrollToSection('algo-knowledge-base')}
                    className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Open Knowledge Navigator &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          <a
            href="/quotex-bot-pricing"
            onClick={(e) => handleNavClick(e, '/quotex-bot-pricing')}
            className={`text-sm font-medium transition-colors ${
              currentPath === '/quotex-bot-pricing' ? 'text-cyan-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Pricing
          </a>
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
            href="/comparisons/quotex-trading-bots"
            onClick={(e) => handleNavClick(e, '/comparisons/quotex-trading-bots')}
            className="block text-sm font-semibold text-cyan-300 py-1.5"
          >
            Bot Comparisons 2026
          </a>
          <a
            href="/guides/quotex-bot-risks"
            onClick={(e) => handleNavClick(e, '/guides/quotex-bot-risks')}
            className="block text-sm font-semibold text-amber-300 py-1.5"
          >
            Broker Rules & Bot Risks
          </a>
          <a
            href="/quotex-bot-guide"
            onClick={(e) => handleNavClick(e, '/quotex-bot-guide')}
            className="block text-sm font-semibold text-slate-200 py-1.5"
          >
            Setup Guide & Docs
          </a>
          <a
            href="/about"
            onClick={(e) => handleNavClick(e, '/about')}
            className="block text-sm font-semibold text-slate-300 py-1.5"
          >
            About AlgoTraders
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
