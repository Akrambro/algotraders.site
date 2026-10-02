import { SEOPageData, SITE_URL, SITE_BRAND } from '../seo-types.ts';

export const trustPages: Record<string, SEOPageData> = {
  '/about': {
    slug: 'about',
    path: '/about',
    title: 'About AlgoTraders | Team, Mission & Philosophy – AlgoTraders',
    description: 'Learn about AlgoTraders and the engineering team behind QBot2. Our product philosophy: Local execution, credential privacy, and disciplined risk limits.',
    h1: 'About AlgoTraders & The QBot2 Engineering Philosophy',
    badge: 'ABOUT ALGOTRADERS',
    category: 'trust',
    leadParagraph: 'AlgoTraders was founded to bring software engineering discipline, credential security, and transparent risk management to binary options automation. Discover our origin, our engineering team, and our development principles.',
    schemaType: 'Article',
    breadcrumbs: [
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'About AlgoTraders', url: `${SITE_URL}/about` }
    ],
    sections: [
      {
        heading: 'Our Origin: Addressing the Flaws of the Bot Market',
        subheading: 'Why we built an independent desktop daemon',
        paragraphs: [
          'For years, the retail binary options automation market has been dominated by questionable practices: chrome extensions scraping website buttons, cloud bots requesting user passwords, unmaintained Telegram scripts, and affiliate schemes designed to churn client balances.',
          'We built AlgoTraders QBot2 on fundamentally different engineering principles: 100% local execution on your Windows PC, zero credential transmission to cloud servers, hardware-bound cryptographic licensing, and mandatory risk controls built directly into the core engine.'
        ],
        bulletPoints: [
          'Zero-Knowledge Security: Your broker credentials and session tokens never leave your personal computer',
          'Independent Tooling: We operate on a transparent software license model, not broker affiliate loss-sharing',
          'Engineering Discipline: High-performance compiled daemons rather than fragile browser click scripts',
          'Honest Disclosures: Clear platform disclosures regarding Quotex rules and realistic risk expectations'
        ]
      },
      {
        heading: 'Our Engineering Principles',
        subheading: 'Core pillars guiding our software roadmap',
        paragraphs: [
          '1. Security First: Never compromise user privacy or credential custody.',
          '2. Risk Engine Primacy: The risk engine always maintains veto power over indicator signals.',
          '3. Empirical Testing: We provide practice-mode parity so users can verify strategies risk-free on demo balances.',
          '4. Continuous Improvement: Regular version updates, transparent changelogs, and responsive support.'
        ]
      },
      {
        heading: 'Contact & Support Information',
        subheading: 'Direct access to the development team',
        paragraphs: [
          'For technical inquiries, software support, or license reassignments, our support desk is available via email at algotraders.site@zohomail.in or through your customer dashboard.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Is AlgoTraders affiliated with Quotex or Awesome Ltd?',
        answer: 'No. AlgoTraders is an independent software tool provider. We are not endorsed, sponsored, or affiliated with Quotex or any broker. Users are responsible for evaluating broker agreements and market risks.'
      },
      {
        question: 'Where is AlgoTraders software hosted and maintained?',
        answer: 'Our web portal and cryptographic licensing API operate on secure cloud infrastructure in Asia-Southeast1. The QBot2 execution engine runs locally on the customer’s personal Windows computer.'
      }
    ],
    relatedPages: [
      { title: 'Software Changelog', path: '/changelog', description: 'Review software releases and updates.' },
      { title: 'QBot2 Architecture', path: '/technical/qbot2-architecture', description: 'Technical blueprints and design.' },
      { title: 'Pricing & Licensing', path: '/quotex-bot-pricing', description: 'Transparent license plans.' }
    ]
  },

  '/changelog': {
    slug: 'changelog',
    path: '/changelog',
    title: 'QBot2 Software Changelog & Version History | AlgoTraders',
    description: 'Track software updates, bug fixes, performance improvements, and release notes for AlgoTraders QBot2. Verified version history from v2.0.0 to v2.5.0.',
    h1: 'AlgoTraders QBot2 Version Changelog & Release Notes',
    badge: 'RELEASE HISTORY',
    category: 'trust',
    leadParagraph: 'Review verified release notes, performance upgrades, bug fixes, and system improvements across all versions of the AlgoTraders QBot2 Windows execution daemon and Android companion app.',
    schemaType: 'Article',
    breadcrumbs: [
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Software Changelog', url: `${SITE_URL}/changelog` }
    ],
    sections: [
      {
        heading: 'Version 2.5.0 (Current Production Release)',
        subheading: 'Released: October 2026',
        paragraphs: [
          'Version 2.5.0 introduces major enhancements to OTC market volatility smoothing, local LAN Android pairing reliability, and hardware cryptographic licensing.'
        ],
        bulletPoints: [
          'Enhanced OTC Volatility Filter: Added dynamic ATR threshold envelope to smooth weekend OTC price feeds',
          'Android Companion Protocol v2: Reduced LAN telemetry packet size by 40% and improved reconnection stability',
          'Cryptographic License Refresh: Integrated asymmetric RSA signature verification with local bundled public key',
          'Consecutive Loss Circuit Breaker: Added customizable consecutive loss stop counters directly in the main GUI',
          'Bug Fix: Resolved an intermittent socket reconnect delay during network adapter switching on Windows 11'
        ]
      },
      {
        heading: 'Version 2.4.2',
        subheading: 'Released: August 2026',
        paragraphs: [
          'Focused on memory optimization and multi-pair scanning efficiency on low-spec hardware.'
        ],
        bulletPoints: [
          'Memory Management: Implemented circular tick buffers keeping RAM footprint strictly under 150MB',
          'Payout Rate Guardrail: Added automatic trade rejection if broker payout falls below user-configured floor',
          'SQLite State Store: Migrated local logging to embedded SQLite for instant query performance',
          'Bug Fix: Fixed candle-open synchronization drift on PCs with un-synced system clocks via NTP offset correction'
        ]
      },
      {
        heading: 'Version 2.3.0',
        subheading: 'Released: June 2026',
        paragraphs: [
          'Initial launch of the two-tier architecture separating Windows background execution from Android companion monitoring.'
        ],
        bulletPoints: [
          'Initial Windows 64-bit native execution daemon release for Windows 10 and 11',
          'Initial Android companion APK with real-time trade telemetry and emergency stop trigger',
          'Hardware fingerprint licensing binding software to physical workstation motherboard and CPU'
        ]
      },
      {
        heading: 'Supported Operating Systems & Known Limitations',
        subheading: 'Technical compatibility guide',
        paragraphs: [
          'Supported: Windows 10 (64-bit), Windows 11 (64-bit), Android 8.0+ (Oreo through Android 14).',
          'Known Limitations: Windows PC must remain powered on with active internet during trading sessions. Native macOS/Linux builds are not currently offered (requires Windows VM or VPS).'
        ]
      }
    ],
    faqs: [
      {
        question: 'How do I upgrade to the latest QBot2 release?',
        answer: 'Download the latest ZIP release package from your customer dashboard and extract the files over your existing installation directory. Your license key and configuration settings are preserved.'
      },
      {
        question: 'Are software updates included with my license?',
        answer: 'Yes. All active Monthly and Annual Pro license holders receive free software updates and bug fix releases throughout their active validity period.'
      }
    ],
    relatedPages: [
      { title: 'System Requirements', path: '/quotex-bot-system-requirements', description: 'Recommended PC and Android specs.' },
      { title: 'About AlgoTraders', path: '/about', description: 'Our engineering philosophy and team.' },
      { title: 'Setup Guide', path: '/quotex-bot-guide', description: 'Step-by-step installation instructions.' }
    ]
  }
};
