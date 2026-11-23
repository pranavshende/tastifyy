import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';
import { buildSitemapXml, restaurantSeoPath } from '../src/utils/seo.js';

describe('SEO sitemap helpers', () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  it('creates stable, readable restaurant paths from real names and IDs', () => {
    expect(restaurantSeoPath('Café & Kitchen', 'restaurant-id')).toBe('/restaurant/cafe-kitchen--restaurant-id');
  });

  it('includes public pages and last-modified dates in XML', () => {
    const xml = buildSitemapXml([
      { id: 'restaurant-id', name: 'Sakoli Kitchen', city: 'Sakoli', updated_at: new Date('2026-11-20T12:00:00.000Z') },
    ]);

    expect(xml).toContain('<loc>https://tastifyy.in/food-delivery-in-sakoli</loc>');
    expect(xml).toContain('<loc>https://tastifyy.in/restaurant/sakoli-kitchen--restaurant-id</loc>');
    expect(xml).toContain('<lastmod>2026-11-20</lastmod>');
    expect(xml).toContain('</urlset>');
  });

  it('escapes XML-sensitive characters in generated URLs', () => {
    const xml = buildSitemapXml([
      { id: 'id&value', name: 'A & B', city: 'Sakoli', updated_at: new Date('2026-11-20T12:00:00.000Z') },
    ]);

    expect(xml).toContain('a-b--id&amp;value');
  });

  it('omits the Sakoli landing page when there are no eligible Sakoli listings', () => {
    const xml = buildSitemapXml([]);

    expect(xml).not.toContain('/food-delivery-in-sakoli');
    expect(xml).not.toContain('/restaurant/');
  });

  it('serves a public XML sitemap from eligible restaurant records', async () => {
    prismaMock.restaurant.findMany.mockResolvedValue([
      {
        id: 'restaurant-id',
        name: 'Sakoli Kitchen',
        city: 'Sakoli',
        updated_at: new Date('2026-11-20T12:00:00.000Z'),
      },
    ] as never);

    const response = await request(app).get('/api/seo/sitemap.xml');

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/xml');
    expect(response.text).toContain('/restaurant/sakoli-kitchen--restaurant-id');
    expect(prismaMock.restaurant.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'active',
        approval_status: 'approved',
        account_status: 'active',
        visibility_status: 'visible',
        menu_items: expect.objectContaining({
          some: expect.objectContaining({
            is_available: true,
            is_deleted: false,
            category: { is_active: true },
          }),
        }),
      }),
    }));
  });
});
