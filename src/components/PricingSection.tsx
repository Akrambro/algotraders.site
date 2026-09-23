import React, { useState } from 'react';
import { Check, Shield, HelpCircle, ArrowRight, Sparkles, QrCode, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { PaymentQRModal } from './PaymentQRModal.tsx';

interface PricingSectionProps {
  onSelectPlan: (planId: 'monthly' | 'annual' | 'trial') => void;
  openAuthModal: (mode: 'signup') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, openAuthModal }) => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  const handleCheckout = (planId: 'monthly' | 'annual' | 'trial') => {
    if (planId === 'trial') {
      if (!user) {
        openAuthModal('signup');
      } else {
        onSelectPlan('trial');
      }
      return;
    }

    // For paid plans, open the UPI QR Payment Modal
    setQrModalOpen(true);
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-[#070b14]">
      {/* Background container (solid - no gradients) */}
      <div className="absolute inset-0 bg-[#070b14] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-mono font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>TRANSPARENT LICENSING • ZERO HIDDEN FEES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Quotex Trading Bot Licensing
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Deploy advanced algorithmic binary options bots directly on your Windows PC with real-time Android companion telemetry.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* Card 1: 2-Day Evaluation Trial */}
          <div className="rounded-2xl p-8 border border-slate-800 bg-[#0b1120] relative flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Evaluation
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  2 DAYS ACCESS
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">2-Day Free Trial</h3>
              <p className="text-xs text-slate-400 mt-2">
                Evaluate Quotex binary options bots on simulated broker accounts before subscribing to live real-money execution.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">₹0</span>
                <span className="text-xs text-slate-500">/ 48 hours</span>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full Windows backend software access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Android mobile monitor pairing (1 device)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Quotex binary options algorithm simulation engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Practice broker account testing</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Check className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Live real capital trading (requires Paid Plan)</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleCheckout('trial')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors text-center cursor-pointer"
                id="pricing-trial-btn"
              >
                Activate 2-Day Trial
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">Instant download upon registration</p>
            </div>
          </div>

          {/* Card 2: Paid Plan (Monthly & Yearly Selection) */}
          <div className="rounded-2xl p-8 border border-cyan-500/50 bg-[#0b1329] relative flex flex-col justify-between shadow-2xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cyan-400 text-slate-950 font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Algorithmic Suite</span>
            </div>

            <div>
              {/* Billing Cycle Switcher */}
              <div className="flex justify-center mb-6 mt-2">
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      billingCycle === 'monthly'
                        ? 'bg-cyan-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Monthly (₹4,999/mo)
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      billingCycle === 'annual'
                        ? 'bg-cyan-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Yearly (₹49,999/yr)</span>
                    <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                      2 Months Free
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-bold text-white">Paid Plan</h3>
                {billingCycle === 'annual' && (
                  <span className="text-[11px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                    Save ₹9,989 (2 Mos Free)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Unrestricted algorithmic execution for Quotex trading and binary options on Practice & Live broker accounts.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                {billingCycle === 'annual' ? (
                  <>
                    <span className="text-4xl font-extrabold text-white font-mono">₹49,999</span>
                    <span className="text-xs text-slate-400">/ year (₹4,166/mo • 2 months free)</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-white font-mono">₹4,999</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </>
                )}
              </div>

              <div className="mt-6 space-y-3 pt-6 border-t border-slate-800 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white">Live Real Capital + Practice Broker Trading</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Multi-device pairing ({billingCycle === 'annual' ? '3 devices' : '2 devices'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Custom Quotex bot parameter tuning & real-time alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Automated stop-loss & risk management caps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Live Android push notifications & heartbeat monitor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Priority software updates & direct technical support</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => handleCheckout(billingCycle)}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors text-center flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                id="pricing-paid-btn"
              >
                <QrCode className="w-4 h-4" />
                <span>
                  {billingCycle === 'annual'
                    ? 'Scan QR & Pay Yearly (₹49,999)'
                    : 'Scan QR & Pay Monthly (₹4,999)'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Activation Process:</span>
                </div>
                <p>
                  1. Scan dynamic UPI QR (with your unique Order ID embedded for PhonePe / GPay).
                  <br />
                  2. Pay to payee <strong className="text-white">Dheeraj</strong> via QR scan & email screenshot to: <strong className="text-white select-all">algotraders.site@zohomail.in</strong>.
                  <br />
                  3. Admin verifies Order ID & unlocks software downloads immediately.
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
        initialPlan={billingCycle}
      />
    </section>
  );
};
