import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Wifi,
  Smartphone,
  Monitor,
  ArrowRight,
  Play,
  CheckCircle2,
  Activity,
  Zap,
  Sliders,
  RefreshCw,
  Clock
} from 'lucide-react';

interface HeroSectionProps {
  onStartTrial: () => void;
  onSeeHowItWorks: () => void;
  onOpenDashboard: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartTrial,
  onSeeHowItWorks,
  onOpenDashboard
}) => {
  // Live ticker animation simulation in hero preview
  const [eurUsdPrice, setEurUsdPrice] = useState(1.0844);
  const [signalState, setSignalState] = useState<'BUY' | 'WAITING' | 'SELL'>('BUY');
  const [activeTab, setActiveTab] = useState<'both' | 'pc' | 'phone'>('both');
  const [pnl, setPnl] = useState(184.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setEurUsdPrice((prev) => {
        const delta = (Math.random() - 0.48) * 0.0006;
        const newPrice = Number((prev + delta).toFixed(4));
        if (newPrice > 1.0865) setSignalState('BUY');
        else if (newPrice < 1.0825) setSignalState('SELL');
        return newPrice;
      });
      setPnl((prev) => Number((prev + (Math.random() - 0.45) * 1.8).toFixed(2)));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden" id="hero-section">
      {/* Ambient background glow and floating gradient spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-semibold text-cyan-300 mb-6 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>QBot2 Trading System v2.4 Release</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Windows & Android Local Wi-Fi Sync</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Automate Your Trading.{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Monitor Everything
            </span>{' '}
            From Your Phone.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed">
            QBot2 Trading runs high-precision Supertrend algorithms natively on your Windows PC and connects seamlessly to your Android mobile app over local Wi-Fi. Retain full control of your execution and capital.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartTrial}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-slate-950 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              id="hero-primary-start-trial-btn"
            >
              <span>Start 7-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onSeeHowItWorks}
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-sm bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="hero-secondary-how-it-works-btn"
            >
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Practice Account Support</div>
                <div className="text-[11px] text-slate-400">Test risk-free before live deployment</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Real-Time Monitoring</div>
                <div className="text-[11px] text-slate-400">Sub-second local socket updates</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Local PC Execution</div>
                <div className="text-[11px] text-slate-400">Credentials stay on your computer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Animated Interactive Product Showcase: Windows PC Bot + Android Phone */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-700/80 shadow-2xl relative overflow-hidden">
            {/* Header bar of visual showcase */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  qbot2_live_environment :: 192.168.1.145:8000 (Local Wi-Fi Mesh)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                  <Wifi className="w-3 h-3 animate-pulse" />
                  Synced (4ms)
                </span>
                <span className="text-xs text-cyan-300 font-mono px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                  Supertrend Active
                </span>
              </div>
            </div>

            {/* Split layout: Left Windows Engine + Right Mobile Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Windows PC FastAPI Engine Terminal & Execution */}
              <div className="lg:col-span-7 bg-[#0b101d] rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-3 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-slate-200">Windows Backend Service (FastAPI)</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400">PID 8942 • Port 8000</span>
                  </div>

                  {/* Metrics strip */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 uppercase">Daily P&L</div>
                      <div className={`text-base font-bold font-mono ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pnl >= 0 ? `+$${pnl}` : `-$${Math.abs(pnl)}`}
                      </div>
                    </div>
                    <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 uppercase">EUR/USD Live</div>
                      <div className="text-base font-bold font-mono text-cyan-300">{eurUsdPrice}</div>
                    </div>
                    <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 uppercase">Signal</div>
                      <div className="text-base font-bold font-mono text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {signalState}
                      </div>
                    </div>
                  </div>

                  {/* Terminal Log Stream */}
                  <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-300 space-y-1.5 border border-slate-900">
                    <div className="text-slate-500">
                      [10:14:02.112] QBot2 Core initialized. Cloud licensing verified (Plan: Monthly Active).
                    </div>
                    <div className="text-cyan-400">
                      [10:14:02.890] Local WebSocket Server listening on ws://0.0.0.0:8000/ws
                    </div>
                    <div className="text-emerald-400">
                      [10:14:03.421] Android Client paired: Galaxy S24 Ultra (192.168.1.189)
                    </div>
                    <div className="text-slate-400">
                      [10:14:05.109] Supertrend ATR(10, 3.0) computed on 1-min candles. Signal: BULLISH
                    </div>
                    <div className="text-purple-300">
                      [10:14:15.004] Executed order TRD-8821: BUY EUR/USD @ {eurUsdPrice} (Practice Account)
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    License: Active Entitlement (Verified)
                  </span>
                  <span className="text-[11px] font-mono">Heartbeat: 1s ago</span>
                </div>
              </div>

              {/* Right: Android Companion Mobile App Simulation */}
              <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 to-[#0c1222] rounded-xl p-4 border border-slate-700/60 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Android Mobile Companion</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300">
                      Wi-Fi Direct
                    </span>
                  </div>

                  {/* Phone Header Mockup */}
                  <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] text-slate-400">Active Trading Session</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        RUNNING
                      </span>
                    </div>
                    <div className="text-xl font-black text-white font-mono flex items-baseline gap-2">
                      <span>EUR/USD</span>
                      <span className="text-xs text-emerald-400">Supertrend Bullish</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Target Payout: &gt;82% • Risk Limit: $15.00/trade
                    </div>
                  </div>

                  {/* Simulated Candle/Indicator Chart */}
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 mb-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>1M Supertrend Overlay</span>
                      <span className="text-cyan-400 font-mono">ATR Multiplier 3.0</span>
                    </div>
                    <div className="h-16 flex items-end justify-between gap-1 pt-2">
                      {[40, 55, 45, 60, 50, 75, 70, 85, 80, 95].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className={`w-full rounded-t transition-all duration-500 ${
                              idx > 5 ? 'bg-emerald-500/80' : 'bg-cyan-500/80'
                            }`}
                            style={{ height: `${val}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[10px] font-mono text-emerald-400">
                        ↑ Signal Flip Detected: Long Position Maintained
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Pause / Emergency Stop controls on mobile */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => alert('Mobile command transmitted: Pause execution sent to local Windows PC.')}
                    className="py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition-colors"
                  >
                    Pause Bot
                  </button>
                  <button
                    onClick={() => alert('Emergency Stop command sent to Windows Backend.')}
                    className="py-2 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-center transition-colors"
                  >
                    Emergency Stop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
