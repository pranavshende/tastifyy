import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getPublicUrl, uploadFile, deleteFile, validateFile, generateFilename } from '../services/storage.service.js';
import multer from 'multer';
import Razorpay from 'razorpay';
import { processRefund } from '../controllers/payment.controller.js';
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
});
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
const router = Router();
// All admin routes require authentication + admin role
router.use(authenticate, authorizeRole(['admin']));
// ─── PROFILE ROUTES ─────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, phone: true, email: true, profile_photo_url: true }
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
    const { name, phone, email } = req.body;
    if (!name || !phone) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and phone are required' } });
        return;
    }
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, phone, email },
            select: { id: true, name: true, phone: true, email: true, profile_photo_url: true }
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
// ─── PLATFORM CONFIG ────────────────────────────────────────────────────────
// GET /admin/config
router.get('/config', async (_req, res) => {
    try {
        const configs = await prisma.adminConfig.findMany();
        res.json({ success: true, data: configs });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch config' } });
    }
});
// PUT /admin/config
router.put('/config', async (req, res) => {
    const adminId = req.user.id;
    const { configs } = req.body;
    if (!Array.isArray(configs)) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'configs must be an array' } });
        return;
    }
    try {
        // Upsert each config
        const updated = await Promise.all(configs.map(c => prisma.adminConfig.upsert({
            where: { key: c.key },
            update: { value: String(c.value), updated_by: adminId },
            create: { key: c.key, value: String(c.value), description: c.description || '', updated_by: adminId }
        })));
        // Log it
        await prisma.adminAuditLog.create({
            data: {
                admin_id: adminId,
                action: 'UPDATE_CONFIG',
                target_type: 'Platform',
                details: { keys_updated: configs.map(c => c.key) }
            }
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update config' } });
    }
});
// ─── PLATFORM METRICS ───────────────────────────────────────────────────────
// GET /admin/dashboard — platform metrics
router.get('/dashboard', async (_req, res) => {
    try {
        const [totalUsers, totalRestaurants, activeRestaurants, pendingRestaurants, totalDeliveryPartners, pendingDeliveryPartners, totalOrders, openComplaints,] = await Promise.all([
            prisma.user.count(),
            prisma.restaurant.count(),
            prisma.restaurant.count({ where: { status: 'active' } }),
            prisma.restaurant.count({ where: { status: 'pending' } }),
            prisma.deliveryPartner.count(),
            prisma.deliveryPartner.count({ where: { status: 'pending' } }),
            prisma.order.count(),
            prisma.supportTicket.count({ where: { status: 'open' } }),
        ]);
        res.json({
            success: true,
            data: {
                totalUsers,
                totalRestaurants,
                activeRestaurants,
                pendingRestaurants,
                totalDeliveryPartners,
                pendingDeliveryPartners,
                totalOrders,
                openComplaints,
            }
        });
    }
    catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' } });
    }
});
// GET /admin/users
router.get('/users', async (req, res) => {
    const search = req.query.search;
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ]
        } : {};
        const [users, total] = await Promise.all([
            prisma.user.findMany({ where, skip, take: parseInt(limit), orderBy: { created_at: 'desc' } }),
            prisma.user.count({ where }),
        ]);
        res.json({ success: true, data: users, total, page: parseInt(page) });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } });
    }
});
// PATCH /admin/users/:id/block
router.patch('/users/:id/block', async (req, res) => {
    const id = req.params.id;
    const { block } = req.body;
    try {
        const user = await prisma.user.update({ where: { id }, data: { is_active: !block } });
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user status' } });
    }
});
// GET /admin/restaurants
router.get('/restaurants', async (req, res) => {
    const status = req.query.status;
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        const where = status ? { status: status } : {};
        const [restaurants, total] = await Promise.all([
            prisma.restaurant.findMany({ where, skip, take: parseInt(limit), include: { documents: true }, orderBy: { created_at: 'desc' } }),
            prisma.restaurant.count({ where }),
        ]);
        res.json({ success: true, data: restaurants, total });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurants' } });
    }
});
// PATCH /admin/restaurants/:id/approve
router.patch('/restaurants/:id/approve', async (req, res) => {
    const id = req.params.id;
    try {
        const restaurant = await prisma.restaurant.update({ where: { id }, data: { status: 'active' } });
        res.json({ success: true, data: restaurant });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve restaurant' } });
    }
});
// PATCH /admin/restaurants/:id/reject
router.patch('/restaurants/:id/reject', async (req, res) => {
    const id = req.params.id;
    const { reason } = req.body;
    try {
        const restaurant = await prisma.restaurant.update({ where: { id }, data: { status: 'rejected' } });
        res.json({ success: true, data: restaurant, reason });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject restaurant' } });
    }
});
// PATCH /admin/restaurants/:id/suspend
router.patch('/restaurants/:id/suspend', async (req, res) => {
    const id = req.params.id;
    try {
        const restaurant = await prisma.restaurant.update({ where: { id }, data: { status: 'suspended' } });
        res.json({ success: true, data: restaurant });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to suspend restaurant' } });
    }
});
// GET /admin/delivery-partners
router.get('/delivery-partners', async (req, res) => {
    const status = req.query.status;
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        const where = status ? { status: status } : {};
        const [partners, total] = await Promise.all([
            prisma.deliveryPartner.findMany({ where, skip, take: parseInt(limit), orderBy: { created_at: 'desc' } }),
            prisma.deliveryPartner.count({ where }),
        ]);
        res.json({ success: true, data: partners, total });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch delivery partners' } });
    }
});
// PATCH /admin/delivery-partners/:id/approve
router.patch('/delivery-partners/:id/approve', async (req, res) => {
    const id = req.params.id;
    try {
        const partner = await prisma.deliveryPartner.update({ where: { id }, data: { status: 'active' } });
        res.json({ success: true, data: partner });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve partner' } });
    }
});
// PATCH /admin/delivery-partners/:id/reject
router.patch('/delivery-partners/:id/reject', async (req, res) => {
    const id = req.params.id;
    const { reason } = req.body;
    try {
        const partner = await prisma.deliveryPartner.update({ where: { id }, data: { status: 'rejected' } });
        res.json({ success: true, data: partner, reason });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject partner' } });
    }
});
// GET /admin/orders
router.get('/orders', async (req, res) => {
    const status = req.query.status;
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        const where = status ? { status: status } : {};
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: { customer: true, restaurant: true, order_items: { include: { menu_item: true } } },
                orderBy: { created_at: 'desc' }
            }),
            prisma.order.count({ where }),
        ]);
        res.json({ success: true, data: orders, total });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } });
    }
});
// GET /admin/support
router.get('/support', async (req, res) => {
    const status = req.query.status;
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        const where = status ? { status: status } : {};
        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: { customer: true, order: true },
                orderBy: { created_at: 'desc' }
            }),
            prisma.supportTicket.count({ where }),
        ]);
        res.json({ success: true, data: tickets, total });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch support tickets' } });
    }
});
// PATCH /admin/support/:id/resolve
router.patch('/support/:id/resolve', async (req, res) => {
    const id = req.params.id;
    const { resolution_notes, issue_refund } = req.body;
    try {
        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                status: 'resolved',
                resolution_notes
            },
            include: { order: true }
        });
        // Handle True Refund if requested
        if (issue_refund && ticket.order_id) {
            if (ticket.order?.payment_status === 'success' && ticket.order?.razorpay_payment_id) {
                const refundResult = await processRefund(ticket.order_id, resolution_notes || 'Admin support refund');
                if (refundResult.success) {
                    await prisma.order.update({
                        where: { id: ticket.order_id },
                        data: { status: 'cancelled' }
                    });
                    await prisma.adminAuditLog.create({
                        data: {
                            admin_id: req.user.id,
                            action: 'REFUND_PROCESSED',
                            target_type: 'Order',
                            target_id: ticket.order_id,
                            details: { amount: Number(ticket.order.total_amount), reason: resolution_notes }
                        }
                    });
                }
                else {
                    console.error(`[Admin Refund Failed] Order ${ticket.order_id}:`, refundResult.error);
                    // If refund fails, do not mark the order as cancelled so state remains consistent
                    return res.status(500).json({ success: false, error: { code: 'REFUND_FAILED', message: refundResult.error } });
                }
            }
            else {
                // Just cancel if not paid online
                await prisma.order.update({
                    where: { id: ticket.order_id },
                    data: { status: 'cancelled' }
                });
                await prisma.adminAuditLog.create({
                    data: {
                        admin_id: req.user.id,
                        action: 'ORDER_CANCELLED',
                        target_type: 'Order',
                        target_id: ticket.order_id,
                        details: { reason: resolution_notes }
                    }
                });
            }
        }
        res.json({ success: true, data: ticket });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve ticket' } });
    }
});
// GET /admin/audit-logs
router.get('/audit-logs', async (req, res) => {
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const action = req.query.action;
    try {
        const where = action ? { action } : {};
        const [logs, total] = await Promise.all([
            prisma.adminAuditLog.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: { admin: { select: { name: true, email: true } } },
                orderBy: { created_at: 'desc' }
            }),
            prisma.adminAuditLog.count({ where })
        ]);
        res.json({ success: true, data: logs, total, page: parseInt(page) });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit logs' } });
    }
});
// ─── PAYOUTS ─────────────────────────────────────────────────────────────────
// GET /admin/payouts
router.get('/payouts', async (req, res) => {
    const status = req.query.status;
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        const where = status ? { payout_status: status } : {};
        const [assignments, total] = await Promise.all([
            prisma.deliveryAssignment.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: { partner: true, order: true },
                orderBy: { created_at: 'desc' }
            }),
            prisma.deliveryAssignment.count({ where }),
        ]);
        res.json({ success: true, data: assignments, total, page: parseInt(page) });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payouts' } });
    }
});
export default router;
//# sourceMappingURL=admin.routes.js.map