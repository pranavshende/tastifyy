import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getIO } from '../socket.js';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const router = Router();

// Apply auth to all order routes
router.use(authenticate);

// ─── CUSTOMER ROUTES ─────────────────────────────────────────────────────────

// POST /api/orders
router.post('/', authorizeRole(['customer']), async (req: Request, res: Response) => {
  const user = req.user as any;
  const { restaurant_id, items, payment_method, special_instructions, idempotency_key } = req.body;

  try {
    const address = await prisma.address.findFirst({
      where: { user_id: user.id },
      orderBy: { is_default: 'desc' }
    });

    if (!address) {
      res.status(400).json({ success: false, error: { code: 'NO_ADDRESS', message: 'Please add a delivery address first' } });
      return;
    }

    let item_subtotal = 0;
    const orderItemsData: any[] = [];

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
    const total_amount = item_subtotal + delivery_fee + platform_fee + tax_amount;

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
        total_amount,
        payment_method: payment_method || 'cod',
        payment_status: payment_method === 'cod' ? 'pending' : 'completed',
        idempotency_key: idempotency_key || randomUUID(),
        special_instructions,
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
    io.to(`restaurant_${restaurant_id}`).emit('new_order', {
      orderId: order.id,
      customerName: user.name,
      totalAmount: total_amount,
      itemsCount: items.length
    });

    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    if (error.code === 'P2002') { 
      res.status(409).json({ success: false, error: { code: 'DUPLICATE_ORDER', message: 'Order already exists' } });
      return;
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create order' } });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authorizeRole(['customer']), async (req: Request, res: Response) => {
  const user = req.user as any;
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
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } });
  }
});

// GET /api/orders/customer/:id
router.get('/customer/:id', authorizeRole(['customer']), async (req: Request, res: Response) => {
  const user = req.user as any;
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
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch order' } });
  }
});

// ─── RESTAURANT ROUTES ───────────────────────────────────────────────────────

// GET /api/orders/restaurant/active
// Fetch active orders for the logged-in restaurant
router.get('/restaurant/active', authorizeRole(['restaurant_partner']), async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
    if (!partner) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a restaurant partner' } });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { 
        restaurant_id: partner.restaurant_id,
        status: { in: ['pending', 'accepted', 'preparing', 'ready_for_pickup'] }
      },
      include: { order_items: true, customer: { select: { name: true, phone: true } } },
      orderBy: { created_at: 'asc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } });
  }
});

// ─── SHARED PARTNER ROUTES ───────────────────────────────────────────────────

// PUT /api/orders/:id/status
router.put('/:id/status', authorizeRole(['restaurant_partner', 'delivery_partner', 'admin']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, cancellation_reason } = req.body;
  const user = req.user as any;
  
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { 
        status, 
        cancellation_reason: cancellation_reason || null,
        cancelled_by: status === 'cancelled' ? (user.role === 'restaurant_partner' ? 'restaurant' : 'delivery_partner') : null
      }
    });

    // Emit socket to customer
    const io = getIO();
    io.to(`customer_${order.customer_id}`).emit('order_status_update', {
      orderId: order.id,
      status: updated.status
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
  }
});

export default router;
