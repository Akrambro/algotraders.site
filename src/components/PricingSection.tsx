import React, { useState } from 'react';
import { Check, Shield, HelpCircle, ArrowRight, Sparkles, QrCode, Mail, Zap } from 'lucide-react';
import { PaymentQRModal } from './PaymentQRModal.tsx';

interface PricingSectionProps {
  onSelectPlan?: (planId: 'monthly' | 'annual') => void;
  openAuthModal?: (mode: 'signup') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = () => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  const handleCheckout = (planId: 'monthly' | 'annual') => {
    setSelectedPlan(planId);
    setQrModalOpen(true);
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-[#070b14]">
      {/* Background container */}
      <div className="absolute inset-0 bg-[#070b14] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-mono font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>TRANSPARENT LICENSING • ZERO HIDDEN FEES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Quotex Trading Bot Licensing
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Deploy institutional-grade automated trading algorithms directly on your Windows PC with real-time Android companion telemetry.
          </p>
        </div>

        {/* Pricing Cards Grid (Monthly Pro & Annual Pro) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* Card 1: Monthly Pro Plan */}
          <div className="rounded-3xl p-8 border border-slate-800 bg-[#0b1120] relative flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Monthly Subscription
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  30 DAYS ACCESS
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">Monthly Pro License</h3>
              <p className="text-xs text-slate-400 mt-2">
                Ideal for active traders seeking flexible month-to-month access to Quotex algorithmic bots with full mobile companion pairing.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">₹4,999</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-white font-medium">Live Real Capital & Practice Account Trading</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Full Windows backend daemon & automated execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Android mobile monitor pairing (Up to 2 devices)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Automated stop-loss, take-profit & Martingale controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Standard technical email support</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleCheckout('monthly')}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-cyan-500/50 transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-md"
                id="pricing-monthly-btn"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Get Monthly License (₹4,999)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">Instant software unlock upon UPI verification</p>
            </div>
          </div>

          {/* Card 2: Annual Pro Plan (Featured) */}
          <div className="rounded-3xl p-8 border border-cyan-500/50 bg-[#0b1329] relative flex flex-col justify-between shadow-2xl hover:border-cyan-400 transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Best Value • Save ₹9,989 (2 Months Free)</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Annual Commitment
                </span>
                <span className="text-[11px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                  365 DAYS ACCESS
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">Annual Pro License</h3>
              <p className="text-xs text-slate-300 mt-2">
                The complete algorithmic suite with maximum hardware pairing capacity, priority updates, and institutional risk parameters.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">₹49,999</span>
                <span className="text-xs text-slate-400">/ year (₹4,166/mo)</span>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-800 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">All Monthly Pro Features Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-cyan-300">Multi-device pairing: 3 authorized hardware slots</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Quotex OTC & live market customized strategy presets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct WebSocket zero-latency execution pipelines</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority 24/7 technical desk & fast-track activation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All upcoming major v3.0 algorithm upgrades included</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => handleCheckout('annual')}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors text-center flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
                id="pricing-annual-btn"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Get Annual License (₹49,999)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Activation Process:</span>
                </div>
                <p>
                  1. Scan dynamic UPI QR with embedded unique Order ID.
                  <br />
                  2. Complete payment via PhonePe / GPay / Paytm & submit screenshot.
                  <br />
                  3. License activates immediately upon verification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & FAQ Assurance */}
        <div className="mt-16 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Direct UPI QR payment verification</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            <span>Support: algotraders.site@zohomail.in</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Multi-device Windows PC & Android mobile pairing</span>
          </div>
        </div>
      </div>

      {/* UPI QR Payment Modal */}
      <PaymentQRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        initialPlan={selectedPlan}
      />
    </section>
  );
};
