import React from 'react';
import { ShieldCheck, Mail, Lock, ShieldAlert, BookOpen, Layers, Cpu, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { BrandLogo } from './BrandLogo.tsx';
import { SITE_BRAND } from '../seo/seo-data.ts';

interface FooterProps {
  openLegalModal: (type: 'terms' | 'privacy' | 'refund' | 'risk') => void;
  openAuthModal: (mode: 'signin') => void;
  setCurrentView: (view: 'landing' | 'dashboard' | 'admin' | 'docs') => void;
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  openLegalModal,
  openAuthModal,
  setCurrentView,
  onNavigate
}) => {
  const { user } = useAuth();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <footer className="bg-[#04060d] border-t border-slate-800/80 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div
              onClick={() => {
                if (onNavigate) onNavigate('/');
                else setCurrentView('landing');
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="cursor-pointer inline-block"
            >
              <BrandLogo size="md" />
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Independent algorithmic execution software for Quotex binary options. Windows background daemon paired with an Android mobile companion.
            </p>
            <div className="pt-2 flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TLS 1.3 Hardware-Bound Licensing</span>
            </div>
            <div className="pt-1">
              <a
                href="/about"
                onClick={(e) => handleLinkClick(e, '/about')}
                className="text-cyan-400 hover:underline font-semibold text-xs"
              >
                About Our Engineering Team &rarr;
              </a>
            </div>
          </div>

          {/* Col 2: Trading Bots */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Trading Bots</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/quotex-trading-bot"
                  onClick={(e) => handleLinkClick(e, '/quotex-trading-bot')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Quotex Trading Bot
                </a>
              </li>
              <li>
                <a
                  href="/quotex-auto-trading-bot"
                  onClick={(e) => handleLinkClick(e, '/quotex-auto-trading-bot')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Auto Trading Bot
                </a>
              </li>
              <li>
                <a
                  href="/quotex-bot-windows"
                  onClick={(e) => handleLinkClick(e, '/quotex-bot-windows')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Windows 10/11 Bot
                </a>
              </li>
              <li>
                <a
                  href="/quotex-bot-android"
                  onClick={(e) => handleLinkClick(e, '/quotex-bot-android')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Android Companion App
                </a>
              </li>
              <li>
                <a
                  href="/quotex-otc-trading-bot"
                  onClick={(e) => handleLinkClick(e, '/quotex-otc-trading-bot')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  OTC Weekend Algorithm
                </a>
              </li>
              <li>
                <a
                  href="/quotex-bot-demo"
                  onClick={(e) => handleLinkClick(e, '/quotex-bot-demo')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Practice Account Setup
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Strategy & Education Guides */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Guides & Strategies</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/guides/what-is-a-quotex-trading-bot"
                  onClick={(e) => handleLinkClick(e, '/guides/what-is-a-quotex-trading-bot')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  What Is a Quotex Bot?
                </a>
              </li>
              <li>
                <a
                  href="/guides/how-quotex-bot-automation-works"
                  onClick={(e) => handleLinkClick(e, '/guides/how-quotex-bot-automation-works')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  How Automation Works
                </a>
              </li>
              <li>
                <a
                  href="/guides/quotex-1-minute-strategy"
                  onClick={(e) => handleLinkClick(e, '/guides/quotex-1-minute-strategy')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  1-Minute Strategy Guide
                </a>
              </li>
              <li>
                <a
                  href="/guides/quotex-5-minute-strategy"
                  onClick={(e) => handleLinkClick(e, '/guides/quotex-5-minute-strategy')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  5-Minute Strategy Guide
                </a>
              </li>
              <li>
                <a
                  href="/guides/quotex-otc-strategy"
                  onClick={(e) => handleLinkClick(e, '/guides/quotex-otc-strategy')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  OTC Strategy & Volatility
                </a>
              </li>
              <li>
                <a
                  href="/guides/payout-percentage-and-expectancy"
                  onClick={(e) => handleLinkClick(e, '/guides/payout-percentage-and-expectancy')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Payout & Expectancy Math
                </a>
              </li>
              <li>
                <a
                  href="/guides/martingale-in-binary-options"
                  onClick={(e) => handleLinkClick(e, '/guides/martingale-in-binary-options')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Martingale Risk Analysis
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Comparisons & Tech Authority */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Comparisons & Tech</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/comparisons/quotex-trading-bots"
                  onClick={(e) => handleLinkClick(e, '/comparisons/quotex-trading-bots')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Best Quotex Bots Compared
                </a>
              </li>
              <li>
                <a
                  href="/comparisons/free-vs-paid-quotex-bots"
                  onClick={(e) => handleLinkClick(e, '/comparisons/free-vs-paid-quotex-bots')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Free vs Paid Quotex Bots
                </a>
              </li>
              <li>
                <a
                  href="/comparisons/quotex-bot-vs-browser-extension"
                  onClick={(e) => handleLinkClick(e, '/comparisons/quotex-bot-vs-browser-extension')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Desktop vs Chrome Extension
                </a>
              </li>
              <li>
                <a
                  href="/technical/qbot2-architecture"
                  onClick={(e) => handleLinkClick(e, '/technical/qbot2-architecture')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  QBot2 System Architecture
                </a>
              </li>
              <li>
                <a
                  href="/technical/risk-engine"
                  onClick={(e) => handleLinkClick(e, '/technical/risk-engine')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Risk Engine Circuit Breakers
                </a>
              </li>
              <li>
                <a
                  href="/changelog"
                  onClick={(e) => handleLinkClick(e, '/changelog')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Software Changelog (v2.5.0)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Compliance & Support */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Risk & Support</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/guides/quotex-bot-risks"
                  onClick={(e) => handleLinkClick(e, '/guides/quotex-bot-risks')}
                  className="hover:text-amber-400 transition-colors text-amber-300 font-semibold"
                >
                  Platform Rules & Bot Risks
                </a>
              </li>
              <li>
                <a
                  href="/quotex-bot-faq"
                  onClick={(e) => handleLinkClick(e, '/quotex-bot-faq')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('risk')}
                  className="hover:text-amber-400 transition-colors text-amber-400/90 text-left cursor-pointer"
                >
                  Statutory Risk Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('terms')}
                  className="hover:text-cyan-400 transition-colors text-left cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('privacy')}
                  className="hover:text-cyan-400 transition-colors text-left cursor-pointer"
                >
                  Privacy & Data Policy
                </button>
              </li>
              <li>
                <a
                  href="mailto:algotraders.site@zohomail.in"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 pt-1"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">algotraders.site@zohomail.in</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate('/admin');
                    else setCurrentView('admin');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 text-slate-400 hover:underline cursor-pointer pt-1"
                  title="Admin Portal (Restricted Access)"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Third-Party Non-Affiliation & Quotex Rules Notice */}
        <div className="mt-12 pt-6 border-t border-slate-900 text-[11px] text-slate-500 space-y-2.5 leading-relaxed">
          <p>
            <strong className="text-slate-300">Third-Party Non-Affiliation Disclosure:</strong> {SITE_BRAND} is an independent software development provider. {SITE_BRAND} is not affiliated with, endorsed by, sponsored by, or partner with Quotex, Awesome Ltd, or any binary options broker. Quotex is a registered trademark of its respective owner.
          </p>
          <p>
            <strong className="text-amber-400">Quotex Trading Rules Notice:</strong> Quotex’s published Rules of Trading Operations state that creating, selecting, or using automated mechanisms, algorithms, or specialized software that allows operations without direct client participation is prohibited, and automated trading software can trigger automatic violation detection. Traders must independently evaluate broker agreements and assume all trading risk.
          </p>
          <p>
            <strong className="text-amber-400/90">Statutory Risk Warning:</strong> Binary options trading involves significant financial risk and can result in the total loss of invested capital. Software tools assist with automated rule execution but cannot eliminate market risk or guarantee profitability. Never trade with money you cannot afford to lose.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} {SITE_BRAND}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="/about" onClick={(e) => handleLinkClick(e, '/about')} className="hover:text-slate-400">About Us</a>
            <span>•</span>
            <a href="/changelog" onClick={(e) => handleLinkClick(e, '/changelog')} className="hover:text-slate-400">Changelog</a>
            <span>•</span>
            <a href="/quotex-bot-pricing" onClick={(e) => handleLinkClick(e, '/quotex-bot-pricing')} className="hover:text-slate-400">Pricing</a>
            <span>•</span>
            <span>Version: 2.5.0 Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
