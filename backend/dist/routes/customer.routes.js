import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
const router = Router();
router.use(authenticate, authorizeRole(['customer']));
// GET /api/customer/restaurants
// Fetch all active restaurants. MVP: no complex geofencing, just return active ones.
router.get('/restaurants', async (req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            where: { status: 'active' },
            select: {
                id: true,
                name: true,
                type: true,
                address_line: true,
                city: true,
                cover_image_url: true,
                logo_url: true,
                is_pure_veg: true,
                cuisine_tags: true,
                avg_preparation_time_mins: true,
                is_open: true,
            },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: restaurants });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurants' } });
    }
});
// GET /api/customer/restaurants/:id/menu
// Fetch restaurant details and its active menu items, grouped by category
router.get('/restaurants/:id/menu', async (req, res) => {
    const id = req.params.id;
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id, status: 'active' },
            select: {
                id: true,
                name: true,
                type: true,
                city: true,
                is_pure_veg: true,
                cuisine_tags: true,
                avg_preparation_time_mins: true,
            }
        });
        if (!restaurant) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Restaurant not found or inactive' } });
            return;
        }
        const categories = await prisma.menuCategory.findMany({
            where: { restaurant_id: id, is_active: true },
            orderBy: { display_order: 'asc' },
            include: {
                menu_items: {
                    where: { is_available: true },
                    orderBy: { name: 'asc' },
                    include: {
                        customizations: {
                            include: { options: true }
                        }
                    }
                }
            }
        });
        // Filter out empty categories for the customer view
        const filteredCategories = categories.filter((cat) => cat.menu_items && cat.menu_items.length > 0);
        res.json({ success: true, data: { restaurant, menu: filteredCategories } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch menu' } });
    }
});
export default router;
//# sourceMappingURL=customer.routes.js.map