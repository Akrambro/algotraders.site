import { SEO_PAGES, SITE_BRAND, SITE_URL, SEOPageData } from '../seo/seo-data.ts';

export function injectRouteMetadata(html: string, rawUrl: string): string {
  const urlPath = rawUrl.split('?')[0].replace(/\/$/, '') || '/';
  const pageData: SEOPageData | undefined = SEO_PAGES[urlPath];

  const isNoindex = urlPath === '/admin' || urlPath === '/dashboard' || rawUrl.includes('#admin') || rawUrl.includes('#dashboard');

  let title = `${SITE_BRAND} – Quotex Trading Bot & Binary Options Algorithms`;
  let description = 'AlgoTraders QBot2: Institutional-grade Quotex trading bot and binary options algorithmic execution software for Windows PC with Android mobile companion.';
  let canonicalUrl = `${SITE_URL}${urlPath === '/' ? '' : urlPath}`;
  let ogType = 'website';

  if (pageData) {
    title = pageData.title;
    description = pageData.description;
    canonicalUrl = `${SITE_URL}${pageData.path}`;
    ogType = pageData.schemaType === 'Article' ? 'article' : 'website';
  } else if (urlPath === '/admin') {
    title = `Admin Portal – ${SITE_BRAND}`;
    description = 'Restricted administrator portal for AlgoTraders system management.';
  } else if (urlPath === '/dashboard') {
    title = `Customer Dashboard – ${SITE_BRAND}`;
    description = 'Manage your QBot2 license keys, workstation pairings, and software downloads.';
  }

  // 1. Replace <title>
  html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

  // 2. Replace meta description
  html = html.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${description}" />`);

  // 3. Replace canonical
  html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

  // 4. Remove keywords meta tag if present
  html = html.replace(/<meta\s+name=["']keywords["']\s+content=["'].*?["']\s*\/?>\s*/gi, '');

  // 5. Replace robots
  const robotsDirective = isNoindex
    ? 'noindex, nofollow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  html = html.replace(/<meta\s+name=["']robots["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="robots" content="${robotsDirective}" />`);

  // 6. Replace OpenGraph & Twitter
  html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta\s+property=["']og:type["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:type" content="${ogType}" />`);
  html = html.replace(/<meta\s+property=["']og:site_name["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:site_name" content="${SITE_BRAND}" />`);

  html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta\s+name=["']twitter:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:url" content="${canonicalUrl}" />`);

  // 7. Inject Page-Specific JSON-LD Graph
  if (pageData) {
    const graph: Array<Record<string, any>> = [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_BRAND,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        email: 'algotraders.site@zohomail.in'
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_BRAND,
        description: 'Algorithmic trading software for Quotex binary options.',
        publisher: {
          '@id': `${SITE_URL}/#organization`
        }
      },
      {
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
      }
    ];

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

    const scriptPayload = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
    html = html.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i, `<script type="application/ld+json">\n${scriptPayload}\n    </script>`);
  }

  return html;
}
