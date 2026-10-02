import React from 'react';
import { ShieldCheck, Mail, Lock, ShieldAlert, BookOpen } from 'lucide-react';
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
              Algorithmic execution software for Quotex binary options. High-speed Windows PC background daemon paired with an Android companion app.
            </p>
            <div className="pt-2 flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TLS 1.3 256-bit Encrypted Licensing</span>
            </div>
          </div>

          {/* Col 2: SEO Landing Pages & Guides */}
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
                  href="/quotex-trade-analysis"
                  onClick={(e) => handleLinkClick(e, '/quotex-trade-analysis')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Trade Analysis Logic
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
            </ul>
          </div>

          {/* Col 3: Documentation & Features */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/quotex-bot-features"
                  onClick={(e) => handleLinkClick(e, '/quotex-bot-features')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Features & Specifications
                </a>
              </li>
              <li>
                <a
                  href="/quotex-bot-pricing"
                  onClick={(e) => handleLinkClick(e, '/quotex-bot-pricing')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Pricing & Licenses
                </a>
              </li>
              <li>
                <a
                  href="/quotex-bot-guide"
                  onClick={(e) => handleLinkClick(e, '/quotex-bot-guide')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Setup & Installation Guide
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate('/docs');
                    else setCurrentView('docs');
                  }}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  API Specifications
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Regulatory */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono">
              Compliance
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => openLegalModal('risk')}
                  className="hover:text-amber-400 transition-colors text-amber-400/90 font-medium text-left"
                >
                  Statutory Risk Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('terms')}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('privacy')}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Privacy & Data Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('refund')}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  14-Day Refund Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Account & Support */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono">
              Account & Support
            </h4>
            <ul className="space-y-2">
              <li>
                {user ? (
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('/dashboard');
                      else setCurrentView('dashboard');
                    }}
                    className="hover:text-cyan-400 transition-colors text-left"
                  >
                    Customer Dashboard ({user.email})
                  </button>
                ) : (
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="hover:text-cyan-400 transition-colors text-left"
                  >
                    Customer Sign In
                  </button>
                )}
              </li>
              <li>
                <a
                  href="mailto:algotraders.site@zohomail.in"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
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
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 text-slate-400 hover:underline cursor-pointer"
                  title="Admin Portal (Restricted Access)"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Third-Party Non-Affiliation Disclaimer */}
        <div className="mt-12 pt-6 border-t border-slate-900 text-[11px] text-slate-500 space-y-2 leading-relaxed">
          <p>
            <strong className="text-slate-400">Non-Affiliation Notice:</strong> {SITE_BRAND} is an independent software development project. {SITE_BRAND} is not affiliated with, endorsed by, sponsored by, or partner with Quotex, Awesome Ltd, or any binary options broker. Quotex is a registered trademark of its respective owner.
          </p>
          <p>
            <strong className="text-amber-400/90">Risk Warning:</strong> Binary options trading involves significant financial risk and is not suitable for all investors. You may lose all or more of your initial investment. Software tools do not guarantee profits.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} {SITE_BRAND}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Server: Asia-Southeast1</span>
            <span>•</span>
            <span>Version: 2.5.0 Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
