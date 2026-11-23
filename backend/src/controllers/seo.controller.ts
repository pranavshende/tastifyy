import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { buildSitemapXml } from '../utils/seo.js';

export const getSitemap = async (_req: Request, res: Response): Promise<void> => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        status: 'active',
        approval_status: 'approved',
        account_status: 'active',
        visibility_status: 'visible',
        name: { not: '' },
        city: { not: '' },
        menu_items: {
          some: {
            is_available: true,
            is_deleted: false,
            category: { is_active: true },
          },
        },
      },
      select: { id: true, name: true, city: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
      take: 49996,
    });

    res
      .status(200)
      .set('Cache-Control', 'public, max-age=300, s-maxage=300')
      .type('application/xml')
      .send(buildSitemapXml(restaurants));
  } catch (error) {
    console.error('Sitemap generation failed:', error);
    res.status(500).type('text/plain').send('Unable to generate sitemap');
  }
};
