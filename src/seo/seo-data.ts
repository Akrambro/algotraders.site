export interface FAQItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface RelatedPageLink {
  title: string;
  path: string;
  description: string;
}

export interface SEOContentSection {
  heading: string;
  subheading?: string;
  paragraphs: string[];
  bulletPoints?: string[];
  callout?: string;
}

export interface SEOPageData {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  badge: string;
  leadParagraph: string;
  schemaType: 'SoftwareApplication' | 'Article' | 'FAQPage' | 'WebPage';
  breadcrumbs: BreadcrumbItem[];
  sections: SEOContentSection[];
  faqs: FAQItem[];
  relatedPages: RelatedPageLink[];
  softwareDetails?: {
    version: string;
    operatingSystem: string;
    applicationCategory: string;
  };
}

export const SITE_BRAND = 'AlgoTraders';
export const SITE_URL = 'https://algotraders.site';

export const SEO_PAGES: Record<string, SEOPageData> = {
  '/quotex-trading-bot': {
    slug: 'quotex-trading-bot',
    path: '/quotex-trading-bot',
    title: 'Quotex Trading Bot | Automated Binary Options Software – AlgoTraders',
    description: 'Explore the official AlgoTraders QBot2 software for Quotex binary options. Local Windows execution engine with Android companion monitoring and risk controls.',
    h1: 'Quotex Trading Bot & Binary Options Execution Engine',
    badge: 'AUTOMATED TRADING SOFTWARE',
    leadParagraph: 'AlgoTraders QBot2 delivers an automated execution system designed specifically for binary options traders on the Quotex platform. Operating locally on Windows with millisecond response times, QBot2 automates trade execution while keeping private credentials securely on your own device.',
    schemaType: 'SoftwareApplication',
    softwareDetails: {
      version: '2.5.0',
      operatingSystem: 'Windows 10, Windows 11, Android 8.0+',
      applicationCategory: 'FinanceApplication'
    },
    breadcrumbs: [
      { name: 'Home', url: 'https://algotraders.site/' },
      { name: 'Quotex Trading Bot', url: 'https://algotraders.site/quotex-trading-bot' }
    ],
    sections: [
      {
        heading: 'Architecture Built for Speed and Security',
        subheading: 'Local Daemon vs. Risky Cloud Bots',
        paragraphs: [
          'Many generic binary bots rely on cloud-hosted servers that require you to hand over your broker login credentials and session tokens to unknown third parties. AlgoTraders QBot2 operates on a fundamentally different architecture: 100% local execution on your own Windows PC.',
          'The core execution engine runs as a lightweight local daemon communicating directly with Quotex binary endpoints. This eliminates browser DOM delay and protects your account integrity.'
        ],
        bulletPoints: [
          'Direct WebSocket connectivity for instant order submission',
          'Encrypted local key storage with zero cloud credential sharing',
          'Native Windows daemon supporting 1-minute (M1) and 5-minute (M5) expiries',
          'Pairing with companion Android app for live mobile status checks'
        ]
      },
      {
        heading: 'Multi-Layered Capital Protection & Risk Controls',
        subheading: 'Configurable money management parameters',
        paragraphs: [
          'Binary options trading carries inherent financial risk. Sustainable algorithmic trading requires strict money management guardrails before order dispatching occurs.',
          'QBot2 provides granular parameter controls, allowing you to enforce stop-loss boundaries, fixed or dynamic position sizing, and maximum consecutive trade caps.'
        ],
        bulletPoints: [
          'Daily Drawdown Caps: Automatic session shutdown if your custom loss threshold is triggered',
          'Customizable Sizing: Choose between Fixed Stake amounts or conservative stepped recovery',
          'Consecutive Loss Limits: Halts execution to prevent compounding drawdowns during adverse volatility',
          'Payout Rate Thresholds: Ignores assets offering return payouts below your predefined minimum'
        ]
      }
    ],
    faqs: [
      {
        question: 'How does QBot2 connect to Quotex?',
        answer: 'QBot2 runs as a desktop application on your Windows PC. It establishes a secure connection to Quotex, reading real-time tick feeds and placing algorithmic trades according to your configured strategy parameters.'
      },
      {
        question: 'Do I need to leave my PC turned on while the bot is active?',
        answer: 'Yes, because QBot2 executes locally for maximum speed and security, your Windows computer must remain powered on with an active internet connection during trading sessions.'
      },
      {
        question: 'Can I test the bot on a Quotex practice/demo balance?',
        answer: 'Yes. QBot2 fully supports Quotex practice accounts so you can backtest parameters and observe execution flow before committing real funds.'
      }
    ],
    relatedPages: [
      { title: 'Automated Trading Features', path: '/quotex-auto-trading-bot', description: 'Deep dive into automation rules and timeframes.' },
      { title: 'Technical Trade Analysis', path: '/quotex-trade-analysis', description: 'Indicator signals and algorithmic entry criteria.' },
      { title: 'OTC Market Algorithm', path: '/quotex-otc-trading-bot', description: 'Continuous weekend and OTC currency pair execution.' }
    ]
  },

  '/quotex-auto-trading-bot': {
    slug: 'quotex-auto-trading-bot',
    path: '/quotex-auto-trading-bot',
    title: 'Quotex Auto Trading Bot | Automated Execution Rules – AlgoTraders',
    description: 'Learn how automated binary trading algorithms execute rule-based strategies on Quotex with low latency and automated risk limits.',
    h1: 'Automated Trading Rules & Execution on Quotex',
    badge: 'SYSTEMATIC AUTOMATION',
    leadParagraph: 'Systematic automation removes emotional decision-making from binary options trading. AlgoTraders QBot2 continuously evaluates market conditions and executes trades strictly according to predefined mathematical criteria.',
    schemaType: 'SoftwareApplication',
    softwareDetails: {
      version: '2.5.0',
      operatingSystem: 'Windows 10, Windows 11, Android 8.0+',
      applicationCategory: 'FinanceApplication'
    },
    breadcrumbs: [
      { name: 'Home', url: 'https://algotraders.site/' },
      { name: 'Auto Trading Bot', url: 'https://algotraders.site/quotex-auto-trading-bot' }
    ],
    sections: [
      {
        heading: 'The Power of Rule-Based Systematic Execution',
        subheading: 'Overcoming Human Latency and Psychological Biases',
        paragraphs: [
          'In fast-paced 60-second binary contracts, manual reaction delays often cause entry slippage that turns a winning analysis into a losing expiry. Auto-trading software triggers orders at the exact open of a candlestick candle.',
          'Furthermore, algorithmic execution prevents revenge trading and emotional deviations from your trading plan, ensuring consistent adherence to your rules.'
        ],
        bulletPoints: [
          'Precision candle open execution down to milliseconds',
          'Elimination of emotional impulse trades and over-leveraging',
          'Simultaneous multi-pair scanning across available Quotex assets',
          'Automated session summaries and execution audit logs'
        ]
      }
    ],
    faqs: [
      {
        question: 'Can I set maximum trade limits per session?',
        answer: 'Yes. QBot2 includes configurable session trade counters, daily profit targets, and stop-loss limits that automatically stop trading when targets are met.'
      },
      {
        question: 'Does the auto bot require browser extensions?',
        answer: 'No. QBot2 operates as a standalone desktop executable on Windows and does not rely on fragile browser extensions or screen-scraping plugins.'
      }
    ],
    relatedPages: [
      { title: 'Quotex Trading Bot Overview', path: '/quotex-trading-bot', description: 'Core software architecture and features.' },
      { title: 'Feature Breakdown', path: '/quotex-bot-features', description: 'Detailed look at available indicators and controls.' },
      { title: 'Pricing & Licensing', path: '/quotex-bot-pricing', description: 'Monthly and annual licensing options.' }
    ]
  },

  '/quotex-trade-analysis': {
    slug: 'quotex-trade-analysis',
    path: '/quotex-trade-analysis',
    title: 'Quotex Trade Analysis & Signal Logic | Binary Strategies – AlgoTraders',
    description: 'Understand how technical indicator signals, candlestick momentum, and trend filters combine to generate binary options trading signals on Quotex.',
    h1: 'Quotex Trade Analysis & Algorithmic Signal Logic',
    badge: 'TECHNICAL ANALYSIS & SIGNALS',
    leadParagraph: 'High-probability binary options signals require robust confluence across multiple technical indicators. AlgoTraders QBot2 incorporates multi-timeframe trend filters, RSI momentum oscillators, and volatility bands.',
    schemaType: 'Article',
    breadcrumbs: [
      { name: 'Home', url: 'https://algotraders.site/' },
      { name: 'Trade Analysis', url: 'https://algotraders.site/quotex-trade-analysis' }
    ],
    sections: [
      {
        heading: 'Multi-Indicator Confluence Framework',
        subheading: 'Filtering false breakouts with statistical confirmation',
        paragraphs: [
          'Single-indicator binary strategies frequently generate false signals in choppy market conditions. QBot2 evaluates multiple technical parameters simultaneously before validating an entry signal.',
          'By combining trend direction (EMA/SMA alignment), momentum oscillator readings (RSI/Stochastic), and dynamic support/resistance levels, the algorithm identifies high-conviction setup windows.'
        ],
        bulletPoints: [
          'Moving Average Convergence: Fast and slow EMA crossovers to confirm directional bias',
          'Relative Strength Index (RSI): Dynamic overbought/oversold exhaustion filters',
          'Bollinger Band Mean Reversion: Standard deviation channel boundary detection',
          'Candlestick Price Action: Rejection wicks and engulfing pattern validation'
        ]
      }
    ],
    faqs: [
      {
        question: 'Which timeframes are most reliable for algorithmic analysis?',
        answer: 'QBot2 supports both 1-minute (M1) and 5-minute (M5) timeframes. While M1 provides higher signal frequency, M5 offers smoother trend confirmation and reduced noise.'
      },
      {
        question: 'Can I customize the indicator thresholds in QBot2?',
        answer: 'Yes. All indicator periods, overbought/oversold levels, and filter parameters can be adjusted in the software settings to match your personal strategy.'
      }
    ],
    relatedPages: [
      { title: 'OTC Trading Bot', path: '/quotex-otc-trading-bot', description: 'Analyzing non-standard and weekend OTC market data.' },
      { title: 'Complete Bot Guide', path: '/quotex-bot-guide', description: 'Comprehensive setup and optimization walkthrough.' },
      { title: 'Quotex Trading Bot', path: '/quotex-trading-bot', description: 'Core application download and specifications.' }
    ]
  },

  '/quotex-otc-trading-bot': {
    slug: 'quotex-otc-trading-bot',
    path: '/quotex-otc-trading-bot',
    title: 'Quotex OTC Trading Bot | Weekend Algorithm Software – AlgoTraders',
    description: 'Automate Quotex OTC (Over-The-Counter) currency and commodity pairs with custom momentum filters and payout threshold verification.',
    h1: 'Quotex OTC Trading Bot & Weekend Algorithmic Engine',
    badge: 'OTC MARKET AUTOMATION',
    leadParagraph: 'Quotex Over-The-Counter (OTC) markets provide 24/7 trading availability, including weekends. AlgoTraders QBot2 is optimized to navigate synthetic OTC volatility with specialized ATR smoothing and payout filtering.',
    schemaType: 'SoftwareApplication',
    softwareDetails: {
      version: '2.5.0',
      operatingSystem: 'Windows 10, Windows 11, Android 8.0+',
      applicationCategory: 'FinanceApplication'
    },
    breadcrumbs: [
      { name: 'Home', url: 'https://algotraders.site/' },
      { name: 'OTC Trading Bot', url: 'https://algotraders.site/quotex-otc-trading-bot' }
    ],
    sections: [
      {
        heading: 'Navigating Over-The-Counter Market Dynamics',
        subheading: 'Understanding OTC Price Characteristics',
        paragraphs: [
          'OTC assets on Quotex are algorithmic price feeds operated by the broker outside of standard interbank trading hours. These feeds display unique price micro-structures, sharp momentum shifts, and varying payout percentages.',
          'QBot2 continuously monitors OTC payout rates, ensuring trades are only executed when payouts meet your minimum profitability requirements (e.g. >80%).'
        ],
        bulletPoints: [
          'Continuous 24/7 OTC market evaluation across Forex and Commodities',
          'Automatic payout percentage filter to protect expected value',
          'Adaptive volatility scaling to handle rapid OTC micro-trends',
          'Safe testing environment on demo balances before live execution'
        ]
      }
    ],
    faqs: [
      {
        question: 'Are OTC pairs available on weekends?',
        answer: 'Yes. Quotex OTC currency pairs, cryptocurrencies, and commodities operate 24 hours a day, 7 days a week, allowing weekend algorithmic testing.'
      },
      {
        question: 'Why is the payout rate filter important for OTC trading?',
        answer: 'Broker payouts on OTC pairs can fluctuate. Executing trades when payouts drop below 80% severely hurts long-term mathematical expectancy. QBot2 skips pairs whenever payout drops below your chosen threshold.'
      }
    ],
    relatedPages: [
      { title: 'Core Bot Architecture', path: '/quotex-trading-bot', description: 'Learn how QBot2 executes on Windows PC.' },
      { title: 'Trade Analysis Strategies', path: '/quotex-trade-analysis', description: 'Indicator setups and momentum filters.' },
      { title: 'Bot Pricing Plans', path: '/quotex-bot-pricing', description: 'Transparent monthly and annual license tiers.' }
    ]
  },

  '/quotex-bot-features': {
    slug: 'quotex-bot-features',
    path: '/quotex-bot-features',
    title: 'Quotex Bot Features & Architecture | AlgoTraders QBot2',
    description: 'Detailed feature breakdown of AlgoTraders QBot2: Local Windows daemon, Android pairing, multi-indicator engine, and risk circuit breakers.',
    h1: 'QBot2 Features, Specifications & Technical Architecture',
    badge: 'SOFTWARE CAPABILITIES',
    leadParagraph: 'Explore the complete technical capabilities of the AlgoTraders QBot2 ecosystem. Engineered for speed, security, and user control, every feature is built around risk management and low-latency execution.',
    schemaType: 'SoftwareApplication',
    softwareDetails: {
      version: '2.5.0',
      operatingSystem: 'Windows 10, Windows 11, Android 8.0+',
      applicationCategory: 'FinanceApplication'
    },
    breadcrumbs: [
      { name: 'Home', url: 'https://algotraders.site/' },
      { name: 'Bot Features', url: 'https://algotraders.site/quotex-bot-features' }
    ],
    sections: [
      {
        heading: 'Complete Technical Feature Matrix',
        subheading: 'Built from the ground up for serious algorithmic traders',
        paragraphs: [
          'AlgoTraders QBot2 consists of two synchronized software modules: a high-performance Windows background execution daemon and a companion Android monitoring application.',
          'Here is the complete feature matrix available in the latest version.'
        ],
        bulletPoints: [
          'High-Speed WebSocket Client: Direct broker socket communication without browser UI lag',
          'Android Companion Mobile App: Live trade monitoring, PnL tracking, and emergency stop controls',
          'Multi-Asset Scanning: Scans dozens of standard and OTC pairs simultaneously for trade setups',
          'Flexible Money Management: Fixed stake sizing, stepped Martingale limits, and compound sizing',
          'Hardware-Bound Licensing: Encrypted device-bound license keys for tamper-proof security',
          'Instant 1-Click Demo/Live Switch: Validate strategies on practice balance before live deployment'
        ]
      }
    ],
    faqs: [
      {
        question: 'Which operating systems are supported?',
        answer: 'The QBot2 execution engine runs natively on Windows 10 and Windows 11 (64-bit). The mobile companion app is available for Android 8.0+ devices.'
      },
      {
        question: 'How do the Windows bot and Android app communicate?',
        answer: 'The Android app pairs with your Windows execution backend over encrypted local LAN connection, displaying live updates without exposing your credentials to the cloud.'
      }
    ],
    relatedPages: [
      { title: 'Getting Started Guide', path: '/quotex-bot-guide', description: 'Step-by-step installation and pairing walkthrough.' },
      { title: 'Pricing & Licensing', path: '/quotex-bot-pricing', description: 'Choose your software license plan.' },
      { title: 'Quotex Trading Bot', path: '/quotex-trading-bot', description: 'Software overview and system requirements.' }
    ]
  },

  '/quotex-bot-pricing': {
    slug: 'quotex-bot-pricing',
    path: '/quotex-bot-pricing',
    title: 'Quotex Bot Pricing & Software Licenses – AlgoTraders',
    description: 'Transparent pricing for AlgoTraders QBot2. Access Windows execution software, Android companion app, regular updates, and support.',
    h1: 'Transparent Licensing & Pricing Plans for QBot2',
    badge: 'PRO SOFTWARE LICENSING',
    leadParagraph: 'Gain access to the full AlgoTraders QBot2 software suite with straightforward, transparent pricing. All plans include both the Windows execution engine and Android companion app with complete feature access.',
    schemaType: 'SoftwareApplication',
    softwareDetails: {
      version: '2.5.0',
      operatingSystem: 'Windows 10, Windows 11, Android 8.0+',
      applicationCategory: 'FinanceApplication'
    },
    breadcrumbs: [
      { name: 'Home', url: 'https://algotraders.site/' },
      { name: 'Pricing', url: 'https://algotraders.site/quotex-bot-pricing' }
    ],
    sections: [
      {
        heading: 'Software License Tiers',
        subheading: 'Choose the plan that fits your trading schedule',
        paragraphs: [
          'We offer both Monthly and Annual software license options. Both tiers include unlimited trade execution, all supported indicators, OTC market compatibility, and continuous software updates.',
          'Payment is processed securely via UPI with instant license key issuance and portal activation.'
        ],
        bulletPoints: [
          'Monthly Pro License (₹4,999 / month): Full software access with 30-day validity and standard support',
          'Annual Pro License (₹49,999 / year): Best value with 365-day validity, priority updates, and dedicated support',
          'Both plans include Windows PC backend executable and Android companion app',
          'No hidden commissions or volume fees — you keep 100% of your trading results'
        ]
      }
    ],
    faqs: [
      {
        question: 'Are there any recurring automatic charges?',
        answer: 'No. All licenses are manual renewals. You maintain complete control over your subscription and can choose to renew whenever you wish.'
      },
      {
        question: 'How quickly is my license activated after payment?',
        answer: 'License keys are issued promptly upon payment verification. You will see your active license key and download links directly in your customer dashboard.'
      },
      {
        question: 'Can I move my license to a new PC?',
        answer: 'Yes. If you change your computer or reinstall Windows, simply request a license reassignment from your dashboard or contact our support team.'
      }
    ],
    relatedPages: [
      { title: 'Software Features', path: '/quotex-bot-features', description: 'See everything included with your license.' },
      { title: 'Installation Guide', path: '/quotex-bot-guide', description: 'Learn how to set up QBot2 after purchase.' },
      { title: 'Quotex Trading Bot', path: '/quotex-trading-bot', description: 'Main software overview.' }
    ]
  },

  '/quotex-bot-guide': {
    slug: 'quotex-bot-guide',
    path: '/quotex-bot-guide',
    title: 'Quotex Bot Setup Guide & Documentation | AlgoTraders QBot2',
    description: 'Step-by-step setup guide for AlgoTraders QBot2. Learn how to install the Windows backend, pair the Android app, configure strategies, and test on demo.',
    h1: 'Complete QBot2 Setup, Installation & Configuration Guide',
    badge: 'OFFICIAL DOCUMENTATION',
    leadParagraph: 'Follow this comprehensive guide to install, configure, and optimize AlgoTraders QBot2 on your Windows PC and pair it with your Android mobile device for seamless binary options execution.',
    schemaType: 'Article',
    breadcrumbs: [
      { name: 'Home', url: 'https://algotraders.site/' },
      { name: 'Setup Guide', url: 'https://algotraders.site/quotex-bot-guide' }
    ],
    sections: [
      {
        heading: 'Step 1: System Requirements & Windows Installation',
        subheading: 'Setting up the core execution daemon',
        paragraphs: [
          'Ensure your PC meets the minimum requirements: Windows 10 or Windows 11 (64-bit), at least 4GB of RAM, and a stable broadband internet connection.',
          'Download the QBot2 ZIP package from your customer dashboard, extract all files to a dedicated folder (e.g. C:\\AlgoTraders\\QBot2), and run the setup executable.'
        ],
        bulletPoints: [
          'Extract the ZIP file completely before running the executable',
          'Allow local firewall access on LAN port 8000 when prompted',
          'Launch QBotBackend.exe and enter your seller-issued license key'
        ]
      },
      {
        heading: 'Step 2: Strategy Configuration & Risk Limits',
        subheading: 'Configuring safe parameters before activating live trades',
        paragraphs: [
          'Open the settings panel to configure your asset whitelist, indicator preferences, and money management rules.',
          'Always configure conservative stop-loss limits and test thoroughly on your Quotex Practice account before switching to real capital.'
        ],
        bulletPoints: [
          'Select your target timeframe: 1-minute (M1) or 5-minute (M5)',
          'Set a daily stop-loss cap and maximum consecutive loss counter',
          'Verify that the asset payout filter is set to at least 80%',
          'Run a minimum of 20 practice trades to verify execution flow'
        ]
      },
      {
        heading: 'Step 3: Android Companion App Pairing',
        subheading: 'Monitoring your workstation from your mobile phone',
        paragraphs: [
          'Download and install the QBot2 Android APK on your smartphone. Ensure your phone and Windows PC are connected to the same local Wi-Fi network.',
          'Open the app, scan your desktop dashboard QR code or enter your local PC IP address, and confirm pairing. You can now monitor live trades and trigger emergency stops remotely.'
        ]
      }
    ],
    faqs: [
      {
        question: 'What should I do if the Windows firewall blocks the connection?',
        answer: 'Open Windows Defender Firewall settings and ensure inbound rules permit QBotBackend.exe on your Private Network.'
      },
      {
        question: 'How do I update to the latest software release?',
        answer: 'When a new version is released, download the updated ZIP from your dashboard and replace the executable files in your installation directory.'
      }
    ],
    relatedPages: [
      { title: 'Technical Features', path: '/quotex-bot-features', description: 'Explore full indicator specifications.' },
      { title: 'Pricing & Licensing', path: '/quotex-bot-pricing', description: 'License options and renewal details.' },
      { title: 'Trade Analysis Logic', path: '/quotex-trade-analysis', description: 'Indicator confluence and entry triggers.' }
    ]
  }
};
