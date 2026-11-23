export interface SitemapRestaurant {
    id: string;
    name: string;
    city: string;
    updated_at: Date;
}
export declare function restaurantSeoPath(name: string, id: string): string;
export declare function buildSitemapXml(restaurants: readonly SitemapRestaurant[]): string;
//# sourceMappingURL=seo.d.ts.map