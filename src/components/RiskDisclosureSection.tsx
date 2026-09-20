import React from 'react';
import { AlertTriangle, ShieldAlert, FileText } from 'lucide-react';

interface RiskDisclosureSectionProps {
  onOpenFullDisclosure: () => void;
}

export const RiskDisclosureSection: React.FC<RiskDisclosureSectionProps> = ({
  onOpenFullDisclosure
}) => {
  return (
    <section className="py-16 relative bg-[#050811] border-y border-amber-500/20" id="risk-disclosure">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl p-6 sm:p-8 bg-amber-950/20 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold text-amber-400">
                  Mandatory Regulatory Notice
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">High Risk Investment Warning</span>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">
                Important Risk Disclosure & Disclaimer
              </h3>

              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p>
                  <strong>Algorithmic Trading Involves Substantial Financial Risk:</strong> Trading foreign exchange (Forex), commodities, indices, and financial derivatives carries a high degree of risk and is not suitable for all investors. You may sustain a total loss of your initial investment or deposit. Never trade with capital you cannot afford to lose.
                </p>
                <p>
                  <strong>No Guarantee of Profit:</strong> Neither Algo Trders.site nor the QBot2 software provides investment advice, financial planning, or guaranteed returns. <em>Past algorithmic backtest performance and historical trade statistics do not guarantee or predict future results.</em> Market conditions, slippage, latency, spread widening, and unexpected liquidity shocks can adversely affect algorithm execution.
                </p>
                <p>
                  <strong>Practice Account Mandate:</strong> We strongly advise all customers to thoroughly test software configurations, Supertrend multipliers, and risk constraints in a simulated practice environment prior to committing actual financial resources.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={onOpenFullDisclosure}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Read Full Statutory Risk & Legal Terms</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
