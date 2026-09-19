import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
const router = Router();
router.use(authenticate);
// POST /api/reviews — submit a review (also accessible as /api/orders/:id/rate via alias)
router.post('/', authorizeRole(['customer']), async (req, res) => {
    const user = req.user;
    const { order_id, food_rating, restaurant_rating, delivery_rating, review_text } = req.body;
    try {
        const order = await prisma.order.findUnique({ where: { id: order_id } });
        if (!order)
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
        if (order.customer_id !== user.id)
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Order does not belong to you' } });
        if (order.status !== 'delivered')
            return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Can only rate delivered orders' } });
        const existing = await prisma.rating.findUnique({ where: { order_id } });
        if (existing)
            return res.status(400).json({ success: false, error: { code: 'DUPLICATE', message: 'Order already rated' } });
        const rating = await prisma.rating.create({
            data: {
                order_id,
                customer_id: user.id,
                restaurant_id: order.restaurant_id,
                delivery_partner_id: order.delivery_partner_id,
                food_rating,
                restaurant_rating,
                delivery_rating,
                review_text
            }
        });
        res.status(201).json({ success: true, data: rating });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit review' } });
    }
});
// GET /api/reviews/restaurant/:id — get all reviews for a restaurant (visible to restaurant partner)
router.get('/restaurant/:id', authorizeRole(['restaurant_partner', 'admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const ratings = await prisma.rating.findMany({
            where: { restaurant_id: id },
            include: { customer: { select: { name: true, profile_photo_url: true } } },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        const avg = ratings.length > 0 ? {
            food: Number((ratings.reduce((s, r) => s + r.food_rating, 0) / ratings.length).toFixed(1)),
            restaurant: Number((ratings.reduce((s, r) => s + r.restaurant_rating, 0) / ratings.length).toFixed(1)),
            delivery: ratings.filter(r => r.delivery_rating).length > 0
                ? Number((ratings.filter(r => r.delivery_rating).reduce((s, r) => s + (r.delivery_rating || 0), 0) / ratings.filter(r => r.delivery_rating).length).toFixed(1))
                : null
        } : null;
        res.json({ success: true, data: { ratings, avg, total: ratings.length } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reviews' } });
    }
});
// GET /api/reviews/order/:orderId — check if a customer already rated an order
router.get('/order/:orderId', authorizeRole(['customer']), async (req, res) => {
    const { orderId } = req.params;
    try {
        const rating = await prisma.rating.findUnique({ where: { order_id: orderId } });
        res.json({ success: true, data: rating });
    }
    catch (error) {
        if (error.code === 'P2023' || error.message?.includes('uuid')) {
            return res.json({ success: true, data: null });
        }
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rating' } });
    }
});
export default router;
//# sourceMappingURL=review.routes.js.map