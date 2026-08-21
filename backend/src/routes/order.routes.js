import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getIO } from '../socket.js';
import { randomUUID } from 'crypto';
const router = Router();
// Apply auth to all order routes
router.use(authenticate);
// ─── CUSTOMER ROUTES ─────────────────────────────────────────────────────────
// POST /api/orders
router.post('/', authorizeRole(['customer']), async (req, res) => {
    const user = req.user;
    const { restaurant_id, items, payment_method, special_instructions, idempotency_key } = req.body;
    try {
        let address = await prisma.address.findFirst({
            where: { user_id: user.id },
            orderBy: { is_default: 'desc' }
        });
        if (!address) {
            // Auto-create a mock address for MVP if none exists
            address = await prisma.address.create({
                data: {
                    user_id: user.id,
                    label: 'home',
                    address_line: '123 Default MVP Street',
                    city: 'MVP City',
                    state: 'MVP State',
                    pincode: '123456',
                    latitude: 0,
                    longitude: 0,
                    is_default: true
                }
            });
        }
        let item_subtotal = 0;
        const orderItemsData = [];
        for (const item of items) {
            const dbItem = await prisma.menuItem.findUnique({ where: { id: item.menu_item_id } });
            if (!dbItem || !dbItem.is_available) {
                res.status(400).json({ success: false, error: { code: 'ITEM_UNAVAILABLE', message: `Item ${item.name} is unavailable` } });
                return;
            }
            const sub = Number(dbItem.price) * item.quantity;
            item_subtotal += sub;
            orderItemsData.push({
                menu_item_id: dbItem.id,
                name_snapshot: dbItem.name,
                price_snapshot: dbItem.price,
                quantity: item.quantity,
                subtotal: sub
            });
        }
        const delivery_fee = 40.0;
        const platform_fee = 10.0;
        const tax_amount = item_subtotal * 0.05;
        let total_amount = item_subtotal + delivery_fee + platform_fee + tax_amount;
        let discount_amount = 0;
        let valid_coupon_id = null;
        if (req.body.coupon_code) {
            const coupon = await prisma.coupon.findUnique({ where: { code: req.body.coupon_code } });
            if (coupon && coupon.is_active && new Date() >= coupon.valid_from && new Date() <= coupon.valid_until && item_subtotal >= Number(coupon.min_order_value)) {
                if (coupon.discount_type === 'percentage') {
                    discount_amount = item_subtotal * (Number(coupon.discount_value) / 100);
                    if (coupon.max_discount_cap) {
                        discount_amount = Math.min(discount_amount, Number(coupon.max_discount_cap));
                    }
                }
                else {
                    discount_amount = Number(coupon.discount_value);
                }
                total_amount -= discount_amount;
                total_amount = Math.max(0, total_amount);
                valid_coupon_id = coupon.id;
            }
            else {
                res.status(400).json({ success: false, error: { code: 'INVALID_COUPON', message: 'Coupon is invalid, expired, or criteria not met.' } });
                return;
            }
        }
        const order = await prisma.order.create({
            data: {
                customer_id: user.id,
                restaurant_id,
                delivery_address_id: address.id,
                status: 'pending',
                item_subtotal,
                delivery_fee,
                platform_fee,
                tax_amount,
                discount_amount,
                total_amount,
                payment_method: payment_method || 'cod',
                payment_status: payment_method === 'cod' ? 'pending' : 'success',
                idempotency_key: idempotency_key || randomUUID(),
                special_instructions,
                coupon_id: valid_coupon_id,
                order_items: {
                    create: orderItemsData
                }
            },
            include: {
                restaurant: true,
                order_items: true,
                delivery_address: true,
            }
        });
        const io = getIO();
        const orderCreatedPayload = {
            orderId: order.id,
            customerName: user.name,
            totalAmount: total_amount,
            itemsCount: items.length,
            status: 'pending',
            created_at: order.created_at,
            restaurant: order.restaurant,
            customer: { name: user.name, phone: user.phone },
            order_items: order.order_items
        };
        io.to(`restaurant_${restaurant_id}`).emit('order:created', orderCreatedPayload);
        io.to('admin').emit('order:created', orderCreatedPayload);
        res.status(201).json({ success: true, data: order });
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(409).json({ success: false, error: { code: 'DUPLICATE_ORDER', message: 'Order already exists' } });
            return;
        }
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create order' } });
    }
});
// GET /api/orders/my-orders
router.get('/my-orders', authorizeRole(['customer']), async (req, res) => {
    const user = req.user;
    try {
        const orders = await prisma.order.findMany({
            where: { customer_id: user.id },
            include: {
                restaurant: { select: { name: true, logo_url: true, cover_image_url: true, phone: true } },
                order_items: true,
                delivery_partner: { select: { name: true, phone: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } });
    }
});
// GET /api/orders/customer/:id
router.get('/customer/:id', authorizeRole(['customer']), async (req, res) => {
    const user = req.user;
    try {
        const order = await prisma.order.findFirst({
            where: { id: req.params.id, customer_id: user.id },
            include: { restaurant: true, order_items: true, delivery_address: true, delivery_partner: true }
        });
        if (!order) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
            return;
        }
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch order' } });
    }
});
// ─── RESTAURANT ROUTES ───────────────────────────────────────────────────────
// GET /api/orders/restaurant/active
// Fetch active orders for the logged-in restaurant
router.get('/restaurant/active', authorizeRole(['restaurant_partner']), async (req, res) => {
    const user = req.user;
    try {
        const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
        if (!partner) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a restaurant partner' } });
            return;
        }
        const orders = await prisma.order.findMany({
            where: {
                restaurant_id: partner.restaurant_id,
                status: { in: ['pending', 'restaurant_confirmed', 'preparing', 'ready'] }
            },
            include: { order_items: true, customer: { select: { name: true, phone: true } } },
            orderBy: { created_at: 'asc' }
        });
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } });
    }
});
// ─── SHARED PARTNER ROUTES ───────────────────────────────────────────────────
// PUT /api/orders/:id/status
router.put('/:id/status', authorizeRole(['restaurant_partner', 'delivery_partner', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;
    const user = req.user;
    try {
        const order = await prisma.order.findUnique({ where: { id: id } });
        if (!order) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
            return;
        }
        // Restaurant partners can only update orders belonging to their restaurant
        if (user.role === 'restaurant_partner') {
            const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
            if (!partner || partner.restaurant_id !== order.restaurant_id) {
                res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to update this order' } });
                return;
            }
        }
        const updated = await prisma.order.update({
            where: { id: id },
            data: {
                status,
                cancellation_reason: cancellation_reason || null,
                cancelled_by: status === 'cancelled' ? (user.role === 'restaurant_partner' ? 'restaurant' : user.role === 'admin' ? 'admin' : 'customer') : null
            }
        });
        // Determine the correct event name for the customer
        // When a restaurant cancels a pending order, it's a rejection from the customer's perspective
        const io = getIO();
        let customerEventName = `order:${updated.status}`;
        if (updated.status === 'cancelled' && updated.cancelled_by === 'restaurant' && !order.status.match(/accepted|preparing|ready/)) {
            customerEventName = 'order:rejected';
        }
        const payload = {
            orderId: updated.id,
            status: updated.status,
            cancellation_reason: updated.cancellation_reason
        };
        io.to(`customer_${order.customer_id}`).emit(customerEventName, payload);
        io.to('admin').emit(`order:${updated.status}`, payload);
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
    }
});
export default router;
//# sourceMappingURL=order.routes.js.map