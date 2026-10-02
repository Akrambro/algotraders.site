import React, { useEffect } from 'react';
import { SEOPageData, SITE_BRAND, SITE_URL } from '../seo/seo-data.ts';

export interface SEOConfig {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'product';
  noindex?: boolean;
  schemaType?: 'SoftwareApplication' | 'Article' | 'FAQPage' | 'WebPage';
  pageData?: SEOPageData;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

export const SEOHead: React.FC<SEOConfig> = ({
  title,
  description,
  canonicalPath = '',
  ogType = 'website',
  noindex = false,
  pageData,
  jsonLd
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const fullTitle = title.includes(SITE_BRAND) ? title : `${title} | ${SITE_BRAND}`;
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

    // Remove obsolete keywords meta tag if present
    const existingKeywords = document.querySelector('meta[name="keywords"]');
    if (existingKeywords) {
      existingKeywords.remove();
    }

    // 2. Standard Meta Description & Robots
    setMetaTag('name', 'description', description);
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // 3. Canonical Link
    const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const canonicalUrl = `${SITE_URL}${cleanPath === '/' ? '' : cleanPath}`;
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
    setMetaTag('property', 'og:site_name', SITE_BRAND);
    setMetaTag('property', 'og:image', `${SITE_URL}/logo-full.svg`);

    // 5. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', `${SITE_URL}/logo-full.svg`);

    // 6. Dynamic JSON-LD Structured Data
    let graph: Array<Record<string, any>> = [];

    // Organization Schema
    graph.push({
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_BRAND,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      email: 'algotraders.site@zohomail.in'
    });

    // WebSite Schema
    graph.push({
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_BRAND,
      description: 'Algorithmic trading software for Quotex binary options.',
      publisher: {
        '@id': `${SITE_URL}/#organization`
      }
    });

    if (pageData) {
      // WebPage Schema
      graph.push({
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageData.title,
        description: pageData.description,
        isPartOf: {
          '@id': `${SITE_URL}/#website`
        },
        breadcrumb: {
          '@id': `${canonicalUrl}#breadcrumb`
        }
      });

      // BreadcrumbList Schema
      if (pageData.breadcrumbs && pageData.breadcrumbs.length > 0) {
        graph.push({
          '@type': 'BreadcrumbList',
          '@id': `${canonicalUrl}#breadcrumb`,
          itemListElement: pageData.breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url
          }))
        });
      }

      // SoftwareApplication Schema (without unsupported ratings)
      if (pageData.schemaType === 'SoftwareApplication') {
        graph.push({
          '@type': 'SoftwareApplication',
          '@id': `${canonicalUrl}#software`,
          name: `${SITE_BRAND} QBot2`,
          operatingSystem: pageData.softwareDetails?.operatingSystem || 'Windows 10, Windows 11, Android 8.0+',
          applicationCategory: pageData.softwareDetails?.applicationCategory || 'FinanceApplication',
          softwareVersion: pageData.softwareDetails?.version || '2.5.0',
          description: pageData.description,
          offers: [
            {
              '@type': 'Offer',
              name: 'Monthly Pro License',
              price: '4999',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/quotex-bot-pricing`
            },
            {
              '@type': 'Offer',
              name: 'Annual Pro License',
              price: '49999',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/quotex-bot-pricing`
            }
          ]
        });
      }

      // Article Schema
      if (pageData.schemaType === 'Article') {
        graph.push({
          '@type': 'Article',
          '@id': `${canonicalUrl}#article`,
          headline: pageData.h1,
          description: pageData.description,
          mainEntityOfPage: canonicalUrl,
          author: {
            '@id': `${SITE_URL}/#organization`
          },
          publisher: {
            '@id': `${SITE_URL}/#organization`
          }
        });
      }

      // FAQPage Schema
      if (pageData.faqs && pageData.faqs.length > 0) {
        graph.push({
          '@type': 'FAQPage',
          '@id': `${canonicalUrl}#faq`,
          mainEntity: pageData.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer
            }
          }))
        });
      }
    } else if (jsonLd) {
      if (Array.isArray(jsonLd)) {
        graph = [...graph, ...jsonLd];
      } else {
        graph.push(jsonLd);
      }
    }

    // Embed JSON-LD script
    let scriptTag = document.getElementById('dynamic-page-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'dynamic-page-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@graph': graph
      },
      null,
      2
    );

    return () => {
      const tag = document.getElementById('dynamic-page-jsonld');
      if (tag) tag.remove();
    };
  }, [title, description, canonicalPath, ogType, noindex, pageData, jsonLd]);

  return null;
};
