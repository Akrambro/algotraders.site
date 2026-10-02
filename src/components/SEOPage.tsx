import React, { useState } from 'react';
import {
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { SEOPageData, SITE_BRAND } from '../seo/seo-data.ts';
import { SEOHead } from './SEOHead.tsx';

interface SEOPageProps {
  pageData: SEOPageData;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onNavigate: (path: string) => void;
}

export const SEOPage: React.FC<SEOPageProps> = ({ pageData, onOpenAuth, onNavigate }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <article className="min-h-screen bg-[#060913] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Client-side dynamic metadata for SPA navigation */}
      <SEOHead
        title={pageData.title}
        description={pageData.description}
        canonicalPath={pageData.path}
        schemaType={pageData.schemaType}
        pageData={pageData}
      />

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-400">
          <ol className="flex items-center flex-wrap gap-2">
            {pageData.breadcrumbs.map((crumb, idx) => (
              <li key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                {idx === pageData.breadcrumbs.length - 1 ? (
                  <span className="text-cyan-400 font-medium" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <a
                    href="/"
                    onClick={(e) => handleLinkClick(e, '/')}
                    className="hover:text-white transition-colors"
                  >
                    {crumb.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pageData.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {pageData.h1}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            {pageData.leadParagraph}
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Get QBot2 Software License</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/quotex-bot-pricing')}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-200 transition-all cursor-pointer"
            >
              View Pricing & Plans
            </button>
          </div>
        </header>

        {/* Third-Party & Independent Non-Affiliation Disclosure */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px] font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Independent Software & Broker Platform Notice</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            <strong className="text-slate-200">{SITE_BRAND}</strong> is an independent software tool developer. We are not affiliated with, endorsed by, sponsored by, or connected to Quotex, Awesome Ltd, or any binary options broker. Quotex’s published Rules of Trading Operations state that using automated mechanisms or specialized software without direct client participation is prohibited and can trigger automatic violation detection. Traders must independently evaluate broker agreements and assume all trading risk.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10">
          {pageData.sections.map((section, idx) => (
            <section
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-[#090f20] border border-slate-800/90 shadow-xl space-y-5"
            >
              <div>
                {section.subheading && (
                  <span className="text-xs uppercase font-mono font-bold text-cyan-400 tracking-wider block mb-1">
                    {section.subheading}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {section.heading}
                </h2>
              </div>

              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>

              {section.tableData && (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 my-4">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-cyan-300 font-mono">
                        {section.tableData.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-3 sm:p-4 font-semibold whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {section.tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 sm:p-4 align-top font-medium">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <div className="pt-2">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {section.bulletPoints.map((bp, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.callout && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs sm:text-sm text-cyan-200">
                  {section.callout}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Frequently Asked Questions Accordion */}
        {pageData.faqs.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {pageData.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:text-cyan-300 transition-colors cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-cyan-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Internal Links & Related Resources */}
        {pageData.relatedPages.length > 0 && (
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-cyan-900/40 space-y-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Related Algorithmic Trading Topics
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pageData.relatedPages.map((related, idx) => (
                <a
                  key={idx}
                  href={related.path}
                  onClick={(e) => handleLinkClick(e, related.path)}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all group block"
                >
                  <h4 className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors flex items-center justify-between">
                    <span>{related.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                    {related.description}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Statutory Risk Warning */}
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Statutory Financial Risk Disclosure</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            Binary options trading carries a high degree of financial risk and can result in the total loss of invested capital. Algorithmic software assists with automated rule execution but cannot eliminate market risk or guarantee profitability. Never trade with money you cannot afford to lose. Always backtest strategies thoroughly in practice mode before executing live trades.
          </p>
        </div>
      </div>
    </article>
  );
};
