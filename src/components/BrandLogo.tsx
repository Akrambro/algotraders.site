import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11'
  };

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div
      className={`flex items-center gap-3 select-none ${className}`}
      aria-label="Algo Trders.site - Quotex Trading Bot & Binary Options Algorithms Logo"
    >
      {/* Visual Logo Mark */}
      <div
        className={`relative ${iconSizes[size]} rounded-xl bg-gradient-to-br from-[#0c1e38] via-[#081528] to-[#040a14] border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/15 group-hover:border-cyan-400 group-hover:shadow-cyan-500/25 transition-all duration-300`}
        aria-hidden="true"
      >
        {/* Subtle inner grid pattern glow */}
        <div className="absolute inset-0.5 rounded-[10px] bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/15 pointer-events-none" />

        {/* Dynamic Algorithmic Candlestick & Bot Crest SVG */}
        <svg
          className={`${svgSizes[size]} text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left algorithmic signal bar */}
          <line x1="5" y1="9" x2="5" y2="17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.65" />
          <rect x="3.75" y="11" width="2.5" height="4" rx="0.75" fill="currentColor" opacity="0.8" />

          {/* Center primary surge bar */}
          <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="10.25" y="7" width="3.5" height="8" rx="1" fill="url(#cyanBlueGrad)" stroke="currentColor" strokeWidth="0.75" />

          {/* Right breakout target bar */}
          <line x1="19" y1="3" x2="19" y2="15" stroke="#38bdf8" strokeWidth="1.75" strokeLinecap="round" opacity="0.85" />
          <rect x="17.75" y="5" width="2.5" height="5" rx="0.75" fill="#38bdf8" />

          {/* High-speed execution trend line connecting bars */}
          <path
            d="M5 14L12 9L19 6"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          <defs>
            <linearGradient id="cyanBlueGrad" x1="10.25" y1="7" x2="13.75" y2="15" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d3ee" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <span className={`font-extrabold ${textSizes[size]} tracking-tight text-white font-['Outfit']`}>
          Algo Trders<span className="text-cyan-400">.site</span>
        </span>
      )}
    </div>
  );
};
