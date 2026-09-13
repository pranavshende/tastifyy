import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getPublicUrl, uploadFile, deleteFile, validateFile, generateFilename } from '../services/storage.service.js';
import multer from 'multer';
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
const router = Router();
router.use(authenticate, authorizeRole(['customer']));
router.use(authenticate, authorizeRole(['customer']));
// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { recipient_id: req.user.id, recipient_type: 'customer' },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' } });
    }
});
router.patch('/notifications/read-all', async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { recipient_id: req.user.id, recipient_type: 'customer', is_read: false },
            data: { is_read: true }
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update notifications' } });
    }
});
router.patch('/notifications/:id/read', async (req, res) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: req.params.id, recipient_id: req.user.id },
            data: { is_read: true }
        });
        res.json({ success: true, data: notification });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification' } });
    }
});
// ─── FAVORITES ───────────────────────────────────────────────────────────────
router.get('/favorites', async (req, res) => {
    try {
        const favorites = await prisma.userFavorite.findMany({
            where: { user_id: req.user.id },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        logo_url: true,
                        cover_image_url: true,
                        cuisine_tags: true,
                        avg_preparation_time_mins: true,
                        address_line: true,
                        city: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: favorites.map(f => f.restaurant) });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch favorites' } });
    }
});
router.post('/favorites/:restaurantId', async (req, res) => {
    try {
        const fav = await prisma.userFavorite.create({
            data: {
                user_id: req.user.id,
                restaurant_id: req.params.restaurantId
            }
        });
        res.json({ success: true, data: fav });
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.json({ success: true, message: 'Already favorited' });
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add favorite' } });
    }
});
router.delete('/favorites/:restaurantId', async (req, res) => {
    try {
        await prisma.userFavorite.deleteMany({
            where: {
                user_id: req.user.id,
                restaurant_id: req.params.restaurantId
            }
        });
        res.json({ success: true, message: 'Removed from favorites' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove favorite' } });
    }
});
// ─── PROFILE ─────────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, phone: true, email: true, profile_photo_url: true, dob: true }
        });
        if (!user) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
            return;
        }
        user.profile_photo_url = getPublicUrl(user.profile_photo_url);
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } });
    }
});
router.put('/profile', async (req, res) => {
    const { name, phone, email, dob } = req.body;
    if (!name || !phone) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and phone are required' } });
        return;
    }
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, phone, email, dob: dob ? new Date(dob) : null },
            select: { id: true, name: true, phone: true, email: true, profile_photo_url: true, dob: true }
        });
        user.profile_photo_url = getPublicUrl(user.profile_photo_url);
        res.json({ success: true, data: user });
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({ success: false, error: { code: 'UNIQUE_CONSTRAINT', message: 'Phone or email already exists' } });
            return;
        }
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } });
    }
});
router.post('/profile/photo', upload.single('image'), async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No image file provided' } });
        return;
    }
    const validation = validateFile(file.buffer, file.mimetype, file.size);
    if (!validation.valid) {
        res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
        return;
    }
    try {
        const filename = generateFilename(file.originalname, 'profile');
        const path = `users/${req.user.id}/${filename}`;
        const uploadResult = await uploadFile('users', req.user.id, filename, file.buffer, file.mimetype);
        // Check old photo and delete if exists
        const oldUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { profile_photo_url: true } });
        if (oldUser?.profile_photo_url) {
            await deleteFile(oldUser.profile_photo_url);
        }
        await prisma.user.update({
            where: { id: req.user.id },
            data: { profile_photo_url: uploadResult.path }
        });
        res.json({ success: true, data: { profile_photo_url: getPublicUrl(uploadResult.path) } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upload photo' } });
    }
});
router.delete('/profile/photo', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { profile_photo_url: true } });
        if (user?.profile_photo_url) {
            await deleteFile(user.profile_photo_url);
            await prisma.user.update({
                where: { id: req.user.id },
                data: { profile_photo_url: null }
            });
        }
        res.json({ success: true, message: 'Photo deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete photo' } });
    }
});
// ─── ADDRESS ROUTES ───────────────────────────────────────────────────────────
router.get('/addresses', async (req, res) => {
    try {
        const user_id = req.user.id;
        const addresses = await prisma.address.findMany({
            where: { user_id, is_deleted: false },
            orderBy: [
                { is_default: 'desc' },
                { created_at: 'desc' }
            ]
        });
        res.json({ success: true, data: addresses });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch addresses' } });
    }
});
router.post('/addresses', async (req, res) => {
    const { label, address_line, city, state, pincode, is_default, latitude, longitude } = req.body;
    if (!address_line || !city || !state || !pincode) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required address fields' } });
        return;
    }
    try {
        const user_id = req.user.id;
        // If setting as default, unset others
        if (is_default) {
            await prisma.address.updateMany({
                where: { user_id },
                data: { is_default: false }
            });
        }
        // If it's the first address, make it default automatically
        const count = await prisma.address.count({ where: { user_id } });
        const shouldBeDefault = is_default || count === 0;
        const address = await prisma.address.create({
            data: {
                user_id,
                label: (label ? label.toLowerCase() : 'home'),
                address_line,
                city,
                state,
                pincode,
                latitude: latitude ? Number(latitude) : 0,
                longitude: longitude ? Number(longitude) : 0,
                is_default: shouldBeDefault
            }
        });
        res.status(201).json({ success: true, data: address });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create address' } });
    }
});
router.delete('/addresses/:id', async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const address = await prisma.address.findFirst({
            where: { id: id, user_id, is_deleted: false }
        });
        if (!address) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } });
            return;
        }
        await prisma.address.update({
            where: { id: id },
            data: { is_deleted: true }
        });
        // If we deleted the default, set another one as default if it exists
        if (address.is_default) {
            const nextAddress = await prisma.address.findFirst({
                where: { user_id, is_deleted: false }
            });
            if (nextAddress) {
                await prisma.address.update({
                    where: { id: nextAddress.id },
                    data: { is_default: true }
                });
            }
        }
        res.json({ success: true, message: 'Address deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete address' } });
    }
});
router.patch('/addresses/:id/default', async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const address = await prisma.address.findFirst({
            where: { id: id, user_id, is_deleted: false }
        });
        if (!address) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } });
            return;
        }
        await prisma.$transaction([
            prisma.address.updateMany({
                where: { user_id },
                data: { is_default: false }
            }),
            prisma.address.update({
                where: { id: id },
                data: { is_default: true }
            })
        ]);
        res.json({ success: true, message: 'Default address updated successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to set default address' } });
    }
});
// ─── RESTAURANT & MENU ROUTES ───────────────────────────────────────────────
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
                ratings: { select: { restaurant_rating: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        const result = restaurants.map(r => {
            let rating = 0;
            if (r.ratings && r.ratings.length > 0) {
                const sum = r.ratings.reduce((acc, curr) => acc + curr.restaurant_rating, 0);
                rating = Number((sum / r.ratings.length).toFixed(1));
            }
            const { ratings, ...rest } = r;
            return {
                ...rest,
                rating,
                logo_url: getPublicUrl(r.logo_url),
                cover_image_url: getPublicUrl(r.cover_image_url),
            };
        });
        res.json({ success: true, data: result });
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
                cover_image_url: true,
                logo_url: true,
                is_open: true,
                ratings: { select: { restaurant_rating: true } }
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
        const filteredCategories = categories.filter((cat) => cat.menu_items && cat.menu_items.length > 0).map((cat) => ({
            ...cat,
            menu_items: cat.menu_items.map((item) => ({
                ...item,
                image_url: getPublicUrl(item.image_url),
            }))
        }));
        let rating = 0;
        if (restaurant.ratings && restaurant.ratings.length > 0) {
            const sum = restaurant.ratings.reduce((acc, curr) => acc + curr.restaurant_rating, 0);
            rating = Number((sum / restaurant.ratings.length).toFixed(1));
        }
        const { ratings, ...restRestaurant } = restaurant;
        const formattedRestaurant = {
            ...restRestaurant,
            rating,
            logo_url: getPublicUrl(restaurant.logo_url),
            cover_image_url: getPublicUrl(restaurant.cover_image_url),
        };
        res.json({ success: true, data: { restaurant: formattedRestaurant, menu: filteredCategories } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch menu' } });
    }
});
export default router;
//# sourceMappingURL=customer.routes.js.map