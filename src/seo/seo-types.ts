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
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

export interface SEOPageData {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  badge: string;
  category: 'core' | 'support' | 'comparison' | 'guide' | 'technical' | 'trust';
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
  lastModified?: string;
}

export const SITE_BRAND = 'AlgoTraders';
export const SITE_URL = 'https://algotraders.site';
