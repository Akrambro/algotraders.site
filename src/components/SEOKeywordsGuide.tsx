import React, { useState } from 'react';
import { BookOpen, ChevronRight, CheckCircle2, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

interface TopicItem {
  id: string;
  path: string;
  keyword: string;
  title: string;
  category: string;
  summary: string;
  details: string[];
}

const seoTopics: TopicItem[] = [
  {
    id: 'quotex-trading-bot',
    path: '/quotex-trading-bot',
    keyword: 'Quotex Trading Bot & Execution Engine',
    title: 'How QBot2 Automates Quotex Binary Options with Millisecond Precision',
    category: 'Algorithmic Execution',
    summary:
      'QBot2 operates as an algorithmic execution engine engineered specifically for Quotex binary options traders. It connects directly to live market feeds via ultra-low latency WebSockets.',
    details: [
      'Executes 1-minute (M1) and 5-minute (M5) candlestick signals without manual human reaction delays.',
      'Eliminates browser DOM click latency by communicating directly with binary endpoints.',
      'Runs locally on your Windows PC keeping all credentials and private keys secure.'
    ]
  },
  {
    id: 'quotex-auto-trading-bot',
    path: '/quotex-auto-trading-bot',
    keyword: 'Quotex Auto Trading Rules & Limits',
    title: 'Automated Systematic Rules & Multi-Pair Scanning',
    category: 'Systematic Rules',
    summary:
      'Rule-based execution eliminates emotional bias, revenge trading, and human latency in fast-moving binary options markets.',
    details: [
      'Automated entry execution at the precise opening millisecond of the candlestick candle.',
      'Simultaneous scanning across multiple Forex, crypto, and commodity pairs.',
      'Session trade limits, daily profit targets, and stop-loss circuit breakers.'
    ]
  },
  {
    id: 'quotex-trade-analysis',
    path: '/quotex-trade-analysis',
    keyword: 'Quotex Trade Analysis & Signal Logic',
    title: 'Multi-Indicator Confluence Framework & Trend Verification',
    category: 'Trade Analysis',
    summary:
      'High-probability binary options signals combine trend confirmation, momentum oscillators, and support/resistance validation.',
    details: [
      'Fast & slow EMA crossovers to determine broader trend direction.',
      'RSI momentum oscillator boundaries to avoid exhausted breakout entries.',
      'Bollinger Band mean reversion channel filters.'
    ]
  },
  {
    id: 'quotex-otc-trading-bot',
    path: '/quotex-otc-trading-bot',
    keyword: 'Quotex OTC Market Algorithm',
    title: 'Automated Strategies for Quotex OTC Currency Pairs and Weekend Markets',
    category: 'OTC Strategy',
    summary:
      'Quotex Over-The-Counter (OTC) assets offer 24/7 continuous trading. QBot2 implements adaptive volatility filters and payout thresholds.',
    details: [
      'Payout rate validation filter to safeguard expected value (e.g. minimum 80% payout).',
      'Adaptive ATR volatility scaling tailored to synthetic OTC market micro-trends.',
      'Full demo practice account compatibility for weekend strategy verification.'
    ]
  },
  {
    id: 'quotex-bot-features',
    path: '/quotex-bot-features',
    keyword: 'QBot2 Architecture & Specifications',
    title: 'Windows Local Daemon & Android Mobile Companion Features',
    category: 'Architecture',
    summary:
      'QBot2 pairs a lightweight Windows background daemon with a companion Android app for seamless local execution and mobile monitoring.',
    details: [
      'Encrypted local LAN communication between Windows PC and Android phone.',
      'Hardware-bound license key validation with cryptographic challenge verification.',
      'Instant 1-click toggling between Quotex Demo and Live balance.'
    ]
  },
  {
    id: 'quotex-bot-guide',
    path: '/quotex-bot-guide',
    keyword: 'Setup Guide & Technical Walkthrough',
    title: 'Step-by-Step Installation, Strategy Setup & Pairing Guide',
    category: 'Documentation',
    summary:
      'Complete onboarding documentation for downloading, installing, configuring parameters, and pairing mobile monitoring.',
    details: [
      'Simple extraction and setup on Windows 10 & Windows 11 (64-bit).',
      'Configuring stop-loss caps, stake sizing, and timeframe preferences.',
      'Connecting companion Android APK over local Wi-Fi.'
    ]
  }
];

export const SEOKeywordsGuide: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [selectedTopic, setSelectedTopic] = useState<string>(seoTopics[0].id);

  const currentTopic = seoTopics.find((t) => t.id === selectedTopic) || seoTopics[0];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <section
      id="algo-knowledge-base"
      className="py-20 relative bg-[#050811] border-t border-slate-800/80"
      aria-label="Quotex Algorithmic Trading Knowledge Base & SEO Guides"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-3">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ALGORITHMIC TRADING KNOWLEDGE BASE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Quotex Trading Bot & Binary Options Guides
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Explore dedicated technical blueprints, OTC strategies, and risk management documentation for automated binary options execution.
          </p>
        </div>

        {/* 2-Column Knowledge Navigator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Topic List */}
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
              <span>• Topic Summary</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-4">
              {currentTopic.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 pb-6 border-b border-slate-800/80">
              {currentTopic.summary}
            </p>

            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Core Architectural Highlights</span>
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
                <span>Compatible with Quotex Binary Options</span>
              </div>
              <a
                href={currentTopic.path}
                onClick={(e) => handleLinkClick(e, currentTopic.path)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 text-cyan-300 rounded-xl font-semibold transition-colors"
              >
                <span>Read Full Landing Page Guide</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
