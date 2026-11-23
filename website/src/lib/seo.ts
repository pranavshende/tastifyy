export const SITE_URL = 'https://tastifyy.in';
export const BRAND_NAME = 'Tastifyy';
export const DEFAULT_DESCRIPTION =
  'Discover local restaurants, explore menus, and order food online with Tastifyy in Sakoli, Maharashtra.';

export function canonicalUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function publicImageUrl(value?: string | null): string | undefined {
  if (!value || value === 'null') return undefined;

  try {
    const url = new URL(value, SITE_URL);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function restaurantSeoPath(name: string, id: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'restaurant';

  return `/restaurant/${slug}--${id}`;
}
