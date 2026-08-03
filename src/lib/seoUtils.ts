const BASE_URL = 'https://alnajafdigitalestate.com';

export function getImageAlt(
  item: { title: string; category?: string; city?: string },
  index: number
): string {
  const parts = [item.title];
  if (item.category) parts.push(item.category);
  if (item.city) parts.push(item.city);
  parts.push('Al Najaf Digital Property');
  if (index > 0) parts.push(`Image ${index + 1}`);
  return parts.join(' - ');
}

export function getMetaDescription(type: string, data: any): string {
  switch (type) {
    case 'home':
      return 'Al Najaf Digital Property - Pakistan\'s premier platform for property listings, legal services, e-stamp, fard records, and real estate solutions. Buy, sell, or rent properties across Pakistan.';
    case 'properties':
      return `Browse ${data?.count || ''} property listings for sale and rent across Pakistan. Find houses, flats, plots, and commercial properties in Lahore, Karachi, Islamabad, and more.`;
    case 'property':
      return `${data?.title || ''} - ${data?.size || ''} in ${data?.area || ''}, ${data?.city || ''}. Price: Rs ${data?.price || ''}. View details, photos, and contact the seller.`;
    case 'services':
      return 'Book legal and utility services online - E-Stamp, land registration, lawyer consultations, meter transfers, and more. Verified processes with doorstep delivery.';
    case 'service':
      return `${data?.name || ''} - ${data?.description || ''}. Fee: ${data?.fee || ''}. Duration: ${data?.duration || ''}. Book online at Al Najaf Digital Property.`;
    case 'articles':
      return `Read our latest articles about real estate, property laws, and legal guides for Pakistan. Topics cover ${data?.category || 'property'} and more.`;
    case 'article':
      return `${data?.title || ''} - ${data?.description || ''}. Read more about ${data?.category || 'real estate'} on Al Najaf Digital Property.`;
    case 'legal':
      return 'Browse legal documents including Sula Nama, Talaq Nama, Aaq Nama, Bayan Halfi, and more. Drafted and registered by verified lawyers.';
    case 'fard':
      return 'Search government fard records online. Check fard bray record, fard bray meter, and property ownership records across Pakistan.';
    case 'lawyers':
      return 'Find verified lawyers in Pakistan specializing in property, civil, criminal, family, and corporate law. Book consultations online.';
    case 'estamp':
      return 'Apply for e-stamp papers online with live selfie verification. Digital and doorstep delivery options available.';
    default:
      return 'Al Najaf Digital Property - Property and Legal Services All in One Place.';
  }
}

export function getPropertySchema(property: any): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description: property.description,
    image: property.images?.[0] || '/images/default.jpg',
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
    },
    areaServed: property.city,
    url: `${BASE_URL}/property/${property.id}`,
  };
}

export function getOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Al Najaf Digital Property',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Pakistan\'s premier real estate and legal services platform.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+92-300-1234567',
      contactType: 'customer service',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PK',
    },
  };
}

export function getArticleSchema(article: any): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Al Najaf Digital Property',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Al Najaf Digital Property',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/articles/${article.slug}`,
    },
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

export function getCanonicalUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${clean}`;
}

export function generateSitemap(
  pages: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[]
): string {
  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${BASE_URL}${page.loc.startsWith('/') ? page.loc : `/${page.loc}`}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    ${page.changefreq ? `<changefreq>${page.changefreq}</changefreq>` : ''}
    ${page.priority ? `<priority>${page.priority}</priority>` : ''}
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function getRobotsTxt(): string {
  return `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml

Disallow: /dashboard
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /verify-otp
Disallow: /forgot-password
`;
}
