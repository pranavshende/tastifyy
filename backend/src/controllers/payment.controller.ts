import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import Razorpay from 'razorpay';
import { randomUUID, createHmac } from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
});

// Used when a restaurant sets up their bank details
export const createLinkedAccount = async (req: Request, res: Response): Promise<void> => {
  const { email, phone, name, account_number, ifsc_code, beneficiary_name } = req.body;
  const user = req.user as any;
  
  try {
    const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
    if (!partner) {
      res.status(403).json({ success: false, error: 'Not a restaurant partner' });
      return;
    }

    // In a real scenario, this would call razorpay API to create a linked account
    // Example: razorpay.accounts.create({ type: 'route', name, email, contact: phone, ... })
    // For this MVP, we'll generate a mock ID
    
    let razorpay_account_id = `acc_mock_${randomUUID().substring(0, 8)}`;
    
    // Save to DB
    await prisma.restaurant.update({
      where: { id: partner.restaurant_id },
      data: { razorpay_account_id }
    });

    res.json({ success: true, data: { razorpay_account_id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create linked account' });
  }
};

// Used to trigger payouts to delivery partners via RazorpayX
export const triggerPayout = async (req: Request, res: Response): Promise<void> => {
  const { partner_id, amount } = req.body;
  const user = req.user as any;

  if (user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  try {
    const deliveryPartner = await prisma.deliveryPartner.findUnique({ where: { id: partner_id } });
    if (!deliveryPartner || !deliveryPartner.bank_account_number || !deliveryPartner.ifsc_code) {
      res.status(400).json({ success: false, error: 'Delivery partner bank details missing' });
      return;
    }

    // Mock RazorpayX payout creation
    res.json({ success: true, message: 'Payout triggered successfully (Mocked)', data: { partner_id, amount, status: 'processed' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to trigger payout' });
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_mock';
  const signature = req.headers['x-razorpay-signature'] as string;
  
  if (!signature) {
    res.status(400).send('Missing signature');
    return;
  }

  try {
    // Verify signature using the raw Buffer body
    const expected = createHmac('sha256', secret).update(req.body).digest('hex');

    if (expected !== signature) {
      res.status(400).send('Invalid signature');
      return;
    }

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;
    
    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) {
      res.status(400).send('Invalid payload structure');
      return;
    }

    const razorpay_order_id = paymentEntity.order_id;
    const razorpay_payment_id = paymentEntity.id;

    if (!razorpay_order_id) {
       res.status(200).send('OK');
       return;
    }

    const order = await prisma.order.findFirst({
      where: { razorpay_order_id }
    });

    if (!order) {
      res.status(404).send('Order not found');
      return;
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      if (order.payment_status !== 'success') {
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            payment_status: 'success', 
            razorpay_payment_id,
            status: 'restaurant_confirmed'
          }
        });

        // Use dynamic import for socket to avoid circular deps or missing imports
        const { getIO } = await import('../socket.js');
        const io = getIO();
        io.to(`restaurant_${order.restaurant_id}`).emit('order:status_update', {
          orderId: order.id,
          status: 'restaurant_confirmed',
          payment_status: 'success'
        });
      }
    } else if (event === 'payment.failed') {
      if (order.payment_status !== 'success') {
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            payment_status: 'failed', 
            status: 'cancelled',
            cancellation_reason: 'Payment failed'
          }
        });
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
};
