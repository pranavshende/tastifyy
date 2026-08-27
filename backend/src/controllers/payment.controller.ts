import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import Razorpay from 'razorpay';
import { randomUUID } from 'crypto';

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
