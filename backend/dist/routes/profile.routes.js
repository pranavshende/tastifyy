import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { uploadFile, deleteFile, validateFile, generateFilename, getPublicUrl } from '../services/storage.service.js';
import multer from 'multer';
const router = Router();
// All profile routes require restaurant_partner auth
router.use(authenticate, authorizeRole(['restaurant_partner']));
// Multer — store in memory so we can pipe to Supabase
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB hard limit at express level
});
// ─── Middleware: Attach restaurant_id ────────────────────────────────────────
const attachRestaurant = async (req, res, next) => {
    const user = req.user;
    try {
        const partner = await prisma.restaurantPartner.findFirst({
            where: { phone: user.phone },
            include: { restaurant: true },
        });
        if (!partner?.restaurant) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No active restaurant found for this user' } });
            return;
        }
        req.restaurant_id = partner.restaurant.id;
        req.partner = partner;
        next();
    }
    catch {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify restaurant access' } });
    }
};
router.use(attachRestaurant);
// ─── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id },
            include: { operating_hours: { orderBy: { day_of_week: 'asc' } } },
        });
        if (!restaurant) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Restaurant not found' } });
            return;
        }
        // Build public URLs from storage paths
        const result = {
            ...restaurant,
            logo_url: getPublicUrl(restaurant.logo_url),
            cover_image_url: getPublicUrl(restaurant.cover_image_url),
        };
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } });
    }
});
// ─── PUT /api/profile ─────────────────────────────────────────────────────────
router.put('/', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { name, description, phone, email, address_line, city, state, pincode, cuisine_tags, type, is_pure_veg, avg_preparation_time_mins, service_radius_km, is_open, } = req.body;
    try {
        const updated = await prisma.restaurant.update({
            where: { id: restaurant_id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { owner_name: description }), // store description in owner_name for now
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(address_line !== undefined && { address_line }),
                ...(city !== undefined && { city }),
                ...(state !== undefined && { state }),
                ...(pincode !== undefined && { pincode }),
                ...(cuisine_tags !== undefined && { cuisine_tags }),
                ...(type !== undefined && { type }),
                ...(is_pure_veg !== undefined && { is_pure_veg }),
                ...(avg_preparation_time_mins !== undefined && { avg_preparation_time_mins: parseInt(avg_preparation_time_mins) }),
                ...(service_radius_km !== undefined && { service_radius_km: parseFloat(service_radius_km) }),
                ...(is_open !== undefined && { is_open }),
            },
            include: { operating_hours: true },
        });
        const result = {
            ...updated,
            logo_url: getPublicUrl(updated.logo_url),
            cover_image_url: getPublicUrl(updated.cover_image_url),
        };
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } });
    }
});
// ─── PATCH /api/profile/accepting-orders ─────────────────────────────────────
router.patch('/accepting-orders', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { is_open } = req.body;
    if (is_open === undefined) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'is_open is required' } });
        return;
    }
    try {
        const updated = await prisma.restaurant.update({
            where: { id: restaurant_id },
            data: { is_open },
        });
        res.json({ success: true, data: { is_open: updated.is_open } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
    }
});
// ─── POST /api/profile/logo ───────────────────────────────────────────────────
router.post('/logo', upload.single('image'), async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const file = req.file;
    if (!file) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No file provided' } });
        return;
    }
    const validation = validateFile(file.buffer, file.mimetype, file.size);
    if (!validation.valid) {
        res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
        return;
    }
    try {
        // Get existing logo to delete old one
        const existing = await prisma.restaurant.findUnique({ where: { id: restaurant_id }, select: { logo_url: true } });
        if (existing?.logo_url) {
            await deleteFile(existing.logo_url);
        }
        const filename = generateFilename(file.originalname, 'profile');
        const { path, publicUrl } = await uploadFile(restaurant_id, 'profile', filename, file.buffer, file.mimetype);
        await prisma.restaurant.update({
            where: { id: restaurant_id },
            data: { logo_url: path },
        });
        res.json({ success: true, data: { logo_url: publicUrl, path } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { code: 'UPLOAD_FAILED', message: error.message || 'Failed to upload logo' } });
    }
});
// ─── DELETE /api/profile/logo ─────────────────────────────────────────────────
router.delete('/logo', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    try {
        const existing = await prisma.restaurant.findUnique({ where: { id: restaurant_id }, select: { logo_url: true } });
        if (existing?.logo_url) {
            await deleteFile(existing.logo_url);
        }
        await prisma.restaurant.update({ where: { id: restaurant_id }, data: { logo_url: null } });
        res.json({ success: true, message: 'Logo deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete logo' } });
    }
});
// ─── POST /api/profile/cover ──────────────────────────────────────────────────
router.post('/cover', upload.single('image'), async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const file = req.file;
    if (!file) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No file provided' } });
        return;
    }
    const validation = validateFile(file.buffer, file.mimetype, file.size);
    if (!validation.valid) {
        res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
        return;
    }
    try {
        const existing = await prisma.restaurant.findUnique({ where: { id: restaurant_id }, select: { cover_image_url: true } });
        if (existing?.cover_image_url) {
            await deleteFile(existing.cover_image_url);
        }
        const filename = generateFilename(file.originalname, 'cover');
        const { path, publicUrl } = await uploadFile(restaurant_id, 'cover', filename, file.buffer, file.mimetype);
        await prisma.restaurant.update({
            where: { id: restaurant_id },
            data: { cover_image_url: path },
        });
        res.json({ success: true, data: { cover_image_url: publicUrl, path } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { code: 'UPLOAD_FAILED', message: error.message || 'Failed to upload cover' } });
    }
});
// ─── DELETE /api/profile/cover ────────────────────────────────────────────────
router.delete('/cover', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    try {
        const existing = await prisma.restaurant.findUnique({ where: { id: restaurant_id }, select: { cover_image_url: true } });
        if (existing?.cover_image_url) {
            await deleteFile(existing.cover_image_url);
        }
        await prisma.restaurant.update({ where: { id: restaurant_id }, data: { cover_image_url: null } });
        res.json({ success: true, message: 'Cover deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete cover' } });
    }
});
// ─── PUT /api/profile/hours ───────────────────────────────────────────────────
router.put('/hours', async (req, res) => {
    const restaurant_id = req.restaurant_id;
    const { hours } = req.body;
    // hours: Array<{ day_of_week: string, open_time: string, close_time: string, is_closed: boolean }>
    if (!Array.isArray(hours)) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'hours must be an array' } });
        return;
    }
    try {
        // Delete all existing hours for this restaurant and recreate
        await prisma.restaurantOperatingHour.deleteMany({ where: { restaurant_id } });
        const created = await prisma.restaurantOperatingHour.createMany({
            data: hours.map((h) => ({
                restaurant_id,
                day_of_week: h.day_of_week,
                open_time: new Date(`1970-01-01T${h.open_time}:00Z`),
                close_time: new Date(`1970-01-01T${h.close_time}:00Z`),
                is_closed: h.is_closed ?? false,
            })),
        });
        res.json({ success: true, data: created });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save operating hours' } });
    }
});
export default router;
//# sourceMappingURL=profile.routes.js.map