import { useEffect } from 'react';
import { BRAND_NAME, canonicalUrl, DEFAULT_DESCRIPTION, SITE_URL } from '../lib/seo';

interface SeoMetadataProps {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown>;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

function setCanonical(path: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonicalUrl(path);
}

export default function SeoMetadata({
  title,
  description,
  canonicalPath,
  image,
  noindex = false,
  structuredData,
}: SeoMetadataProps) {
  const jsonLd = structuredData
    ? JSON.stringify(structuredData).replace(/</g, '\\u003c')
    : '';

  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl(canonicalPath));
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:locale', 'en_IN');
    setMeta('property', 'og:site_name', BRAND_NAME);
    setMeta('property', 'og:image', image || '');
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image || '');
    setCanonical(canonicalPath);

    let script = document.getElementById('tastifyy-page-jsonld') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'tastifyy-page-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = jsonLd;
    } else {
      script?.remove();
    }

    return () => {
      document.title = `${BRAND_NAME} — Local Food. Real Flavours.`;
      setMeta('name', 'description', DEFAULT_DESCRIPTION);
      setMeta('name', 'robots', 'index,follow');
      setMeta('property', 'og:title', `${BRAND_NAME} — Local Food. Real Flavours.`);
      setMeta('property', 'og:description', DEFAULT_DESCRIPTION);
      setMeta('property', 'og:url', SITE_URL);
      setMeta('property', 'og:type', 'website');
      setMeta('property', 'og:locale', 'en_IN');
      setMeta('property', 'og:site_name', BRAND_NAME);
      setMeta('property', 'og:image', '');
      setMeta('name', 'twitter:card', 'summary');
      setMeta('name', 'twitter:title', `${BRAND_NAME} — Local Food. Real Flavours.`);
      setMeta('name', 'twitter:description', DEFAULT_DESCRIPTION);
      setMeta('name', 'twitter:image', '');
      setCanonical('/');
      document.getElementById('tastifyy-page-jsonld')?.remove();
    };
  }, [canonicalPath, description, image, jsonLd, noindex, title]);

  return null;
}
