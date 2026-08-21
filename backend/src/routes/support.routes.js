import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
const router = Router();
router.use(authenticate, authorizeRole(['customer']));
// GET /api/support — List my tickets
router.get('/', async (req, res) => {
    const user = req.user;
    try {
        const tickets = await prisma.supportTicket.findMany({
            where: { customer_id: user.id },
            orderBy: { created_at: 'desc' },
            include: {
                order: { select: { restaurant: { select: { name: true } }, total_amount: true } }
            }
        });
        res.json({ success: true, data: tickets });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch support tickets' } });
    }
});
// POST /api/support — Create a ticket
router.post('/', async (req, res) => {
    const user = req.user;
    const { order_id, category, description } = req.body;
    try {
        if (order_id) {
            const order = await prisma.order.findUnique({ where: { id: order_id } });
            if (!order || order.customer_id !== user.id) {
                return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Invalid order ID' } });
            }
        }
        const ticket = await prisma.supportTicket.create({
            data: {
                customer_id: user.id,
                order_id: order_id || null,
                category,
                description,
                status: 'open'
            }
        });
        res.status(201).json({ success: true, data: ticket });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create support ticket' } });
    }
});
export default router;
//# sourceMappingURL=support.routes.js.map