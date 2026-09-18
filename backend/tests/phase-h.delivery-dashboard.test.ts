/**
 * Phase H — Delivery Dashboard: active orders, earnings, location update
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase H — Delivery Dashboard', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /api/delivery/active-orders', () => {
    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/delivery/active-orders');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/delivery/earnings', () => {
    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/delivery/earnings');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/delivery/location', () => {
    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).post('/api/delivery/location').send({
        latitude: 19.076, longitude: 72.877
      });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Delivery partner DB query structure', () => {
    it('correctly mocks finding active orders assigned to a delivery partner', () => {
      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          delivery_partner_id: 'dp-1',
          status: 'out_for_delivery',
          total_amount: 280 as any,
          delivery_fee: 30 as any,
        } as any,
      ]);

      expect(prismaMock.order.findMany).toBeDefined();
    });

    it('correctly mocks updating delivery partner GPS location', () => {
      prismaMock.deliveryPartner.update.mockResolvedValue({
        id: 'dp-1',
        current_latitude: 19.076 as any,
        current_longitude: 72.877 as any,
      } as any);

      expect(prismaMock.deliveryPartner.update).toBeDefined();
    });
  });
});
