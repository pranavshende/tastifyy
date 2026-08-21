import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getIO } from '../socket.js';
const router = Router();
router.use(authenticate, authorizeRole(['delivery_partner']));
// Helper to get partner id
const getPartnerId = async (userId) => {
    const partner = await prisma.deliveryPartner.findUnique({ where: { user_id: userId } });
    return partner?.id;
};
// GET /delivery/orders/available — fetch orders needing a rider
router.get('/orders/available', async (req, res) => {
    try {
        const partnerId = await getPartnerId(req.user.id);
        if (!partnerId)
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a delivery partner' } });
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['restaurant_confirmed', 'preparing', 'ready'] },
                delivery_partner_id: null
            },
            include: {
                restaurant: { select: { name: true, address_line: true, city: true, phone: true } },
                delivery_address: true,
            },
            orderBy: { created_at: 'asc' }
        });
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch available orders' } });
    }
});
// GET /delivery/orders/active — fetch my currently assigned active order
router.get('/orders/active', async (req, res) => {
    try {
        const partnerId = await getPartnerId(req.user.id);
        if (!partnerId)
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a delivery partner' } });
        const order = await prisma.order.findFirst({
            where: {
                delivery_partner_id: partnerId,
                status: { in: ['ready', 'out_for_delivery'] }
            },
            include: {
                restaurant: { select: { name: true, address_line: true, city: true, phone: true } },
                delivery_address: true,
                customer: { select: { name: true, phone: true } }
            }
        });
        res.json({ success: true, data: order }); // order can be null
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch active order' } });
    }
});
// POST /delivery/orders/:id/accept — accept an available order
router.post('/orders/:id/accept', async (req, res) => {
    try {
        const partnerId = await getPartnerId(req.user.id);
        if (!partnerId)
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a delivery partner' } });
        const id = req.params.id;
        // Ensure it's not already assigned
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order || order.delivery_partner_id) {
            return res.status(400).json({ success: false, error: { code: 'UNAVAILABLE', message: 'Order is no longer available' } });
        }
        const [updatedOrder] = await prisma.$transaction([
            prisma.order.update({
                where: { id },
                data: { delivery_partner_id: partnerId }
            }),
            prisma.deliveryAssignment.create({
                data: {
                    order_id: id,
                    partner_id: partnerId,
                    status: 'accepted',
                    earning_amount: 30.00, // MVP flat earning
                    pickup_distance_km: 2.5,
                    delivery_distance_km: 4.2
                }
            })
        ]);
        res.json({ success: true, data: updatedOrder });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept order' } });
    }
});
// PATCH /delivery/status — toggle online/offline
router.patch('/status', async (req, res) => {
    const user = req.user;
    const { is_online } = req.body;
    try {
        const partner = await prisma.deliveryPartner.update({
            where: { user_id: user.id },
            data: { is_online }
        });
        res.json({ success: true, data: partner });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update availability status' } });
    }
});
// GET /delivery/dashboard — partner home stats
router.get('/dashboard', async (req, res) => {
    const user = req.user;
    try {
        const partner = await prisma.deliveryPartner.findUnique({ where: { user_id: user.id } });
        if (!partner) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Delivery partner profile not found' } });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [todayDeliveries, todayEarnings] = await Promise.all([
            prisma.deliveryAssignment.count({
                where: { partner_id: partner.id, status: 'delivered', updated_at: { gte: today } }
            }),
            prisma.deliveryAssignment.aggregate({
                where: { partner_id: partner.id, status: 'delivered', updated_at: { gte: today } },
                _sum: { earning_amount: true }
            }),
        ]);
        res.json({
            success: true,
            data: {
                is_online: partner.is_online,
                status: partner.status,
                today_deliveries: todayDeliveries,
                today_earnings: todayEarnings._sum.earning_amount || 0,
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard' } });
    }
});
export default router;
//# sourceMappingURL=delivery.routes.js.map