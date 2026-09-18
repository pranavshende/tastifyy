import { prisma } from '../utils/prisma.js';
import { getPublicUrl } from '../services/storage.service.js';
import { findRestaurantPartner } from '../utils/restaurantPartner.js';
function formatRestaurant(r) {
    return {
        ...r,
        logo_url: getPublicUrl(r.logo_url),
        cover_image_url: getPublicUrl(r.cover_image_url),
    };
}
function formatMenuItem(item) {
    return {
        ...item,
        image_url: getPublicUrl(item.image_url),
    };
}
export const getActiveRestaurants = async (req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            where: {
                approval_status: 'approved',
                account_status: 'active',
                visibility_status: 'visible',
                latitude: { not: 0 },
                longitude: { not: 0 },
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
    }
    catch (error) {
        console.error('Restaurant listing failed:', error);
        res.status(500).json({ success: false, message: 'Unable to load restaurants right now.' });
    }
};
export const registerRestaurant = async (req, res) => {
    const { name, type, owner_name, phone, address_line, city, state, pincode, latitude, longitude, commission_rate } = req.body;
    if (!name || !type || !owner_name || !phone) {
        res.status(400).json({ success: false, message: 'Restaurant name, type, owner name, and phone are required.' });
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
    }
    catch (error) {
        console.error('Restaurant registration failed:', error);
        res.status(500).json({ success: false, message: 'Unable to register restaurant right now.' });
    }
};
export const updateRestaurant = async (req, res) => {
    const id = req.params.id;
    const allowedFields = [
        'name', 'type', 'owner_name', 'phone', 'email', 'address_line', 'city', 'state', 'pincode',
        'service_radius_km', 'logo_url', 'cover_image_url', 'photo_gallery_urls',
        'is_pure_veg', 'cuisine_tags', 'avg_preparation_time_mins', 'bank_account_number', 'ifsc_code',
        'bank_beneficiary_name', 'pan_number',
    ];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
    try {
        const existingRestaurant = await prisma.restaurant.findUnique({ where: { id } });
        if (!existingRestaurant) {
            res.status(404).json({ success: false, message: 'Restaurant not found.' });
            return;
        }
        const user = req.user;
        if (user.role !== 'admin') {
            const partner = await findRestaurantPartner(user);
            if (!partner || partner.restaurant_id !== id) {
                res.status(403).json({ success: false, message: 'You are not authorized to update this restaurant.' });
                return;
            }
        }
        const restaurant = await prisma.restaurant.update({
            where: { id },
            data: updates
        });
        res.json(restaurant);
    }
    catch (error) {
        console.error('Restaurant update failed:', error);
        res.status(500).json({ success: false, message: 'Unable to update restaurant right now.' });
    }
};
export const getNearbyRestaurants = async (req, res) => {
    const { lat, lng, radiusKm = 10 } = req.query;
    if (!lat || !lng) {
        res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
        return;
    }
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxDistance = parseFloat(radiusKm);
    if (!Number.isFinite(userLat) || userLat < -90 || userLat > 90 ||
        !Number.isFinite(userLng) || userLng < -180 || userLng > 180 ||
        !Number.isFinite(maxDistance) || maxDistance < 0) {
        res.status(400).json({ success: false, message: 'A valid location and radius are required.' });
        return;
    }
    try {
        // Haversine formula using CTE to allow WHERE clause filtering
        const restaurants = await prisma.$queryRaw `
      WITH distances AS (
        SELECT id, name, type, cover_image_url, cuisine_tags, avg_preparation_time_mins, latitude, longitude,
        (
          6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians(${userLat})) * cos(radians(latitude::float)) *
            cos(radians(longitude::float) - radians(${userLng})) +
            sin(radians(${userLat})) * sin(radians(latitude::float))
          )))
        ) AS distance
        FROM restaurants
        WHERE approval_status = 'approved'
          AND account_status = 'active'
          AND visibility_status = 'visible'
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND latitude <> 0
          AND longitude <> 0
      )
      SELECT * FROM distances
      WHERE distance <= ${maxDistance}
      ORDER BY distance ASC;
    `;
        res.json({
            success: true,
            restaurants,
            message: restaurants.length ? undefined : 'No restaurants found nearby',
        });
    }
    catch (error) {
        console.error('Nearby restaurant query failed:', error);
        res.status(500).json({ success: false, message: 'Unable to load restaurants right now.' });
    }
};
export const getRestaurantMenu = async (req, res) => {
    const id = req.params.id;
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: {
                id,
                approval_status: 'approved',
                account_status: 'active',
                visibility_status: 'visible',
                latitude: { not: 0 },
                longitude: { not: 0 },
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
    }
    catch (error) {
        console.error('Restaurant menu query failed:', error);
        res.status(500).json({ success: false, message: 'Unable to load this restaurant right now.' });
    }
};
export const searchRestaurants = async (req, res) => {
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
                approval_status: 'approved',
                account_status: 'active',
                visibility_status: 'visible',
                latitude: { not: 0 },
                longitude: { not: 0 },
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
                approval_status: 'approved',
                account_status: 'active',
                visibility_status: 'visible',
                latitude: { not: 0 },
                longitude: { not: 0 },
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
                    approval_status: 'approved',
                    account_status: 'active',
                    visibility_status: 'visible',
                    latitude: { not: 0 },
                    longitude: { not: 0 }
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
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Unable to search restaurants right now.' });
    }
};
//# sourceMappingURL=restaurant.controller.js.map