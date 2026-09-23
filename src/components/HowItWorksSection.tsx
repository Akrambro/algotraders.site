import React from 'react';
import {
  UserPlus,
  CreditCard,
  Download,
  Wifi,
  SlidersHorizontal,
  PlayCircle,
  ArrowRight
} from 'lucide-react';

interface HowItWorksSectionProps {
  onGetStarted: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onGetStarted }) => {
  const steps = [
    {
      num: '01',
      icon: UserPlus,
      title: 'Create Your Account',
      description:
        'Sign up on Algo Trders.site with your email address. Every new registration immediately activates a 7-day full-access trial.',
      tag: 'Step 1'
    },
    {
      num: '02',
      icon: CreditCard,
      title: 'Scan QR & Pay Plan',
      description:
        'Scan the UPI QR code with any UPI app, complete payment, and email screenshot to algotraders.site@zohomail.in for instant activation.',
      tag: 'Step 2'
    },
    {
      num: '03',
      icon: Download,
      title: 'Download Windows & Android Apps',
      description:
        'Access authorized downloads from your dashboard. Extract the Windows backend ZIP to your PC and install the Android APK.',
      tag: 'Step 3'
    },
    {
      num: '04',
      icon: Wifi,
      title: 'Pair Phone to Local PC Wi-Fi',
      description:
        'Launch the Windows backend to see your local LAN IP (e.g., 192.168.1.145:8000). Enter this into the mobile app to pair securely.',
      tag: 'Step 4'
    },
    {
      num: '05',
      icon: SlidersHorizontal,
      title: 'Configure Quotex Bot Parameters',
      description:
        'Set your binary options expiration timeframe, minimum payout cutoff (e.g. 80%), and daily maximum loss percentage limits.',
      tag: 'Step 5'
    },
    {
      num: '06',
      icon: PlayCircle,
      title: 'Start in Practice Account Mode',
      description:
        'Execute algorithmic trades in a simulated broker environment. Verify performance and comfort before switching to real capital.',
      tag: 'Step 6'
    }
  ];

  return (
    <section className="py-24 relative bg-[#060913]" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Rapid 5-Minute Setup
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How QBot2 Trading Works
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            Follow our streamlined onboarding sequence to have your algorithmic strategy running on your PC and monitored on your phone in minutes.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 relative group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black font-mono text-slate-600 group-hover:text-cyan-400 transition-colors">
                    {step.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Callout Card */}
        <div className="mt-14 rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0c1222] border border-cyan-500/30 shadow-2xl">
          <div>
            <div className="text-xs uppercase font-mono font-bold text-cyan-400">
              Zero Cloud Key Storage
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Your broker passwords never leave your PC
            </h3>
            <p className="text-xs text-slate-300 mt-2 max-w-xl">
              Unlike cloud-hosted trading bots that require you to upload your sensitive broker API credentials to remote third-party servers, QBot2 keeps all execution and authentication strictly on your own hardware.
            </p>
          </div>
          <button
            onClick={onGetStarted}
            className="shrink-0 px-6 py-3 rounded-xl font-bold text-xs bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
