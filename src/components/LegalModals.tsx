import React from 'react';
import { X, ShieldAlert, FileText, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';

interface LegalModalsProps {
  activeModal: 'terms' | 'privacy' | 'refund' | 'risk' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ activeModal, onClose }) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl bg-[#0b101e] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            {activeModal === 'risk' && <ShieldAlert className="w-5 h-5 text-amber-400" />}
            {activeModal === 'terms' && <FileText className="w-5 h-5 text-cyan-400" />}
            {activeModal === 'privacy' && <Lock className="w-5 h-5 text-purple-400" />}
            {activeModal === 'refund' && <RefreshCw className="w-5 h-5 text-emerald-400" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {activeModal === 'risk' && 'Statutory Financial Risk Disclosure'}
              {activeModal === 'terms' && 'Terms of Service & License Agreement'}
              {activeModal === 'privacy' && 'Privacy Policy & Data Rights'}
              {activeModal === 'refund' && '14-Day Money-Back Guarantee Policy'}
            </h3>
            <p className="text-xs text-slate-400">Algo Trders.site • Last updated: September 2026</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-6 space-y-4 text-xs text-slate-300 leading-relaxed pr-2">
          {activeModal === 'risk' && (
            <>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <strong>HIGH-RISK INVESTMENT WARNING:</strong> Trading foreign exchange, contracts for difference (CFDs), equities, and digital assets on margin carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you.
              </div>
              <h4 className="text-sm font-bold text-white">1. No Guaranteed Profits or Returns</h4>
              <p>
                Algo Trders.site explicitly disclaims any promises, warranties, or representations regarding trading profits, returns on capital, or financial gains. Quantitative trading models and Quotex binary options bot algorithms are mathematical tools that execute predefined parameters. They cannot predict unexpected macroeconomic events, flash crashes, regulatory announcements, or sudden liquidity shocks.
              </p>
              <h4 className="text-sm font-bold text-white">2. Backtesting and Hypothetical Performance</h4>
              <p>
                Hypothetical or simulated performance results have inherent limitations. Unlike an actual performance record, simulated trades do not represent actual trading. Because the trades have not actually been executed, results may have under-or-over compensated for the impact, if any, of certain market factors, such as lack of liquidity, slippage, and spread widening.
              </p>
              <h4 className="text-sm font-bold text-white">3. Technical Execution and Latency Risks</h4>
              <p>
                Algorithmic trading depends on uninterrupted internet connectivity, PC hardware stability, broker server uptime, and local Wi-Fi router operation. Disconnections, power outages, software crashes, or broker API rate-limiting may cause orders to be delayed, filled at unfavorable prices, or rejected entirely.
              </p>
              <h4 className="text-sm font-bold text-white">4. Independent Advice</h4>
              <p>
                You should seek advice from an independent and suitably licensed financial advisor prior to commencing trading with real capital. Never trade with capital you cannot comfortably afford to lose.
              </p>
            </>
          )}

          {activeModal === 'terms' && (
            <>
              <h4 className="text-sm font-bold text-white">1. Software License Grant</h4>
              <p>
                Algo Trders.site grants you a revocable, non-exclusive, non-transferable, limited license to download, install, and execute the QBot2 software strictly in accordance with the terms of this Agreement and your active subscription tier.
              </p>
              <h4 className="text-sm font-bold text-white">2. Restrictions on Reverse Engineering</h4>
              <p>
                You agree not to modify, reverse-engineer, decompile, disassemble, or circumvent the cryptographic licensing validation routines, activation code mechanisms, or HMAC signatures embedded within the software.
              </p>
              <h4 className="text-sm font-bold text-white">3. Subscription Billing & Automatic Renewals</h4>
              <p>
                Subscriptions are billed in advance on a recurring monthly or annual basis. You may cancel your subscription at any time via the Customer Dashboard. Upon cancellation, your access remains valid through the conclusion of your paid period.
              </p>
              <h4 className="text-sm font-bold text-white">4. Limitation of Liability</h4>
              <p>
                In no event shall Algo Trders.site, its developers, or affiliates be liable for any trading losses, lost profits, lost opportunities, broker commissions, or damages arising out of the use or inability to use the software.
              </p>
            </>
          )}

          {activeModal === 'privacy' && (
            <>
              <h4 className="text-sm font-bold text-white">1. Minimal Data Collection</h4>
              <p>
                We believe in zero-knowledge privacy for traders. Algo Trders.site does NOT collect, transmit, or store your brokerage passwords, account balances, or individual trade decisions on our cloud servers. All broker credentials reside solely on your personal Windows PC.
              </p>
              <h4 className="text-sm font-bold text-white">2. What Information We Process</h4>
              <p>
                We only process: (a) your account email address and password hash (bcrypt); (b) billing identifiers provided by Stripe; (c) hardware fingerprints and device names necessary to enforce your subscription device limits; and (d) cloud license check heartbeats.
              </p>
              <h4 className="text-sm font-bold text-white">3. GDPR Data Rights & Right to Erasure</h4>
              <p>
                You have the right to request an export of all personal data held about you in JSON format, or request complete account erasure directly from your Account Settings panel.
              </p>
            </>
          )}

          {activeModal === 'refund' && (
            <>
              <h4 className="text-sm font-bold text-white">14-Day Money-Back Guarantee</h4>
              <p>
                We want you to be completely satisfied with QBot2 Trading. If for any reason the software does not meet your technical expectations or compatibility requirements, you may request a 100% full refund within 14 calendar days of your initial subscription purchase.
              </p>
              <p>
                To request a refund, simply email <span className="text-cyan-400 font-mono">algotraders.site@zohomail.in</span> with your account email address and payment screenshot. Refunds are verified and issued promptly.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
