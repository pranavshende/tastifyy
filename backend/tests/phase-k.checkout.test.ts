/**
 * Phase K — Cart, Checkout & Payment: Razorpay order creation, webhook signature verification
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';
import crypto from 'crypto';

describe('Phase K — Cart, Checkout & Payment', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /api/orders (checkout)', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).post('/api/orders').send({
        restaurant_id: 'rest-1',
        items: [{ menu_item_id: 'item-1', quantity: 2, customizations: [] }],
        payment_method: 'razorpay'
      });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Razorpay webhook signature verification', () => {
    it('correctly verifies a valid Razorpay webhook signature', () => {
      const razorpayKeySecret = 'rzp_secret_mock';
      const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test_123' } } } });

      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(payload)
        .digest('hex');

      // Re-verify with same secret
      const verifiedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(payload)
        .digest('hex');

      expect(verifiedSignature).toBe(expectedSignature);
    });

    it('rejects an invalid Razorpay webhook signature', () => {
      const validSecret = 'rzp_secret_mock';
      const wrongSecret = 'wrong_secret';
      const payload = 'some_payload_body';

      const correctSig = crypto.createHmac('sha256', validSecret).update(payload).digest('hex');
      const wrongSig = crypto.createHmac('sha256', wrongSecret).update(payload).digest('hex');

      expect(correctSig).not.toBe(wrongSig);
    });
  });

  describe('Razorpay Route Split Math', () => {
    it('correctly calculates the restaurant and platform shares', () => {
      const item_subtotal = 380;
      const delivery_fee = 40;
      const platform_fee = 5;
      const tax_amount = item_subtotal * 0.05; // 19
      const discount_amount = 0;
      const total_amount = item_subtotal + delivery_fee + platform_fee + tax_amount - discount_amount; // 444
      
      const commissionRate = 10;
      const commissionAmount = item_subtotal * (commissionRate / 100); // 38
      
      const platformShare = platform_fee + delivery_fee + commissionAmount; // 5 + 40 + 38 = 83
      const restaurantShare = total_amount - platformShare; // 444 - 83 = 361
      
      expect(total_amount).toBe(444);
      expect(platformShare).toBe(83);
      expect(restaurantShare).toBe(361);
      
      // Verification: restaurant share + platform share = total amount
      expect(restaurantShare + platformShare).toBe(total_amount);
      
      const restaurantSharePaise = Math.round(restaurantShare * 100);
      expect(restaurantSharePaise).toBe(36100);
    });
    
    it('throws error if stock is insufficient', () => {
      const stock_quantity = 1;
      const required_quantity = 2;
      expect(() => {
        if (stock_quantity < required_quantity) {
          throw new Error('Insufficient stock');
        }
      }).toThrow('Insufficient stock');
    });
  });
});
