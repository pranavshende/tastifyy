const SITE_URL = 'https://tastifyy.in';
export function restaurantSeoPath(name, id) {
    const slug = name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'restaurant';
    return `/restaurant/${slug}--${id}`;
}
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
export function buildSitemapXml(restaurants) {
    const eligibleRestaurants = restaurants.filter((restaurant) => restaurant.name.trim() && restaurant.city.trim());
    const staticPaths = ['/', '/landing', '/customer/about', '/contact'];
    if (eligibleRestaurants.some((restaurant) => /^sakoli(?:\s*,|$)/i.test(restaurant.city.trim()))) {
        staticPaths.push('/food-delivery-in-sakoli');
    }
    const urls = [
        ...staticPaths.map((path) => ({ loc: `${SITE_URL}${path}` })),
        ...eligibleRestaurants.map((restaurant) => ({
            loc: `${SITE_URL}${restaurantSeoPath(restaurant.name, restaurant.id)}`,
            lastmod: restaurant.updated_at.toISOString().slice(0, 10),
        })),
    ];
    const entries = urls.map(({ loc, lastmod }) => `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries,
        '</urlset>',
        '',
    ].join('\n');
}
//# sourceMappingURL=seo.js.map