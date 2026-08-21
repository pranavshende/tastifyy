import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { uploadFile, deleteFile, validateFile, generateFilename, getPublicUrl } from '../services/storage.service.js';
import multer from 'multer';
const router = Router();
// Menu routes are for restaurant_partners only
router.use(authenticate, authorizeRole(['restaurant_partner']));
// Multer — memory storage for Supabase pipe
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
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
// ─── HELPER ──────────────────────────────────────────────────────────────────
function formatItemWithUrl(item) {
    return {
        ...item,
        image_url: getPublicUrl(item.image_url),
    };
}
// ─── CATEGORIES ──────────────────────────────────────────────────────────────
// GET /api/menu/info — returns restaurant info for the logged-in partner
router.get('/info', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id },
            select: {
                id: true, name: true, status: true, is_open: true,
                logo_url: true, cover_image_url: true,
                phone: true, email: true, address_line: true,
                city: true, state: true, pincode: true,
                cuisine_tags: true, type: true, is_pure_veg: true,
                avg_preparation_time_mins: true, service_radius_km: true,
            }
        });
        if (!restaurant) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Restaurant not found' } });
            return;
        }
        const result = {
            ...restaurant,
            logo_url: getPublicUrl(restaurant.logo_url),
            cover_image_url: getPublicUrl(restaurant.cover_image_url),
        };
        res.json({ success: true, data: { restaurant_id, restaurant: result } });
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
        // Convert image paths to public URLs
        const result = categories.map(cat => ({
            ...cat,
            menu_items: cat.menu_items.map(formatItemWithUrl),
        }));
        res.json({ success: true, data: result });
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
        res.json({ success: true, data: items.map(formatItemWithUrl) });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch items' } });
    }
});
// POST /api/menu/items — multipart form with optional image
router.post('/items', upload.single('image'), async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { category_id, name, description, price, is_veg, is_available, preparation_time_mins } = req.body;
    const file = req.file;
    try {
        // Verify category belongs to restaurant
        const category = await prisma.menuCategory.findFirst({ where: { id: category_id, restaurant_id } });
        if (!category) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
            return;
        }
        let imagePath = undefined;
        if (file) {
            const validation = validateFile(file.buffer, file.mimetype, file.size);
            if (!validation.valid) {
                res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
                return;
            }
            // We need the item ID for the folder, so create item first then update
        }
        const createData = {
            name,
            description: description || undefined,
            price: parseFloat(price),
            is_veg: is_veg === 'true' || is_veg === true,
            is_available: is_available !== undefined ? (is_available === 'true' || is_available === true) : true,
            restaurant: { connect: { id: restaurant_id } },
            category: { connect: { id: category_id } },
        };
        if (preparation_time_mins)
            createData.preparation_time_mins = parseInt(preparation_time_mins);
        const item = await prisma.menuItem.create({ data: createData });
        // Now upload image if provided, using item.id in path
        if (file) {
            const validation = validateFile(file.buffer, file.mimetype, file.size);
            if (validation.valid) {
                const filename = generateFilename(file.originalname, 'dish');
                const { path } = await uploadFile(restaurant_id, 'menu', `${item.id}/${filename}`, file.buffer, file.mimetype);
                imagePath = path;
                await prisma.menuItem.update({ where: { id: item.id }, data: { image_url: imagePath } });
                item.image_url = imagePath;
            }
        }
        res.status(201).json({ success: true, data: formatItemWithUrl(item) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create item' } });
    }
});
// PUT /api/menu/items/:id — multipart with optional image
router.put('/items/:id', upload.single('image'), async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { id } = req.params;
    const { category_id, name, description, price, is_veg, is_available, preparation_time_mins } = req.body;
    const file = req.file;
    try {
        const existing = await prisma.menuItem.findFirst({ where: { id: id, restaurant_id: restaurant_id } });
        if (!existing) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
            return;
        }
        let imagePath = existing.image_url;
        if (file) {
            const validation = validateFile(file.buffer, file.mimetype, file.size);
            if (!validation.valid) {
                res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
                return;
            }
            // Delete old image
            if (existing.image_url) {
                await deleteFile(existing.image_url);
            }
            const filename = generateFilename(file.originalname, 'dish');
            const { path } = await uploadFile(restaurant_id, 'menu', `${id}/${filename}`, file.buffer, file.mimetype);
            imagePath = path;
        }
        const item = await prisma.menuItem.update({
            where: { id: id },
            data: {
                ...(category_id !== undefined && { category_id }),
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(is_veg !== undefined && { is_veg: is_veg === 'true' || is_veg === true }),
                ...(is_available !== undefined && { is_available: is_available === 'true' || is_available === true }),
                ...(preparation_time_mins !== undefined && { preparation_time_mins: parseInt(preparation_time_mins) }),
                image_url: imagePath,
            }
        });
        res.json({ success: true, data: formatItemWithUrl(item) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update item' } });
    }
});
// DELETE /api/menu/items/:id/image — delete just the image
router.delete('/items/:id/image', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { id } = req.params;
    try {
        const existing = await prisma.menuItem.findFirst({ where: { id: id, restaurant_id: restaurant_id } });
        if (!existing) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
            return;
        }
        if (existing.image_url) {
            await deleteFile(existing.image_url);
        }
        const item = await prisma.menuItem.update({ where: { id: id }, data: { image_url: null } });
        res.json({ success: true, data: formatItemWithUrl(item) });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete image' } });
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
        res.json({ success: true, data: formatItemWithUrl(item) });
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
        // Delete storage image
        if (existing.image_url) {
            await deleteFile(existing.image_url);
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