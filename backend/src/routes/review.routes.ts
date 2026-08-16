import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';

const router = Router();

router.use(authenticate, authorizeRole(['customer']));

// POST /api/reviews
router.post('/', async (req: Request, res: Response) => {
  const user = req.user as any;
  const { order_id, food_rating, restaurant_rating, delivery_rating, review_text } = req.body;

  try {
    // Validate order belongs to user and is delivered
    const order = await prisma.order.findUnique({ where: { id: order_id } });

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }
    if (order.customer_id !== user.id) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Order does not belong to you' } });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Can only rate delivered orders' } });
    }

    // Check if rating already exists
    const existing = await prisma.rating.findUnique({ where: { order_id } });
    if (existing) {
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE', message: 'Order already rated' } });
    }

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
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit review' } });
  }
});

export default router;
