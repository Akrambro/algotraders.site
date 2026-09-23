import React, { useEffect } from 'react';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'product';
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const defaultKeywords = [
  'quotex trading bot',
  'quotex algo bot',
  'automated quotex trading',
  'binary options bot',
  'quotex auto trade bot',
  'quotex trading bot download apk',
  'quotex bot for windows 11',
  'binary options automated trading software',
  'quotex 1 minute candlestick strategy bot',
  'quotex otc algorithm robot',
  'low latency quotex websocket bot',
  'quotex trading bot india',
  'binary options risk management software'
];

export const SEOHead: React.FC<SEOConfig> = ({
  title,
  description,
  keywords = defaultKeywords,
  canonicalPath = '',
  ogType = 'website',
  jsonLd
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const siteBrand = 'Algo Trders.site';
    const fullTitle = title.includes(siteBrand) ? title : `${title} | ${siteBrand}`;
    document.title = fullTitle;

    // Helper to set or create a meta tag
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, contentValue: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', contentValue);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords.join(', '));
    setMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    // 3. Canonical Link
    const baseUrl = 'https://algotraders.site';
    const canonicalUrl = `${baseUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // 4. OpenGraph Social Cards
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', siteBrand);
    setMetaTag('property', 'og:image', `${baseUrl}/assets/og-preview.png`);

    // 5. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', `${baseUrl}/assets/og-preview.png`);

    // 6. Dynamic JSON-LD Structured Data
    if (jsonLd) {
      let scriptTag = document.getElementById('dynamic-page-jsonld') as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-page-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      const schemaData = Array.isArray(jsonLd)
        ? {
            '@context': 'https://schema.org',
            '@graph': jsonLd
          }
        : {
            '@context': 'https://schema.org',
            ...jsonLd
          };
      scriptTag.textContent = JSON.stringify(schemaData, null, 2);
    }

    return () => {
      // Clean up dynamic script tag if needed
      const scriptTag = document.getElementById('dynamic-page-jsonld');
      if (scriptTag) {
        scriptTag.remove();
      }
    };
  }, [title, description, keywords, canonicalPath, ogType, jsonLd]);

  return null;
};
