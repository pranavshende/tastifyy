import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
const router = Router();
// Menu routes are for restaurant_partners only
router.use(authenticate, authorizeRole(['restaurant_partner']));
// Middleware to extract restaurant_id for the logged-in partner
const attachRestaurantId = async (req, res, next) => {
    const user = req.user;
    try {
        const partner = await prisma.restaurantPartner.findFirst({
            where: { phone: user.phone },
            include: { restaurant: true }
        });
        if (!partner || !partner.restaurant) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No active restaurant found for this user' } });
            return;
        }
        // Attach restaurant_id to request
        req.restaurant_id = partner.restaurant.id;
        next();
    }
    catch (err) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify restaurant access' } });
    }
};
router.use(attachRestaurantId);
// ─── CATEGORIES ──────────────────────────────────────────────────────────────
// GET /api/menu/info — returns restaurant_id for the logged-in partner (used for WebSocket room join)
router.get('/info', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id },
            select: { id: true, name: true, status: true, is_open: true }
        });
        res.json({ success: true, data: { restaurant_id, restaurant } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurant info' } });
    }
});
// GET /api/menu/categories
router.get('/categories', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    try {
        const categories = await prisma.menuCategory.findMany({
            where: { restaurant_id },
            orderBy: { display_order: 'asc' },
            include: { menu_items: { orderBy: { name: 'asc' } } }
        });
        res.json({ success: true, data: categories });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' } });
    }
});
// POST /api/menu/categories
router.post('/categories', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { name, display_order } = req.body;
    try {
        const category = await prisma.menuCategory.create({
            data: { restaurant_id, name, display_order: display_order || 0 }
        });
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' } });
    }
});
// PUT /api/menu/categories/:id
router.put('/categories/:id', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { id } = req.params;
    const { name, display_order, is_active } = req.body;
    try {
        // Ensure ownership
        const existing = await prisma.menuCategory.findFirst({ where: { id: id, restaurant_id: restaurant_id } });
        if (!existing) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
            return;
        }
        const category = await prisma.menuCategory.update({
            where: { id: id },
            data: { name, display_order, is_active }
        });
        res.json({ success: true, data: category });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' } });
    }
});
// DELETE /api/menu/categories/:id
router.delete('/categories/:id', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { id } = req.params;
    try {
        const existing = await prisma.menuCategory.findFirst({ where: { id: id, restaurant_id: restaurant_id } });
        if (!existing) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
            return;
        }
        // Check if items exist
        const itemsCount = await prisma.menuItem.count({ where: { category_id: id } });
        if (itemsCount > 0) {
            res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Cannot delete category with items' } });
            return;
        }
        await prisma.menuCategory.delete({ where: { id: id } });
        res.json({ success: true, message: 'Category deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' } });
    }
});
// ─── MENU ITEMS ──────────────────────────────────────────────────────────────
// GET /api/menu/items
router.get('/items', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    try {
        const items = await prisma.menuItem.findMany({
            where: { restaurant_id },
            include: { category: true },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: items });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch items' } });
    }
});
// POST /api/menu/items
router.post('/items', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { category_id, name, description, price, is_veg, image_url, is_available } = req.body;
    try {
        // Verify category belongs to restaurant
        const category = await prisma.menuCategory.findFirst({ where: { id: category_id, restaurant_id } });
        if (!category) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
            return;
        }
        const item = await prisma.menuItem.create({
            data: {
                restaurant_id,
                category_id,
                name,
                description,
                price,
                is_veg,
                image_url,
                is_available: is_available !== undefined ? is_available : true,
            }
        });
        res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create item' } });
    }
});
// PUT /api/menu/items/:id
router.put('/items/:id', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { id } = req.params;
    const { category_id, name, description, price, is_veg, image_url, is_available } = req.body;
    try {
        const existing = await prisma.menuItem.findFirst({ where: { id: id, restaurant_id: restaurant_id } });
        if (!existing) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
            return;
        }
        const item = await prisma.menuItem.update({
            where: { id: id },
            data: { category_id, name, description, price, is_veg, image_url, is_available }
        });
        res.json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update item' } });
    }
});
// PATCH /api/menu/items/:id/status
router.patch('/items/:id/status', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { id } = req.params;
    const { is_available } = req.body;
    try {
        const existing = await prisma.menuItem.findFirst({ where: { id: id, restaurant_id: restaurant_id } });
        if (!existing) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
            return;
        }
        const item = await prisma.menuItem.update({
            where: { id: id },
            data: { is_available }
        });
        res.json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update item status' } });
    }
});
// DELETE /api/menu/items/:id
router.delete('/items/:id', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { id } = req.params;
    try {
        const existing = await prisma.menuItem.findFirst({ where: { id: id, restaurant_id: restaurant_id } });
        if (!existing) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
            return;
        }
        await prisma.menuItem.delete({ where: { id: id } });
        res.json({ success: true, message: 'Item deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete item' } });
    }
});
export default router;
//# sourceMappingURL=menu.routes.js.map