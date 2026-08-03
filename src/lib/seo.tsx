import { useEffect } from 'react';
import { JsonLd } from './structuredData';

export type SEOProps = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  schema?: Record<string, any>;
  noindex?: boolean;
};

const BASE_URL = 'https://alnajafdigitalestate.com';

export function SEOHead(props: SEOProps) {
  const {
    title,
    description,
    canonical,
    ogImage = '/og-image.jpg',
    ogType = 'website',
    twitterCard = 'summary_large_image',
    schema,
    noindex = false,
  } = props;

  const fullTitle = `${title} | Al Najaf Digital Property`;
  const url = canonical ? `${BASE_URL}${canonical.startsWith('/') ? canonical : `/${canonical}`}` : undefined;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:image', `${BASE_URL}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`, true);
    setMeta('og:url', url || window.location.href, true);
    setMeta('og:type', ogType, true);
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', `${BASE_URL}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`);

    if (url) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    }

    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      let robots = document.querySelector('meta[name="robots"]');
      if (robots && robots.getAttribute('content') === 'noindex, nofollow') {
        robots.remove();
      }
    }

    return () => {
      document.title = 'Al Najaf Digital Property';
    };
  }, [fullTitle, description, url, ogImage, ogType, twitterCard, noindex]);

  return schema ? <JsonLd data={schema} /> : null;
}
