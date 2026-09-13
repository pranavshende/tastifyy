import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';

const router = Router();

router.use(authenticate, authorizeRole(['restaurant_partner']));

// GET /api/coupons/restaurant
router.get('/restaurant', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await prisma.restaurantPartner.findUnique({
      where: { phone: user.phone }
    });
    if (!partner) return res.status(403).json({ success: false, message: 'Not a restaurant partner' });

    const coupons = await prisma.coupon.findMany({
      where: { restaurant_id: partner.restaurant_id },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch coupons' } });
  }
});

// POST /api/coupons
router.post('/', async (req: Request, res: Response) => {
  const user = req.user as any;
  const { code, discount_type, discount_value, min_order_value, max_discount_cap, max_uses_per_user, max_uses_total, valid_from, valid_until, funded_by } = req.body;
  
  try {
    const partner = await prisma.restaurantPartner.findUnique({
      where: { phone: user.phone }
    });
    if (!partner) return res.status(403).json({ success: false, message: 'Not a restaurant partner' });

    // Validate code
    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE_CODE', message: 'Coupon code already exists' } });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount_type,
        discount_value,
        min_order_value,
        max_discount_cap,
        max_uses_per_user,
        max_uses_total,
        valid_from: valid_from ? new Date(valid_from) : new Date(),
        valid_until: valid_until ? new Date(valid_until) : new Date(Date.now() + 30*24*60*60*1000),
        funded_by: funded_by || 'restaurant',
        restaurant_id: partner.restaurant_id,
        is_active: true
      }
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create coupon' } });
  }
});

// PATCH /api/coupons/:id/toggle
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await prisma.restaurantPartner.findUnique({
      where: { phone: user.phone }
    });
    if (!partner) return res.status(403).json({ success: false, message: 'Not a restaurant partner' });

    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id as string } });
    if (!coupon || coupon.restaurant_id !== partner.restaurant_id) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    const updated = await prisma.coupon.update({
      where: { id: coupon.id },
      data: { is_active: !coupon.is_active }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle coupon' } });
  }
});

export default router;
