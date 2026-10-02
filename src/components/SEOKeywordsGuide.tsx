import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Filter,
  Sparkles,
  Layers,
  Cpu,
  BarChart3,
  ShieldAlert
} from 'lucide-react';
import { ALL_SEO_PAGES_LIST, SEOPageData } from '../seo/seo-data.ts';

type CategoryFilter = 'all' | 'core' | 'support' | 'comparison' | 'guide' | 'technical' | 'trust';

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'all', label: 'All Topics (37)', icon: BookOpen },
  { id: 'core', label: 'Core Software', icon: Sparkles },
  { id: 'comparison', label: 'Bot Comparisons', icon: Layers },
  { id: 'guide', label: 'Trading Strategies', icon: BarChart3 },
  { id: 'technical', label: 'Technical Specs', icon: Cpu },
  { id: 'support', label: 'Setup & Support', icon: CheckCircle2 },
  { id: 'trust', label: 'Trust & Risk', icon: ShieldAlert }
];

export const SEOKeywordsGuide: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedPath, setSelectedPath] = useState<string>('/quotex-trading-bot');

  const filteredPages = useMemo(() => {
    if (activeCategory === 'all') return ALL_SEO_PAGES_LIST;
    return ALL_SEO_PAGES_LIST.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const currentPage: SEOPageData = useMemo(() => {
    const found = ALL_SEO_PAGES_LIST.find((p) => p.path === selectedPath);
    if (found) return found;
    return filteredPages[0] || ALL_SEO_PAGES_LIST[0];
  }, [selectedPath, filteredPages]);

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
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-3">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>ALGORITHMIC TRADING KNOWLEDGE BASE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Quotex Trading Bot & Binary Options Guides
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Explore dedicated technical blueprints, strategy rules, buyer comparisons, and risk management documentation for automated binary options execution.
          </p>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-10">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  const firstInCat = tab.id === 'all'
                    ? ALL_SEO_PAGES_LIST[0]
                    : ALL_SEO_PAGES_LIST.find((p) => p.category === tab.id);
                  if (firstInCat) setSelectedPath(firstInCat.path);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Knowledge Navigator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Topic List (Scrollable) */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredPages.map((page) => {
              const isSelected = page.path === currentPage.path;
              return (
                <button
                  key={page.path}
                  onClick={() => setSelectedPath(page.path)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#0b1328] border-cyan-500/60 shadow-lg shadow-cyan-950/40 text-white'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-900/90'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-slate-800/90 text-cyan-400 inline-block mb-1">
                      {page.badge}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold leading-snug truncate">
                      {page.h1}
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
                {currentPage.badge}
              </span>
              <span>• Research Summary</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-3">
              {currentPage.h1}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 pb-5 border-b border-slate-800/80">
              {currentPage.leadParagraph}
            </p>

            {/* First section highlights */}
            {currentPage.sections[0] && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>{currentPage.sections[0].heading}</span>
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentPage.sections[0].paragraphs[0]}
                </p>

                {currentPage.sections[0].bulletPoints && (
                  <ul className="space-y-2 pt-1 text-xs text-slate-300">
                    {currentPage.sections[0].bulletPoints.slice(0, 3).map((bp, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 text-[9px] font-mono font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{bp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Footer action bar */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Compatible with Quotex Binary Options</span>
              </div>
              <a
                href={currentPage.path}
                onClick={(e) => handleLinkClick(e, currentPage.path)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 text-cyan-300 rounded-xl font-semibold transition-colors"
              >
                <span>Read Full Guide & Specs</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
