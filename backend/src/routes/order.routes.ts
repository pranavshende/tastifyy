import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { findRestaurantPartner, findRestaurantUserByRestaurantId } from '../utils/restaurantPartner.js';
import { getIO } from '../socket.js';
import type { Request, Response } from 'express';
import crypto, { randomUUID } from 'crypto';
import Razorpay from 'razorpay';
import { scheduleOrderTimeout, cancelOrderTimeout, payoutQueue, smsQueue, assignmentQueue, notificationQueue, refundQueue } from '../jobs/queues.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
});

const router = Router();

// Apply auth to all order routes
router.use(authenticate);

// ─── CUSTOMER ROUTES ─────────────────────────────────────────────────────────

// POST /api/orders/validate-coupon
router.post('/validate-coupon', authorizeRole(['customer']), async (req: Request, res: Response) => {
  const user = req.user as any;
  const { code, restaurant_id, item_subtotal } = req.body;

  try {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon || !coupon.is_active) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_COUPON', message: 'Invalid or expired coupon' } });
    }

    const now = new Date();
    if (coupon.valid_until && coupon.valid_until < now) {
      return res.status(400).json({ success: false, error: { code: 'EXPIRED_COUPON', message: 'This coupon has expired' } });
    }
    if (coupon.valid_from && coupon.valid_from > now) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_COUPON', message: 'This coupon is not yet active' } });
    }

    if (coupon.restaurant_id && coupon.restaurant_id !== restaurant_id) {
      return res.status(400).json({ success: false, error: { code: 'RESTAURANT_MISMATCH', message: 'This coupon is not valid for this restaurant' } });
    }

    if (item_subtotal < Number(coupon.min_order_value || 0)) {
      return res.status(400).json({ success: false, error: { code: 'MIN_VALUE_NOT_MET', message: `Minimum order value of ₹${coupon.min_order_value} required` } });
    }

    const usageCount = await prisma.order.count({ where: { customer_id: user.id, coupon_id: coupon.id, status: { notIn: ['cancelled', 'rejected'] } } });
    if (coupon.max_uses_per_user && usageCount >= coupon.max_uses_per_user) {
      return res.status(400).json({ success: false, error: { code: 'MAX_USES_REACHED', message: 'You have reached the maximum usage limit for this coupon' } });
    }
    
    if (coupon.max_uses_total) {
      const totalUsage = await prisma.order.count({ where: { coupon_id: coupon.id, status: { notIn: ['cancelled', 'rejected'] } } });
      if (totalUsage >= coupon.max_uses_total) {
        return res.status(400).json({ success: false, error: { code: 'COUPON_DEPLETED', message: 'This coupon is fully redeemed' } });
      }
    }

    let discount_amount = 0;
    if (coupon.discount_type === 'flat') {
      discount_amount = Number(coupon.discount_value);
    } else if (coupon.discount_type === 'percentage') {
      discount_amount = (item_subtotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_cap) {
        discount_amount = Math.min(discount_amount, Number(coupon.max_discount_cap));
      }
    }

    // Never discount more than subtotal
    discount_amount = Math.min(discount_amount, item_subtotal);

    res.json({ success: true, data: { discount_amount, code: coupon.code, id: coupon.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to validate coupon' } });
  }
});

// POST /api/orders
router.post('/', authorizeRole(['customer']), async (req: Request, res: Response) => {
  const user = req.user as any;
  const { restaurant_id, items, payment_method, special_instructions, idempotency_key } = req.body;

  try {
    if (!restaurant_id || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Restaurant and at least one item are required.' } });
      return;
    }
    let address;
    if (req.body.delivery_address_id) {
      address = await prisma.address.findUnique({
        where: { id: req.body.delivery_address_id, user_id: user.id }
      });
    } else {
      address = await prisma.address.findFirst({
        where: { user_id: user.id },
        orderBy: { is_default: 'desc' }
      });
    }

    if (!address) {
      res.status(400).json({ success: false, error: { code: 'NO_ADDRESS', message: 'A valid delivery address is required before checking out.' } });
      return;
    }

    if (!req.body.confirm_address) {
      res.status(400).json({ success: false, error: { code: 'ADDRESS_NOT_CONFIRMED', message: 'You must explicitly confirm your delivery address before placing an order.' } });
      return;
    }

    let item_subtotal = 0;
    const orderItemsData: any[] = [];

    const firstItem = await prisma.menuItem.findUnique({ where: { id: items[0].menu_item_id } });
    if (!firstItem) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ITEM', message: 'Item not found' } });
      return;
    }
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurant_id } });

    if (!restaurant) {
      res.status(400).json({ success: false, error: { code: 'INVALID_RESTAURANT', message: 'Restaurant not found' } });
      return;
    }

    if (restaurant.status !== 'active') {
      res.status(400).json({ success: false, error: { code: 'RESTAURANT_INACTIVE', message: 'This restaurant is not currently available.' } });
      return;
    }

    if (!restaurant.is_open) {
      res.status(400).json({ success: false, error: { code: 'RESTAURANT_CLOSED', message: 'This restaurant is not accepting orders right now.' } });
      return;
    }

    // Haversine Distance Check (only if coordinates are present)
    let distanceKm = 0;
    if (Number(address.latitude) !== 0 || Number(address.longitude) !== 0) {
      const R = 6371; // Earth radius in km
      const dLat = (Number(restaurant.latitude) - Number(address.latitude)) * Math.PI / 180;
      const dLon = (Number(restaurant.longitude) - Number(address.longitude)) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(Number(address.latitude) * Math.PI / 180) * Math.cos(Number(restaurant.latitude) * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distanceKm = R * c;

      if (distanceKm > Number(restaurant.service_radius_km || 5)) {
        res.status(400).json({ success: false, error: { code: 'OUT_OF_RANGE', message: `Delivery address is ${distanceKm.toFixed(1)}km away, which exceeds the restaurant's ${restaurant.service_radius_km}km service radius.` } });
        return;
      }
    }

    for (const item of items) {
      const dbItem = await prisma.menuItem.findUnique({ where: { id: item.menu_item_id } });
      if (!dbItem || dbItem.restaurant_id !== restaurant_id || !dbItem.is_available) {
        res.status(400).json({ success: false, error: { code: 'ITEM_UNAVAILABLE', message: `Item ${item.name} is unavailable` } });
        return;
      }
      
      if (dbItem.stock_quantity !== null && dbItem.stock_quantity < item.quantity) {
        res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_STOCK', message: `Not enough stock for ${dbItem.name}. Only ${dbItem.stock_quantity} left.` } });
        return;
      }
      
      let customizationsCost = 0;
      let customizationsSnapshot = null;
      
      if (item.customizations && Array.isArray(item.customizations) && item.customizations.length > 0) {
        const optionIds = item.customizations.map((c: any) => typeof c === 'string' ? c : c.option_id);
        const options = await prisma.menuItemCustomizationOption.findMany({
          where: { id: { in: optionIds } }
        });
        
        customizationsCost = options.reduce((sum, opt) => sum + Number(opt.additional_price || 0), 0);
        customizationsSnapshot = options.map(opt => ({
          name: opt.label,
          price: Number(opt.additional_price || 0)
        }));
      }

      const sub = (Number(dbItem.price) + customizationsCost) * item.quantity;
      item_subtotal += sub;

      orderItemsData.push({
        menu_item_id: dbItem.id,
        name_snapshot: dbItem.name,
        price_snapshot: dbItem.price,
        customizations_snapshot: customizationsSnapshot,
        quantity: item.quantity,
        subtotal: sub
      });
    }

    const configs = await prisma.adminConfig.findMany({
      where: { key: { in: ['PLATFORM_FEE', 'DELIVERY_BASE_FEE', 'DELIVERY_PER_KM_FEE'] } }
    });
    const configMap = configs.reduce((acc: any, c: any) => ({ ...acc, [c.key]: Number(c.value) }), {});
    
    const platform_fee = Math.min(configMap['PLATFORM_FEE'] || 5.0, 5.0);
    
    // Distance-based affordable launch delivery fee
    let calculated_delivery_fee = 20;
    if (distanceKm > 2 && distanceKm <= 5) {
      calculated_delivery_fee = 22;
    } else if (distanceKm > 5) {
      calculated_delivery_fee = 25;
    }
    const delivery_fee = Math.min(calculated_delivery_fee, 25);
    const tax_amount = item_subtotal * 0.02;
    let total_amount = item_subtotal + delivery_fee + platform_fee + tax_amount;
    let discount_amount = 0;
    let valid_coupon_id = null;
    let platform_discount_share = 0;
    let restaurant_discount_share = 0;

    if (req.body.coupon_code) {
      const coupon = await prisma.coupon.findUnique({ where: { code: req.body.coupon_code } });
      if (coupon && coupon.is_active && new Date() >= coupon.valid_from && new Date() <= coupon.valid_until && item_subtotal >= Number(coupon.min_order_value)) {
        if (coupon.discount_type === 'percentage') {
          discount_amount = item_subtotal * (Number(coupon.discount_value) / 100);
          if (coupon.max_discount_cap) {
            discount_amount = Math.min(discount_amount, Number(coupon.max_discount_cap));
          }
        } else {
          discount_amount = Number(coupon.discount_value);
        }
        
        if (coupon.funded_by === 'platform') {
          platform_discount_share = discount_amount;
        } else if (coupon.funded_by === 'restaurant') {
          restaurant_discount_share = discount_amount;
        } else if (coupon.funded_by === 'shared') {
          platform_discount_share = discount_amount / 2;
          restaurant_discount_share = discount_amount / 2;
        }

        total_amount -= discount_amount;
        total_amount = Math.max(0, total_amount);
        valid_coupon_id = coupon.id;
      } else {
        res.status(400).json({ success: false, error: { code: 'INVALID_COUPON', message: 'Coupon is invalid, expired, or criteria not met.' } });
        return;
      }
    }

    let razorpay_order_id = null;

    const commissionRate = Number(restaurant!.commission_rate || 0);
    const restaurant_commission = item_subtotal * (commissionRate / 100);
    let restaurant_transfer = item_subtotal - restaurant_commission - restaurant_discount_share;
    restaurant_transfer = Math.max(0, restaurant_transfer);

    if (payment_method && payment_method !== 'cod') {
      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurant_id } });
      const transfers: any[] = [];
      let isTransferReady = false;

      // Check if restaurant is activated and 24h cooling period has passed
      if (restaurant?.razorpay_account_id) {
        if (restaurant.route_account_status === 'active') {
          isTransferReady = true;
        } else if (restaurant.route_account_status === 'activated' && restaurant.route_activated_at) {
          const coolingPeriodMs = 24 * 60 * 60 * 1000;
          if (Date.now() >= restaurant.route_activated_at.getTime() + coolingPeriodMs) {
            isTransferReady = true;
            // Promote to active
            await prisma.restaurant.update({
              where: { id: restaurant.id },
              data: { route_account_status: 'active' }
            });
          }
        }
      }

      if (isTransferReady) {
        if (restaurant_transfer > 0) {
          transfers.push({
            account: restaurant!.razorpay_account_id,
            amount: Math.round(restaurant_transfer * 100),
            currency: 'INR',
            notes: { type: 'restaurant_payout' },
            linked_account_notes: ['type'],
            on_hold: 1
          });
        }
      }

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are not configured. Cannot process online payment.');
      }

      const rzpOrder: any = await razorpay.orders.create({
        amount: Math.round(total_amount * 100),
        currency: 'INR',
        receipt: `rcpt_${randomUUID().substring(0, 8)}`,
        partial_payment: false,
        transfers: transfers.length > 0 ? transfers : undefined
      });
      razorpay_order_id = rzpOrder.id;
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1. Auto-decrement stock for ordered items
      for (const item of items) {
        const dbItem = await tx.menuItem.findUnique({ where: { id: item.menu_item_id } });
        if (dbItem?.stock_quantity !== null) {
          const updateRes = await tx.menuItem.updateMany({
            where: { 
              id: item.menu_item_id,
              stock_quantity: { gte: item.quantity }
            },
            data: {
              stock_quantity: { decrement: item.quantity }
            }
          });
          
          if (updateRes.count === 0) {
            throw new Error(`Insufficient stock for ${dbItem?.name || 'an item'} during checkout.`);
          }
        }
      }

      // 2. Create the order
      return await tx.order.create({
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
          platform_discount_share,
          restaurant_discount_share,
          restaurant_commission,
          restaurant_transfer,
          payment_method: payment_method || 'cod',
          payment_status: payment_method === 'cod' ? 'pending' : 'processing',
          razorpay_order_id,
          idempotency_key: idempotency_key || randomUUID(),
          special_instructions,
          coupon_id: valid_coupon_id,
          delivery_otp: Math.floor(1000 + Math.random() * 9000).toString(),
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
    });

    const io = getIO();
    const orderCreatedPayload = {
      orderId: order.id,
      customerName: user.name,
      totalAmount: total_amount,
      itemsCount: items.length,
      status: 'pending',
      created_at: order.created_at,
      restaurant: (order as any).restaurant,
      customer: { name: user.name, phone: user.phone },
      order_items: (order as any).order_items
    };

    io.to(`restaurant_${restaurant_id}`).emit('order:created', orderCreatedPayload);
    io.to('admin').emit('order:created', orderCreatedPayload);

    const restaurantUser = await findRestaurantUserByRestaurantId(restaurant_id);
    if (restaurantUser) {
      await notificationQueue.add('notify', {
        type: 'both', userId: restaurantUser.id, userRole: 'restaurant_partner',
        title: 'New Order Received!',
        body: `Order #${order.id.slice(0, 8).toUpperCase()} has been placed for ₹${Number(order.total_amount).toFixed(2)}.`,
        data: { type: 'order_created', orderId: order.id }
      });
    }
    await notificationQueue.add('notify', {
      type: 'both', userId: user.id, userRole: 'customer',
      title: 'Order Placed', body: 'Your order has been sent to the restaurant.',
      data: { type: 'order_placed', orderId: order.id }
    });

    const timeoutMins = parseInt(configMap['ORDER_ACCEPT_TIMEOUT_MINS'] || '5');
    await scheduleOrderTimeout(order.id, timeoutMins * 60 * 1000);

    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    console.error('Order Creation Error:', error);
    if (error.code === 'P2002') { 
      res.status(409).json({ success: false, error: { code: 'DUPLICATE_ORDER', message: 'Order already exists' } });
      return;
    }
    const message = error.error?.description || error.message || 'Failed to create order';
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
  }
});

// POST /api/orders/verify-payment
router.post('/verify-payment', authorizeRole(['customer']), async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const user = req.user as any;

  try {
    let isValid = false;
    
    if (!process.env.RAZORPAY_KEY_SECRET) {
      res.status(500).json({ success: false, error: { message: "Payment configuration error on server" }});
      return;
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");
    isValid = (razorpay_signature === expectedSign);

    if (isValid) {
      const order = await prisma.order.findFirst({ 
        where: { razorpay_order_id, customer_id: user.id },
        include: { restaurant: true, order_items: true, customer: true }
      });
      
      if (!order) {
        res.status(404).json({ success: false, error: { message: "Order not found" }});
        return;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { 
          payment_status: 'success', 
          razorpay_payment_id, 
          status: 'restaurant_confirmed' 
        }
      });

      // Emit confirmed events
      const io = getIO();
      const payload = {
        orderId: order.id,
        status: 'restaurant_confirmed'
      };
      
      io.to(`restaurant_${order.restaurant_id}`).emit('order:restaurant_confirmed', payload);
      io.to('admin').emit('order:restaurant_confirmed', payload);

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, error: { message: "Invalid signature" }});
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' }});
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
        delivery_partner: { select: { name: true, phone: true } },
        ratings: true
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
      where: { id: req.params.id as string, customer_id: user.id as string },
      include: { restaurant: true, order_items: true, delivery_address: true, delivery_partner: true, ratings: true }
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

// POST /api/orders/:id/rate
router.post('/:id/rate', authorizeRole(['customer']), async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params;
  const { food_rating, restaurant_rating, delivery_rating, review_text } = req.body;
  
  try {
    const order = await prisma.order.findFirst({
      where: { id: id as string, customer_id: user.id },
      include: { ratings: true }
    });

    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
      return;
    }

    if (order.status !== 'delivered') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Can only rate delivered orders' } });
      return;
    }

    if (order.ratings) {
      res.status(400).json({ success: false, error: { code: 'ALREADY_RATED', message: 'Order already rated' } });
      return;
    }

    const rating = await prisma.rating.create({
      data: {
        order_id: order.id,
        customer_id: user.id,
        restaurant_id: order.restaurant_id,
        delivery_partner_id: order.delivery_partner_id,
        food_rating: parseInt(food_rating) || 5,
        restaurant_rating: parseInt(restaurant_rating) || 5,
        delivery_rating: delivery_rating ? parseInt(delivery_rating) : null,
        review_text: review_text || null
      }
    });

    res.json({ success: true, data: rating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit rating' } });
  }
});

// ─── RESTAURANT ROUTES ───────────────────────────────────────────────────────

// GET /api/orders/restaurant/active
// Fetch active orders for the logged-in restaurant
router.get('/restaurant/active', authorizeRole(['restaurant_partner']), async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await findRestaurantPartner(user);
    if (!partner) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a restaurant partner' } });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { 
        restaurant_id: partner.restaurant_id,
        status: { in: ['pending', 'restaurant_confirmed', 'preparing', 'ready'] as any[] }
      },
      include: { order_items: true, customer: { select: { name: true, phone: true } } },
      orderBy: { created_at: 'asc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } });
  }
});

// GET /api/orders/restaurant/transactions
// Fetch completed orders/transactions for the logged-in restaurant
router.get('/restaurant/transactions', authorizeRole(['restaurant_partner']), async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await findRestaurantPartner(user);
    if (!partner) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a restaurant partner' } });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { 
        restaurant_id: partner.restaurant_id,
        status: 'delivered'
      },
      include: { 
        customer: { select: { name: true } },
        restaurant: { select: { commission_rate: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    let total_earnings = 0;
    let pending_payout = 0;
    const now = new Date();
    
    const transactions = orders.map(order => {
      // Mock payout logic: paid if older than 7 days
      const daysOld = (now.getTime() - order.created_at.getTime()) / (1000 * 3600 * 24);
      const is_paid_to_restaurant = daysOld > 7;
      
      const commissionRate = Number(order.restaurant?.commission_rate || 0);
      const subtotal = Number(order.item_subtotal || 0);
      const earnings = subtotal * (1 - commissionRate / 100);
      
      total_earnings += earnings;
      if (!is_paid_to_restaurant) {
        pending_payout += earnings;
      }
      return {
        id: order.id,
        created_at: order.created_at,
        customer_name: order.customer?.name,
        total_amount: Number(order.total_amount),
        earnings,
        payment_method: order.payment_method,
        is_paid_to_restaurant
      };
    });

    res.json({ 
      success: true, 
      data: {
        total_earnings,
        pending_payout,
        total_completed_orders: orders.length,
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch transactions' } });
  }
});

// ─── SHARED PARTNER ROUTES ───────────────────────────────────────────────────

// PUT /api/orders/:id/status
router.put('/:id/status', authorizeRole(['restaurant_partner', 'delivery_partner', 'admin']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, cancellation_reason } = req.body;
  const user = req.user as any;
  
  try {
    // BUG-001 Fix: Database-level ownership authorization
    let whereClause: any = { id: id as string };
    
    if (user.role === 'restaurant_partner') {
      const partner = await findRestaurantPartner(user);
      if (!partner) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a valid restaurant partner' } });
        return;
      }
      whereClause.restaurant_id = partner.restaurant_id;
    } else if (user.role === 'delivery_partner') {
      const partner = await prisma.deliveryPartner.findUnique({ where: { user_id: user.id } });
      if (!partner) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a valid delivery partner' } });
        return;
      }
      whereClause.delivery_partner_id = partner.id;
    }

    const order = await prisma.order.findFirst({ 
      where: whereClause,
      include: { customer: true, order_items: true }
    });

    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found or unauthorized' } });
      return;
    }

    // BUG-002 Fix: Strict State Machine & Authorization
    const allowedTransitions: Record<string, string[]> = {
      pending: ['restaurant_confirmed', 'cancelled', 'rejected'],
      restaurant_confirmed: ['preparing', 'ready', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['rider_assigned', 'picked_up'], // system assigns rider, but rider can pick up
      rider_assigned: ['picked_up'],
      picked_up: ['out_for_delivery', 'delivered'], // some flows might skip out_for_delivery
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: [],
      rejected: []
    };

    if (!allowedTransitions[order.status]?.includes(status)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_TRANSITION', message: `Cannot transition order from ${order.status} to ${status}` } });
      return;
    }

    const transition = `${order.status}->${status}`;
    let allowedActors: string[] = [];
    if (status === 'cancelled' || status === 'rejected') {
      allowedActors = ['restaurant_partner', 'admin', 'customer'];
    } else if (['restaurant_confirmed', 'preparing', 'ready'].includes(status)) {
      allowedActors = ['restaurant_partner', 'admin'];
    } else if (['rider_assigned'].includes(status)) {
      allowedActors = ['admin']; // Usually system, but admin can manually assign
    } else if (['picked_up', 'out_for_delivery', 'delivered'].includes(status)) {
      allowedActors = ['delivery_partner', 'admin'];
    }

    if (!allowedActors.includes(user.role)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Role ${user.role} cannot change status to ${status}` } });
      return;
    }

    // Delivery OTP Enforcement
    if (status === 'delivered') {
      const { otp } = req.body;
      if (!otp || String(otp) !== order.delivery_otp) {
        res.status(400).json({ success: false, error: { code: 'INVALID_OTP', message: 'Invalid or missing delivery OTP' } });
        return;
      }
    }

    const updated = await prisma.order.update({
      where: { id: id as string },
      data: { 
        status, 
        cancellation_reason: cancellation_reason || null,
        cancelled_by: status === 'cancelled' ? (user.role === 'restaurant_partner' ? 'restaurant' : user.role === 'admin' ? 'admin' : 'customer') : null
      }
    });

    const statusMessages: Record<string, { title: string; body: string }> = {
      restaurant_confirmed: { title: 'Restaurant Accepted', body: 'The restaurant accepted your order.' },
      preparing: { title: 'Food Preparing', body: 'Your food is being prepared.' },
      ready: { title: 'Order Ready', body: 'Your order is ready for pickup.' },
      rider_assigned: { title: 'Rider Assigned', body: 'A delivery partner has been assigned to your order.' },
      picked_up: { title: 'Order Picked Up', body: 'Your delivery partner picked up the order.' },
      out_for_delivery: { title: 'Out for Delivery', body: 'Your order is on the way.' },
      delivered: { title: 'Order Delivered', body: 'Your order has been delivered. Enjoy your meal!' },
      cancelled: { title: 'Order Cancelled', body: 'Your order was cancelled.' },
      rejected: { title: 'Order Rejected', body: 'The restaurant could not accept your order.' },
    };
    const message = statusMessages[status];
    if (message) {
      await notificationQueue.add('notify', {
        type: 'both', userId: order.customer_id, userRole: 'customer',
        title: message.title, body: message.body,
        data: { type: 'order_status', orderId: order.id, status }
      });
      const restaurantUser = await findRestaurantUserByRestaurantId(order.restaurant_id);
      if (restaurantUser) {
        await notificationQueue.add('notify', {
          type: 'both', userId: restaurantUser.id, userRole: 'restaurant_partner',
          title: `Order ${status.replaceAll('_', ' ')}`,
          body: `Order #${order.id.slice(0, 8).toUpperCase()} status changed to ${status.replaceAll('_', ' ')}.`,
          data: { type: 'order_status', orderId: order.id, status }
        });
      }
    }

    if (['restaurant_confirmed', 'cancelled', 'rejected'].includes(status)) {
      await cancelOrderTimeout(order.id);
    }

    // Send SMS when out for delivery
    if (status === 'out_for_delivery' && order.status !== 'out_for_delivery') {
      if (order.customer?.phone && order.delivery_otp) {
        await smsQueue.add('send-delivery-otp', { type: 'delivery', phone: order.customer.phone, otp: order.delivery_otp });
      }
    }

    // Assign Delivery Partner automatically when accepted by restaurant
    if ((status === 'restaurant_confirmed' || status === 'preparing') && !order.delivery_partner_id) {
      await assignmentQueue.add('assign-partner', { orderId: order.id });
    }

    // Push Notifications for Customers
    if (status === 'delivered' && order.status !== 'delivered') {
      const assignment = await prisma.deliveryAssignment.findUnique({ where: { order_id: order.id } });
      if (assignment) {
        await payoutQueue.add('delivery-payout', { assignment_id: assignment.id }, {
          jobId: `payout-${assignment.id}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 }
        });
      }
    }

    // Restore stock if cancelled or rejected
    if ((status === 'cancelled' || status === 'rejected') && !['cancelled', 'rejected'].includes(order.status)) {
      for (const item of order.order_items) {
        await prisma.menuItem.updateMany({
          where: { 
            id: item.menu_item_id,
            stock_quantity: { not: null }
          },
          data: {
            stock_quantity: { increment: item.quantity }
          }
        });
      }
    }

    // Safe refund — queued to worker so it doesn't block API
    if ((status === 'cancelled' || status === 'rejected') && updated.payment_status === 'success' && updated.razorpay_payment_id) {
      // Background the refund. The worker will handle setting payment_status = 'refunded'
      await refundQueue.add('refund-order', { orderId: updated.id, reason: cancellation_reason || `Order ${status}` });
    }

    if ((status === 'cancelled' || status === 'rejected') && user.role === 'admin') {
      try {
        await prisma.adminAuditLog.create({
          data: {
            admin_id: user.id,
            action: updated.payment_status === 'refunded' ? 'REFUND_PROCESSED' : (status === 'rejected' ? 'ORDER_REJECTED' : 'ORDER_CANCELLED'),
            target_type: 'Order',
            target_id: updated.id,
            details: { reason: cancellation_reason, payment_status: updated.payment_status }
          }
        });
      } catch (e) {
        console.error('Failed to write audit log', e);
      }
    }

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
    io.to(`restaurant_${order.restaurant_id}`).emit(`order:${updated.status}`, payload);
    if (updated.delivery_partner_id) {
      const deliveryPartner = await prisma.deliveryPartner.findUnique({ where: { id: updated.delivery_partner_id } });
      if (deliveryPartner) io.to(`delivery_partner_${deliveryPartner.user_id}`).emit(`order:${updated.status}`, payload);
    }
    io.to('admin').emit(`order:${updated.status}`, payload);

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
  }
});

export default router;
