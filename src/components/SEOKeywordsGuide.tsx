import React, { useState } from 'react';
import { BookOpen, Search, ChevronRight, TrendingUp, ShieldCheck, Cpu, Smartphone, HelpCircle, CheckCircle2 } from 'lucide-react';

interface TopicItem {
  id: string;
  keyword: string;
  title: string;
  category: string;
  summary: string;
  details: string[];
}

const seoTopics: TopicItem[] = [
  {
    id: 'quotex-algo-trading-bot',
    keyword: 'Quotex Trading Bot & Automated Execution',
    title: 'How QBot2 Automates Quotex Binary Options with Millisecond Precision',
    category: 'Algorithmic Execution',
    summary:
      'QBot2 operates as an institutional-grade algorithmic execution engine engineered specifically for Quotex binary options traders. It connects directly to live market feeds via ultra-low latency WebSockets.',
    details: [
      'Executes 1-minute (M1) and 5-minute (M5) candlestick signals without manual human reaction delays.',
      'Eliminates browser DOM click latency by communicating straight through Quotex binary options endpoints.',
      'Operates 24/7 during standard Forex market hours and weekend OTC (Over-The-Counter) sessions.'
    ]
  },
  {
    id: 'quotex-otc-algorithm',
    keyword: 'Quotex OTC Market Algorithm',
    title: 'Automated Strategies for Quotex OTC Currency Pairs and Crypto Assets',
    category: 'OTC Strategy',
    summary:
      'Quotex Over-The-Counter (OTC) assets offer continuous trading opportunities even during weekend market closures. QBot2 implements mathematical momentum filters designed for OTC volatility.',
    details: [
      'Proprietary ATR (Average True Range) volatility scoring prevents false breakout entries in choppy OTC periods.',
      'Automated payout rate filters safeguard capital by executing only on assets offering >80% return payout.',
      'Dynamic candlestick trend confirmation ensures high probability In-The-Money (ITM) expiry rates.'
    ]
  },
  {
    id: 'windows-android-architecture',
    keyword: 'Windows PC Daemon & Android Companion APK',
    title: 'Why Local Windows Execution with Android Mobile Pairing Outperforms Cloud Bots',
    category: 'Architecture',
    summary:
      'Cloud-based bots create major security risks by requiring users to share private broker credentials. QBot2 solves this with a 100% local PC execution architecture paired with an Android companion app.',
    details: [
      'Broker API keys and session tokens remain strictly encrypted on your local Windows PC (ports 8000/LAN).',
      'Android companion APK connects over local Wi-Fi to display real-time candlestick charts, PnL, and win rates.',
      'Instant one-tap emergency stop and pause controls directly from your smartphone.'
    ]
  },
  {
    id: 'binary-options-risk-management',
    keyword: 'Binary Options Risk Management & Martingale Controls',
    title: 'Automated Capital Protection: Stop-Loss Caps, Drawdown Limits & Safe Compounding',
    category: 'Risk Management',
    summary:
      'Uncontrolled Martingale is the number one reason retail traders suffer account drawdowns. QBot2 incorporates multi-layered algorithmic risk boundaries.',
    details: [
      'Configurable Martingale multiplier with hard maximum step limits (e.g. max 2-3 recovery steps).',
      'Daily cumulative drawdown circuit breakers that automatically halt trading when daily loss limits are reached.',
      'Support for both Fixed Stake sizing and progressive compounding based on account equity growth.'
    ]
  },
  {
    id: 'practice-vs-real-account',
    keyword: 'Quotex Practice Account Automation',
    title: 'Risk-Free Algorithm Backtesting and Practice Mode Execution',
    category: 'Backtesting & Practice',
    summary:
      'Test your binary options strategies thoroughly before risking real capital. QBot2 offers native 1-click toggling between Quotex Demo and Real accounts.',
    details: [
      'Verify indicator parameters, execution speed, and win-rate statistics using $10,000 virtual balance.',
      'Seamlessly switch to live capital with unchanged risk configurations once consistency is confirmed.',
      'Detailed trade logs with millisecond timestamps for comprehensive performance audits.'
    ]
  }
];

export const SEOKeywordsGuide: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string>(seoTopics[0].id);

  const currentTopic = seoTopics.find((t) => t.id === selectedTopic) || seoTopics[0];

  return (
    <section
      id="algo-knowledge-base"
      className="py-20 relative bg-[#050811] border-t border-slate-800/80"
      aria-label="Quotex Algorithmic Trading Knowledge Base & SEO Keywords Guide"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Semantic H2 & Subheading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-3">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ALGORITHMIC TRADING KNOWLEDGE BASE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Quotex Trading Bot & Binary Options Guide
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Essential concepts, technical architecture, and risk management strategies for automated binary options execution on Quotex.
          </p>
        </div>

        {/* 2-Column Interactive Knowledge Navigator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Topic List (Keywords) */}
          <div className="lg:col-span-5 space-y-3">
            {seoTopics.map((topic) => {
              const isSelected = topic.id === selectedTopic;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#0b1328] border-cyan-500/60 shadow-lg shadow-cyan-950/40 text-white'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-slate-800/90 text-cyan-400 block w-fit mb-1.5">
                      {topic.category}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold leading-snug">
                      {topic.keyword}
                    </h3>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-600'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Guide Card */}
          <div className="lg:col-span-7 bg-[#090f20] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-2">
              <span className="px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 uppercase font-bold text-[10px]">
                {currentTopic.category}
              </span>
              <span>• Complete Overview</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-4">
              {currentTopic.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 pb-6 border-b border-slate-800/80">
              {currentTopic.summary}
            </p>

            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Key Algorithmic Advantages</span>
            </h4>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              {currentTopic.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{detail}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Verified Quotex Compatible Software</span>
              </div>
              <a
                href="#pricing"
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                <span>View Monthly & Annual Plans</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
