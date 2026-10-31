import { Router } from 'express';
import { authenticate, authorizeRole, optionalAuthenticate } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getPublicUrl, uploadFile, deleteFile, validateFile, generateFilename } from '../services/storage.service.js';
import multer from 'multer';
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
const router = Router();
const customerAuth = [authenticate, authorizeRole(['customer'])];
router.use('/notifications', customerAuth);
router.use('/favorites', customerAuth);
router.use('/profile', customerAuth);
router.use('/addresses', customerAuth);
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
// GET /api/customer/restaurants?filter=for_you|trending|top_rated|fast_delivery|offers|veg
// Returns active restaurants, optionally sorted/filtered by the given filter.
router.get('/restaurants', optionalAuthenticate, async (req, res) => {
    const filter = req.query.filter || 'all';
    const customerId = req.user?.id;
    try {
        const baseWhere = {
            status: 'active',
            approval_status: 'approved',
            account_status: 'active',
            visibility_status: 'visible',
        };
        // ── Build filter-specific where + orderBy ─────────────────────────
        let extraWhere = {};
        let orderBy = { created_at: 'desc' };
        if (filter === 'veg') {
            extraWhere = { is_pure_veg: true };
        }
        else if (filter === 'fast_delivery') {
            orderBy = { avg_preparation_time_mins: 'asc' };
        }
        else if (filter === 'offers') {
            const now = new Date();
            // Only show restaurants that have active coupons right now
            extraWhere = {
                coupons: {
                    some: {
                        is_active: true,
                        valid_from: { lte: now },
                        valid_until: { gte: now }
                    }
                }
            };
        }
        const restaurants = await prisma.restaurant.findMany({
            where: { ...baseWhere, ...extraWhere },
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
                created_at: true,
                ratings: { select: { restaurant_rating: true } },
                menu_items: {
                    where: { is_available: true, is_deleted: false },
                    select: { id: true, name: true, price: true, image_url: true, is_veg: true, is_bestseller: true },
                    take: 6,
                    orderBy: [{ is_bestseller: 'desc' }, { created_at: 'asc' }]
                },
                coupons: {
                    where: {
                        is_active: true,
                        valid_from: { lte: new Date() },
                        valid_until: { gte: new Date() }
                    },
                    select: { id: true, code: true, discount_type: true, discount_value: true },
                    take: 1
                },
                orders: filter === 'trending' ? {
                    where: { created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, status: 'delivered' },
                    select: { id: true }
                } : undefined
            },
            orderBy
        });
        // ── Post-process ──────────────────────────────────────────────────
        let result = restaurants.map((r) => {
            let rating = 0;
            let reviews_count = 0;
            if (r.ratings && r.ratings.length > 0) {
                const sum = r.ratings.reduce((acc, curr) => acc + curr.restaurant_rating, 0);
                rating = Number((sum / r.ratings.length).toFixed(1));
                reviews_count = r.ratings.length;
            }
            const recent_orders = r.orders ? r.orders.length : undefined;
            const active_offer = r.coupons && r.coupons.length > 0 ? r.coupons[0] : null;
            return {
                id: r.id,
                name: r.name,
                type: r.type,
                address_line: r.address_line,
                city: r.city,
                is_pure_veg: r.is_pure_veg,
                cuisine_tags: r.cuisine_tags,
                avg_preparation_time_mins: r.avg_preparation_time_mins,
                is_open: r.is_open,
                created_at: r.created_at,
                rating,
                reviews_count,
                recent_orders,
                has_offer: !!active_offer,
                active_offer,
                logo_url: getPublicUrl(r.logo_url),
                cover_image_url: getPublicUrl(r.cover_image_url),
                menu_items: Array.isArray(r.menu_items) ? r.menu_items.map((m) => ({
                    id: m.id,
                    name: m.name,
                    price: Number(m.price),
                    image_url: getPublicUrl(m.image_url),
                    is_veg: m.is_veg,
                    is_bestseller: m.is_bestseller
                })) : [],
            };
        });
        // ── Filter/sort by filter type ────────────────────────────────────
        if (filter === 'trending') {
            result = result.sort((a, b) => (b.recent_orders || 0) - (a.recent_orders || 0));
        }
        else if (filter === 'top_rated') {
            result = result.sort((a, b) => b.rating - a.rating);
        }
        else if (filter === 'for_you') {
            // Find restaurants this customer has ordered from before
            const pastOrders = await prisma.order.findMany({
                where: { customer_id: customerId },
                select: { restaurant_id: true },
                distinct: ['restaurant_id'],
                take: 20
            });
            const pastRestaurantIds = new Set(pastOrders.map((o) => o.restaurant_id));
            // Sort: past restaurants first, then by rating
            result = result.sort((a, b) => {
                const aWas = pastRestaurantIds.has(a.id) ? 1 : 0;
                const bWas = pastRestaurantIds.has(b.id) ? 1 : 0;
                if (bWas !== aWas)
                    return bWas - aWas;
                return b.rating - a.rating;
            });
        }
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('Restaurants fetch error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurants' } });
    }
});
// GET /api/customer/restaurants/:id/menu
// Fetch restaurant details and its active menu items, grouped by category
router.get('/restaurants/:id/menu', optionalAuthenticate, async (req, res) => {
    const id = req.params.id;
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: {
                id,
                status: 'active',
                approval_status: 'approved',
                account_status: 'active',
                visibility_status: 'visible'
            },
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
                    where: { is_available: true, is_deleted: false },
                    orderBy: { name: 'asc' },
                    include: {
                        customizations: {
                            include: {
                                options: {
                                    where: { is_available: true },
                                    orderBy: { additional_price: 'asc' }
                                }
                            }
                        }
                    }
                }
            }
        });
        // Filter out empty categories for the customer view
        const filteredCategories = categories
            .filter((cat) => cat.menu_items && cat.menu_items.length > 0)
            .map((cat) => ({
            ...cat,
            menu_items: cat.menu_items.map((item) => ({
                ...item,
                image_url: getPublicUrl(item.image_url),
                // Separate variants from regular customizations and addons
                variants: item.customizations
                    .filter((c) => c.variant_group)
                    .flatMap((c) => c.options.map((o) => ({
                    id: o.id,
                    group_id: c.id,
                    group_name: c.group_name,
                    label: o.label,
                    additional_price: Number(o.additional_price),
                    is_available: o.is_available
                }))),
                customizations: item.customizations.filter((c) => !c.variant_group && !c.is_addon),
                has_variants: item.customizations.some((c) => c.variant_group),
            }))
        }));
        // Fetch restaurant-level add-ons (is_addon=true items linked to any category's items)
        const addonGroups = await prisma.menuItemCustomization.findMany({
            where: {
                is_addon: true,
                menu_item: { restaurant_id: id, is_deleted: false }
            },
            include: {
                options: { where: { is_available: true }, orderBy: { additional_price: 'asc' } },
                menu_item: { select: { restaurant_id: true } }
            },
            distinct: ['group_name']
        });
        const addons = addonGroups.flatMap((g) => g.options.map((o) => ({
            group_id: g.id,
            group_name: g.group_name,
            option_id: o.id,
            label: o.label,
            price: Number(o.additional_price),
            is_available: o.is_available
        })));
        let rating = 0;
        if (restaurant.ratings && restaurant.ratings.length > 0) {
            const sum = restaurant.ratings.reduce((acc, curr) => acc + curr.restaurant_rating, 0);
            rating = Number((sum / restaurant.ratings.length).toFixed(1));
        }
        const { ratings, ...restRestaurant } = restaurant;
        const formattedRestaurant = {
            ...restRestaurant,
            rating,
            reviews_count: restaurant.ratings.length,
            logo_url: getPublicUrl(restaurant.logo_url),
            cover_image_url: getPublicUrl(restaurant.cover_image_url),
        };
        res.json({ success: true, data: { restaurant: formattedRestaurant, menu: filteredCategories, addons } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch menu' } });
    }
});
export default router;
//# sourceMappingURL=customer.routes.js.map