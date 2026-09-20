import React from 'react';
import { Cpu, ShieldCheck, Mail, Lock, ExternalLink, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface FooterProps {
  openLegalModal: (type: 'terms' | 'privacy' | 'refund' | 'risk') => void;
  openAuthModal: (mode: 'signin') => void;
  setCurrentView: (view: 'landing' | 'dashboard' | 'admin' | 'docs') => void;
}

export const Footer: React.FC<FooterProps> = ({
  openLegalModal,
  openAuthModal,
  setCurrentView
}) => {
  const { user } = useAuth();

  return (
    <footer className="bg-[#04060d] border-t border-slate-800/80 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight font-['Outfit']">
                Algo Trders<span className="text-cyan-400">.site</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Software provider for QBot2 Trading. High-performance Supertrend algorithmic execution on Windows PC with real-time Android mobile monitoring.
            </p>
            <div className="pt-2 flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TLS 1.3 256-bit Encrypted Licensing</span>
            </div>
          </div>

          {/* Col 2: Product & Downloads */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono">
              Product & Downloads
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Windows Backend ZIP (v2.4.1)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Android APK Monitor (v2.1.0)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('docs')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Python/FastAPI Integration Guide
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Device Pairing Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Regulatory */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono">
              Compliance & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => openLegalModal('risk')}
                  className="hover:text-amber-400 transition-colors text-amber-400/90 font-medium"
                >
                  Statutory Risk Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('terms')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('privacy')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Privacy & Data Export Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('refund')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  14-Day Refund Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Account & Support */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider font-mono">
              Account & Support
            </h4>
            <ul className="space-y-2">
              <li>
                {user ? (
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="hover:text-cyan-400 transition-colors"
                  >
                    Customer Dashboard ({user.email})
                  </button>
                ) : (
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="hover:text-cyan-400 transition-colors"
                  >
                    Customer Sign In
                  </button>
                )}
              </li>
              <li>
                <a
                  href="mailto:support@algotrders.site"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>support@algotrders.site</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('admin')}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1 text-slate-500"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} Algo Trders.site. All rights reserved. QBot2 Trading is software for algorithmic execution.
          </div>
          <div className="flex items-center gap-4">
            <span>Server: Asia-Southeast1</span>
            <span>•</span>
            <span>Version: 2.4.1 Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
