import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

export const getActiveRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { status: 'active', is_open: true },
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
      return { ...rest, rating: Number(avgRating.toFixed(1)) };
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
  const updates = req.body;

  try {
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
        WHERE status = 'active' AND is_open = true
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
      where: { id },
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

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
