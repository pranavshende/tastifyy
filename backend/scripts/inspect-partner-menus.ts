import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

dotenv.config();
if (!process.env.DATABASE_URL) {
  console.log('Read-only inspection skipped: DATABASE_URL is not configured.');
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const partners = await prisma.restaurantPartner.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          status: true,
          menu_categories: {
            select: {
              id: true,
              name: true,
              is_active: true,
              menu_items: { select: { id: true, name: true, price: true, image_url: true, is_available: true, restaurant_id: true } }
            }
          }
        }
      }
    }
  });

  const report = partners.map(partner => {
    const categories = partner.restaurant.menu_categories;
    const items = categories.flatMap(category => category.menu_items);
    const mismatchedItems = items.filter(item => item.restaurant_id !== partner.restaurant.id);
    return {
      partner: { id: partner.id, name: partner.name, phone: partner.phone, email: partner.email },
      restaurant: { id: partner.restaurant.id, name: partner.restaurant.name, status: partner.restaurant.status },
      categoryCount: categories.length,
      itemCount: items.length,
      availableItemCount: items.filter(item => item.is_available).length,
      imageCount: items.filter(item => Boolean(item.image_url)).length,
      mismatchedItemCount: mismatchedItems.length,
      categories: categories.map(category => ({ id: category.id, name: category.name, active: category.is_active, itemCount: category.menu_items.length }))
    };
  });

  console.log(JSON.stringify({ partnerCount: report.length, partners: report }, null, 2));
} finally {
  await prisma.$disconnect();
  await pool.end();
}
