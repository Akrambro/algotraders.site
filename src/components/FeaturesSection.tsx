import React from 'react';
import {
  TrendingUp,
  Smartphone,
  ShieldCheck,
  Sliders,
  BarChart3,
  HardDrive,
  Power,
  Filter,
  Check
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Supertrend Strategy Engine',
      description:
        'Proven algorithmic logic based on Average True Range (ATR). Automatically calculates volatility bands, identifies trend shifts, and executes entries without emotion.',
      badge: 'Core Algorithm',
      color: 'cyan'
    },
    {
      icon: Smartphone,
      title: 'Real-Time Mobile Monitoring',
      description:
        'Connect your Android device to the PC backend over local Wi-Fi. View open positions, candle charts, active indicators, and real-time execution heartbeats from anywhere in your home or office.',
      badge: 'Android v2.1',
      color: 'blue'
    },
    {
      icon: ShieldCheck,
      title: 'Practice & Real Account Support',
      description:
        'Switch between virtual simulated practice environments and live brokerage accounts seamlessly. Master your settings with simulated capital before committing real financial resources.',
      badge: 'Risk-Free Testing',
      color: 'purple'
    },
    {
      icon: Sliders,
      title: 'Configurable Risk Limits',
      description:
        'Set strict stop-loss caps, daily drawdown limits, maximum consecutive losses, and position sizing rules. The bot automatically shuts down when daily limits are triggered.',
      badge: 'Capital Protection',
      color: 'emerald'
    },
    {
      icon: BarChart3,
      title: 'Trade History & Daily P&L',
      description:
        'Detailed logs of every order, fill price, execution timestamp, and net daily returns. Export audit logs to CSV or JSON for in-depth performance analysis.',
      badge: 'Full Transparency',
      color: 'amber'
    },
    {
      icon: HardDrive,
      title: '100% Local PC Execution',
      description:
        'All broker API keys, trading tokens, and execution logic remain exclusively on your Windows PC. No third party or cloud server ever accesses your broker account credentials.',
      badge: 'Privacy & Security',
      color: 'cyan'
    },
    {
      icon: Power,
      title: 'Instant Start/Stop Controls',
      description:
        'Execute immediate emergency halts or scheduled pauses directly from either the Windows terminal or your Android smartphone with a single tap.',
      badge: 'Complete Control',
      color: 'rose'
    },
    {
      icon: Filter,
      title: 'Asset & Payout Filtering',
      description:
        'Filter currency pairs and assets by minimum payout percentage thresholds (e.g. only trade pairs with >80% payout). Avoid high-spread or illiquid market sessions automatically.',
      badge: 'Smart Execution',
      color: 'blue'
    }
  ];

  return (
    <section className="py-24 relative border-t border-slate-800/80 bg-[#070b16]" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Engineered For Precision
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Institutional-Grade Architecture for Independent Traders
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            QBot2 combines local low-latency execution with mobile convenience. Every feature is designed to protect your capital and eliminate manual trading friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-slate-300 font-mono">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fully integrated into QBot2</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
