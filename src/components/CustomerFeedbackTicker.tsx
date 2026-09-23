import React from 'react';
import { Star, TrendingUp, ShieldCheck, CheckCircle, Sparkles } from 'lucide-react';

interface FeedbackItem {
  id: string;
  name: string;
  location: string;
  winRate: string;
  profit: string;
  plan: string;
  comment: string;
  timeAgo: string;
}

const customerFeedbacks: FeedbackItem[] = [
  {
    id: 'fb-1',
    name: 'Rajesh Sharma',
    location: 'Mumbai, MH',
    winRate: '92.4%',
    profit: '+₹18,450',
    plan: 'Annual Pro',
    comment: 'QBot2 executed 14 consecutive ITM trades on Quotex OTC pairs today. The Android mobile sync is lightning fast!',
    timeAgo: '12m ago'
  },
  {
    id: 'fb-2',
    name: 'Vikram Malhotra',
    location: 'Bengaluru, KA',
    winRate: '89.6%',
    profit: '+₹42,600',
    plan: 'Annual Pro',
    comment: 'Windows background daemon running 24/7 with zero latency. Direct WebSocket integration eliminates broker slippage.',
    timeAgo: '35m ago'
  },
  {
    id: 'fb-3',
    name: 'Ananya Patel',
    location: 'Ahmedabad, GJ',
    winRate: '91.1%',
    profit: '+₹31,200',
    plan: 'Monthly Pro',
    comment: 'Switched to QBot2 algorithm last month. The automated Martingale cap and compounding risk management protected my capital.',
    timeAgo: '1h ago'
  },
  {
    id: 'fb-4',
    name: 'Amit Verma',
    location: 'New Delhi, DL',
    winRate: '94.0%',
    profit: '+₹54,800',
    plan: 'Annual Pro',
    comment: 'Instant license activation via UPI. The 1-minute candlestick signals on EUR/USD OTC are remarkably accurate.',
    timeAgo: '2h ago'
  },
  {
    id: 'fb-5',
    name: 'Pooja Sundaram',
    location: 'Chennai, TN',
    winRate: '88.5%',
    profit: '+₹22,900',
    plan: 'Monthly Pro',
    comment: 'Real-time phone notifications let me monitor positions while at office. Super reliable algorithmic trading suite.',
    timeAgo: '3h ago'
  },
  {
    id: 'fb-6',
    name: 'Rohan Deshmukh',
    location: 'Pune, MH',
    winRate: '93.2%',
    profit: '+₹38,900',
    plan: 'Annual Pro',
    comment: 'The automated OTC strategy on currency pairs has been an absolute game changer for my binary options portfolio.',
    timeAgo: '4h ago'
  },
  {
    id: 'fb-7',
    name: 'Saurabh Gupta',
    location: 'Jaipur, RJ',
    winRate: '90.3%',
    profit: '+₹27,500',
    plan: 'Monthly Pro',
    comment: 'Customer support is super responsive. Hardware pairing between my Windows PC and Android phone took under 2 minutes.',
    timeAgo: '5h ago'
  },
  {
    id: 'fb-8',
    name: 'Priya Nair',
    location: 'Kochi, KL',
    winRate: '89.8%',
    profit: '+₹35,100',
    plan: 'Annual Pro',
    comment: 'Cleanest UI and fastest order execution for Quotex. 100% recommended for serious quantitative binary options traders.',
    timeAgo: '6h ago'
  }
];

export const CustomerFeedbackTicker: React.FC = () => {
  // Duplicate array for seamless infinite marquee loop
  const duplicatedFeedbacks = [...customerFeedbacks, ...customerFeedbacks];

  return (
    <div className="w-full py-6 bg-gradient-to-r from-[#050813] via-[#091024] to-[#050813] border-y border-cyan-500/20 overflow-hidden relative shadow-2xl">
      {/* Ticker Header / Live Badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            Live Customer Feedbacks & Verified Trade PnL
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Real-time telemetry stream from active QBot2 Quotex licenses
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-slate-200 text-xs font-mono font-bold">4.9 / 5.0 Rating</span>
          <span className="text-slate-500 text-[11px]">(1,420+ Indian Traders)</span>
        </div>
      </div>

      {/* Running Marquee Ticker Track */}
      <div className="relative w-full overflow-hidden mask-linear-gradient">
        {/* Left and Right Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#050813] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#050813] to-transparent z-10 pointer-events-none" />

        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-4 py-2">
          {duplicatedFeedbacks.map((fb, idx) => (
            <div
              key={`${fb.id}-${idx}`}
              className="w-[320px] sm:w-[360px] flex-shrink-0 bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-black/40 group cursor-default"
            >
              {/* Header: Name, City & Profit Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                      {fb.name}
                    </span>
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {fb.location} • <span className="text-slate-500">{fb.timeAgo}</span>
                  </span>
                </div>

                {/* Stock Ticker PnL / WinRate Pill */}
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
                    <TrendingUp className="w-3 h-3" />
                    <span>{fb.profit}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono block mt-0.5 font-semibold">
                    {fb.winRate} Win Rate
                  </span>
                </div>
              </div>

              {/* Feedback Quote */}
              <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2 italic">
                "{fb.comment}"
              </p>

              {/* Footer: Plan & Star Rating */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 font-mono font-medium">
                  {fb.plan} License
                </span>
                <div className="flex text-amber-400 items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-slate-400 font-mono ml-1">5.0</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
