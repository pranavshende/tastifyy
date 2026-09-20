import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { getPublicUrl } from '../services/storage.service.js';
import { findRestaurantPartner } from '../utils/restaurantPartner.js';

function formatRestaurant(r: any) {
  return {
    ...r,
    logo_url: getPublicUrl(r.logo_url),
    cover_image_url: getPublicUrl(r.cover_image_url),
  };
}

function formatMenuItem(item: any) {
  return {
    ...item,
    image_url: getPublicUrl(item.image_url),
  };
}

export const getActiveRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        status: 'active',
        approval_status: 'approved',
        account_status: 'active',
        visibility_status: 'visible',
        operating_status: 'open',
        is_open: true
      },
      include: { 
        menu_categories: { include: { menu_items: true } },
        ratings: { select: { restaurant_rating: true } }
      }
    });

    const formatted = restaurants.map(r => {
      const totalRatings = r.ratings.length;
      const avgRating = totalRatings > 0 
        ? r.ratings.reduce((sum, rating) => sum + rating.restaurant_rating, 0) / totalRatings 
        : 4.2;
      
      const { ratings, ...rest } = r;
      return formatRestaurant({ ...rest, rating: Number(avgRating.toFixed(1)) });
    });

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerRestaurant = async (req: Request, res: Response): Promise<void> => {
  const { name, type, owner_name, phone, address_line, city, state, pincode, latitude, longitude, commission_rate } = req.body;
  
  if (!name || !type || !owner_name || !phone) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        type,
        owner_name,
        phone,
        address_line: address_line || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        latitude: latitude || 0,
        longitude: longitude || 0,
        service_radius_km: 5.0,
        commission_rate: commission_rate || 15.0,
      }
    });

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRestaurant = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const allowedFields = [
    'name', 'type', 'owner_name', 'phone', 'email', 'address_line', 'city', 'state', 'pincode',
    'latitude', 'longitude', 'service_radius_km', 'logo_url', 'cover_image_url', 'is_pure_veg',
    'cuisine_tags', 'avg_preparation_time_mins', 'is_open'
  ] as const;
  const updates = Object.fromEntries(
    allowedFields
      .filter(field => req.body[field] !== undefined)
      .map(field => [field, req.body[field]])
  );

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid restaurant fields supplied' });
    return;
  }

  try {
    const existingRestaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!existingRestaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }
    const user = req.user as any;
    if (user.role !== 'admin') {
      const partner = await findRestaurantPartner(user);
      if (!partner || partner.restaurant_id !== id) {
        res.status(403).json({ error: 'Forbidden: You do not own this restaurant' });
        return;
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updates
    });
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNearbyRestaurants = async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radiusKm = 10 } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ error: 'Latitude and Longitude are required' });
    return;
  }

  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);
  const maxDistance = parseFloat(radiusKm as string);

  try {
    // Haversine formula using CTE to allow WHERE clause filtering
    const restaurants = await prisma.$queryRaw`
      WITH distances AS (
        SELECT id, name, type, cover_image_url, cuisine_tags, avg_preparation_time_mins, latitude, longitude,
        (
          6371 * acos(
            cos(radians(${userLat})) * cos(radians(latitude::float)) *
            cos(radians(longitude::float) - radians(${userLng})) +
            sin(radians(${userLat})) * sin(radians(latitude::float))
          )
        ) AS distance
        FROM restaurants
        WHERE status = 'active'
          AND approval_status = 'approved'
          AND account_status = 'active'
          AND visibility_status = 'visible'
          AND operating_status = 'open'
          AND is_open = true
      )
      SELECT * FROM distances
      WHERE distance <= ${maxDistance}
      ORDER BY distance ASC;
    `;
    
    res.json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRestaurantMenu = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id,
        status: 'active',
        approval_status: 'approved',
        account_status: 'active',
        visibility_status: 'visible',
        operating_status: 'open',
        is_open: true
      },
      include: {
        menu_categories: {
          orderBy: { display_order: 'asc' },
          include: {
            menu_items: {
              where: { is_available: true }
            }
          }
        }
      }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Format image URLs
    const result = formatRestaurant({
      ...restaurant,
      menu_categories: restaurant.menu_categories.map(cat => ({
        ...cat,
        menu_items: cat.menu_items.map(formatMenuItem),
      })),
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchRestaurants = async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Search query is required' });
    return;
  }

  const queryStr = q.toLowerCase();

  try {
    // 1. Search Restaurants (Name or Tags)
    const restaurantMatches = await prisma.restaurant.findMany({
      where: {
        status: 'active',
        approval_status: 'approved',
        account_status: 'active',
        visibility_status: 'visible',
        operating_status: 'open',
        is_open: true,
        OR: [
          { name: { contains: queryStr, mode: 'insensitive' } },
          { cuisine_tags: { has: queryStr } } // Wait, has is strict. Let's stick to array match or name match.
          // In Postgres, we can't easily ILIKE inside an array using Prisma natively without raw.
          // So we will just use a raw query if we really want to match tags partially, 
          // or we can fetch all and filter in memory if it's small.
          // Let's just do name contains for now.
        ]
      },
      take: 10
    });

    // Let's improve the Restaurant query to also match if query is exactly in tags
    const restaurantTagMatches = await prisma.restaurant.findMany({
      where: {
        status: 'active',
        is_open: true,
        cuisine_tags: { has: queryStr }
      },
      take: 5
    });

    // Merge and dedupe restaurants
    const combinedRestaurants = [...restaurantMatches, ...restaurantTagMatches];
    const uniqueRestaurantsMap = new Map();
    combinedRestaurants.forEach(r => uniqueRestaurantsMap.set(r.id, r));
    const finalRestaurants = Array.from(uniqueRestaurantsMap.values()).map(formatRestaurant);

    // 2. Search Menu Items (Name or Description)
    const menuMatches = await prisma.menuItem.findMany({
      where: {
        is_available: true,
        restaurant: {
          status: 'active',
          approval_status: 'approved',
          account_status: 'active',
          visibility_status: 'visible',
          operating_status: 'open',
          is_open: true
        },
        OR: [
          { name: { contains: queryStr, mode: 'insensitive' } },
          { description: { contains: queryStr, mode: 'insensitive' } }
        ]
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            city: true
          }
        }
      },
      take: 20
    });

    const finalMenuItems = menuMatches.map(m => ({
      ...formatMenuItem(m),
      restaurant: m.restaurant ? {
        ...m.restaurant,
        logo_url: getPublicUrl(m.restaurant.logo_url)
      } : null
    }));

    res.json({
      success: true,
      data: {
        restaurants: finalRestaurants,
        menuItems: finalMenuItems
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
