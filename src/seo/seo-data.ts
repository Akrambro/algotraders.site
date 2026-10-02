export * from './seo-types.ts';
import { SEOPageData } from './seo-types.ts';
import { commercialPages } from './pages/commercial.ts';
import { comparisonPages } from './pages/comparisons.ts';
import { guidePages } from './pages/guides.ts';
import { technicalPages } from './pages/technical.ts';
import { trustPages } from './pages/trust.ts';

export { commercialPages } from './pages/commercial.ts';
export { comparisonPages } from './pages/comparisons.ts';
export { guidePages } from './pages/guides.ts';
export { technicalPages } from './pages/technical.ts';
export { trustPages } from './pages/trust.ts';

export const SEO_PAGES: Record<string, SEOPageData> = {
  ...commercialPages,
  ...comparisonPages,
  ...guidePages,
  ...technicalPages,
  ...trustPages
};

export const ALL_SEO_PAGES_LIST: SEOPageData[] = Object.values(SEO_PAGES);

export const CORE_PAGES = ALL_SEO_PAGES_LIST.filter((p) => p.category === 'core');
export const SUPPORT_PAGES = ALL_SEO_PAGES_LIST.filter((p) => p.category === 'support');
export const COMPARISON_PAGES = ALL_SEO_PAGES_LIST.filter((p) => p.category === 'comparison');
export const GUIDE_PAGES = ALL_SEO_PAGES_LIST.filter((p) => p.category === 'guide');
export const TECHNICAL_PAGES = ALL_SEO_PAGES_LIST.filter((p) => p.category === 'technical');
export const TRUST_PAGES = ALL_SEO_PAGES_LIST.filter((p) => p.category === 'trust');
