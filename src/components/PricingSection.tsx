import React, { useState } from 'react';
import { Check, Zap, Shield, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface PricingSectionProps {
  onSelectPlan: (planId: 'monthly' | 'annual' | 'trial') => void;
  openAuthModal: (mode: 'signup') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, openAuthModal }) => {
  const { user, token, refreshUserData } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  const handleCheckout = async (planId: 'monthly' | 'annual' | 'trial') => {
    if (planId === 'trial') {
      if (!user) {
        openAuthModal('signup');
      } else {
        onSelectPlan('trial');
      }
      return;
    }

    if (!user || !token) {
      openAuthModal('signup');
      return;
    }

    setLoadingPlan(planId);
    setCheckoutMessage(null);

    try {
      const resp = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Checkout session failed.');
      }

      const targetUrl = data.checkoutUrl || data.url;
      if (targetUrl) {
        // If simulated dev mode or live Razorpay redirect/modal URL
        if (data.mode === 'simulated_dev') {
          setCheckoutMessage(`Razorpay Subscription activated (${planId} plan)! Redirecting to Dashboard...`);
          await refreshUserData();
          setTimeout(() => {
            window.location.href = '/#dashboard';
            onSelectPlan(planId);
          }, 1200);
        } else {
          window.location.href = targetUrl;
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutMessage(err.message || 'Error initiating checkout.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-24 relative bg-[#060913]" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Simple, Transparent Pricing
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Predictable Plans. Zero Hidden Trading Fees.
          </h2>
          <p className="mt-4 text-slate-300 text-base">
            Never pay commission cuts or percentage-of-profit royalties. Start with our 7-day free trial, then pick the plan that suits your trading goals.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-slate-900 border border-slate-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-950 text-cyan-300">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {checkoutMessage && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs text-center animate-in fade-in">
            {checkoutMessage}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Plan 1: 7-Day Free Trial */}
          <div className="glass-card rounded-2xl p-8 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase font-mono font-bold text-slate-400">
                  Starter Evaluation
                </span>
                <span className="text-[10px] uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                  No Card Required
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white">7-Day Free Trial</h3>
              <p className="text-xs text-slate-400 mt-2">
                Evaluate all features in Practice mode with zero financial commitment.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white font-mono">$0</span>
                <span className="text-xs text-slate-400">/ 7 days</span>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full Windows backend application access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Android mobile monitor pairing (1 device)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Supertrend strategy simulation engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Practice broker account testing</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Check className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Real live capital trading (locked in trial)</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleCheckout('trial')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all text-center cursor-pointer"
                id="pricing-trial-btn"
              >
                Activate 7-Day Trial
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">Instant download on registration</p>
            </div>
          </div>

          {/* Plan 2: Pro Annual (Featured) */}
          <div className="glass-panel-glow rounded-2xl p-8 border border-cyan-500/40 relative flex flex-col justify-between scale-105 z-10 shadow-2xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-[11px] uppercase tracking-wider shadow-md">
              Most Popular • Best Value
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <span className="text-xs uppercase font-mono font-bold text-cyan-400">
                  Full Algorithmic Suite
                </span>
                <span className="text-[10px] uppercase px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                  Save $118/year
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white">Annual Pro Plan</h3>
              <p className="text-xs text-slate-300 mt-2">
                Unrestricted execution on both practice and real capital accounts with premium support.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-white font-mono">$39</span>
                <span className="text-xs text-slate-400">/ month, billed annually ($470/yr)</span>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-800 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white">Both Practice AND Live Real trading</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Up to 3 active paired devices (e.g. 2 PCs + Phone)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Custom Supertrend parameter tuning & alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Automated stop-loss & risk management caps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Priority software updates & Discord access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>14-day money-back satisfaction guarantee</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleCheckout('annual')}
                disabled={loadingPlan === 'annual'}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="pricing-annual-btn"
              >
                {loadingPlan === 'annual' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe Annually ($470/yr)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Processed securely via Stripe Billing • Cancel anytime
              </p>
            </div>
          </div>

          {/* Plan 3: Monthly Flex */}
          <div className="glass-card rounded-2xl p-8 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase font-mono font-bold text-slate-400">
                  Month-to-Month
                </span>
                <span className="text-[10px] uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Flexible
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white">Monthly Flex Plan</h3>
              <p className="text-xs text-slate-400 mt-2">
                Full production features with convenient month-to-month billing.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white font-mono">$49</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real & Practice trading enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 2 active paired devices (PC + Android)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full Supertrend algorithm execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live mobile trade push notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cancel anytime in 1-click via customer portal</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleCheckout('monthly')}
                disabled={loadingPlan === 'monthly'}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="pricing-monthly-btn"
              >
                {loadingPlan === 'monthly' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Secure Checkout...</span>
                  </>
                ) : (
                  <span>Subscribe Monthly ($49/mo)</span>
                )}
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">Billed every 30 days • No contracts</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
