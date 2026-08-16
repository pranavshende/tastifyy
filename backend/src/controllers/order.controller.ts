import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
});

export const checkout = async (req: Request, res: Response): Promise<void> => {
  const { restaurant_id, delivery_address_id, items, coupon_id } = req.body;
  const customer_id = (req.user as any)?.id;

  try {
    let item_subtotal = 0;
    const orderItemsData = [];
    
    for (const item of items) {
      const dbItem = await prisma.menuItem.findUnique({ where: { id: item.menu_item_id } });
      if (!dbItem || !dbItem.is_available) {
        res.status(400).json({ error: `Item ${item.name} is not available.` });
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

    const delivery_fee = 40;
    const platform_fee = 5;
    const tax_amount = item_subtotal * 0.05; 
    let discount_amount = 0;

    if (coupon_id) {
      const coupon = await prisma.coupon.findUnique({ where: { id: coupon_id } });
      if (coupon && coupon.is_active && item_subtotal >= Number(coupon.min_order_value)) {
        if (coupon.discount_type === 'flat') {
          discount_amount = Number(coupon.discount_value);
        } else if (coupon.discount_type === 'percentage') {
          let pctDiscount = item_subtotal * (Number(coupon.discount_value) / 100);
          if (coupon.max_discount_cap && pctDiscount > Number(coupon.max_discount_cap)) {
            pctDiscount = Number(coupon.max_discount_cap);
          }
          discount_amount = pctDiscount;
        }
      }
    }

    const total_amount = item_subtotal + delivery_fee + platform_fee + tax_amount - discount_amount;

    const order = await prisma.order.create({
      data: {
        customer_id,
        restaurant_id,
        delivery_address_id,
        status: 'pending',
        item_subtotal,
        delivery_fee,
        platform_fee,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method: 'card', 
        payment_status: 'pending',
        idempotency_key: uuidv4(),
        coupon_id,
        order_items: { create: orderItemsData }
      }
    });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(total_amount * 100),
      currency: 'INR',
      receipt: order.id,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpay_order_id: rzpOrder.id }
    });

    res.json({ order, rzpOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const order = await prisma.order.findFirst({ where: { razorpay_order_id } });
      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { payment_status: 'success', razorpay_payment_id, status: 'restaurant_confirmed' }
        });
        
        // Notify restaurant via socket
        import('../socket.js').then(({ getIO }) => {
          const io = getIO();
          io.to(`restaurant_${order.restaurant_id}`).emit('new_order', { orderId: order.id });
        });
      }
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, error: "Invalid signature" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { status, delivery_partner_id } = req.body;

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status, delivery_partner_id }
    });

    // Notify customer and restaurant
    import('../socket.js').then(({ getIO }) => {
      const io = getIO();
      io.to(`customer_${order.customer_id}`).emit('order_status_update', { orderId: order.id, status });
      io.to(`restaurant_${order.restaurant_id}`).emit('order_status_update', { orderId: order.id, status });
      if (order.delivery_partner_id) {
        io.to(`partner_${order.delivery_partner_id}`).emit('order_status_update', { orderId: order.id, status });
      }
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { order_items: true, customer: { select: { name: true, phone: true } } }
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rateOrder = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { food_rating, restaurant_rating, delivery_rating, review_text, tags } = req.body;
  const customer_id = (req.user as any)?.id;

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.customer_id !== customer_id) {
      res.status(403).json({ error: 'Unauthorized to rate this order' });
      return;
    }

    const rating = await prisma.rating.create({
      data: {
        order_id: order.id,
        customer_id,
        restaurant_id: order.restaurant_id,
        delivery_partner_id: order.delivery_partner_id,
        food_rating,
        restaurant_rating,
        delivery_rating,
        review_text,
        tags
      }
    });

    res.json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
