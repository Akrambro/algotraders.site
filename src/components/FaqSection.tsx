import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the Windows PC backend connect to my Android phone?',
      a: 'QBot2 creates a lightweight, high-performance WebSocket server on your Windows PC (port 8000). As long as your Android phone is connected to the same local Wi-Fi router, the mobile app connects directly to your PC’s local IP address (e.g. 192.168.1.145:8000). Your data stays strictly on your local network.'
    },
    {
      q: 'Does QBot2 require my broker passwords to be uploaded to the cloud?',
      a: 'Absolutely not. This is a core architectural advantage of QBot2. Your broker API credentials and trading tokens are stored strictly encrypted on your local Windows PC. The cloud server (Algo Trders.site) only handles subscription licensing, entitlement verification, and device pairing.'
    },
    {
      q: 'Can I test the algorithm without risking real money?',
      a: 'Yes! QBot2 has native Practice Account support. You can test the Supertrend strategy, adjust ATR multipliers, and verify trade fills with 100% virtual capital before deploying to live accounts.'
    },
    {
      q: 'What are the system requirements for the Windows PC?',
      a: 'Windows 10 or Windows 11 (64-bit), 4 GB RAM, and a stable broadband internet connection. The application is lightweight and runs in the background with minimal CPU usage.'
    },
    {
      q: 'What happens if my internet disconnects during trading?',
      a: 'QBot2 includes a 12-hour offline grace period for subscription entitlement. In addition, all orders placed by the bot are automatically submitted with hard broker-side stop-loss orders to protect your capital in case of an unexpected connectivity failure.'
    },
    {
      q: 'How do I cancel my subscription?',
      a: 'You can cancel your subscription at any time with a single click from the Customer Dashboard. Once canceled, your access remains active until the end of your prepaid billing period, and no further charges will be billed.'
    }
  ];

  return (
    <section className="py-24 relative bg-[#070b16] border-t border-slate-800/80" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Frequently Asked Questions
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything You Need to Know About QBot2
          </h2>
          <p className="mt-4 text-slate-300 text-base">
            Have questions about pairing, security, or subscription management? Find clear answers below.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-white flex items-center gap-3">
                    <span className="text-cyan-400 font-mono text-xs">Q{idx + 1}.</span>
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
