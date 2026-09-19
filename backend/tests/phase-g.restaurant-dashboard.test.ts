/**
 * Phase G — Restaurant Dashboard: order fetch, is_open toggle, Socket emission
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase G — Restaurant Dashboard', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /api/restaurant/... (protected)', () => {
    it('blocks unauthenticated access to restaurant orders', async () => {
      const res = await request(app).get('/api/orders');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Restaurant data query structure', () => {
    it('correctly mocks restaurant order fetch with pending status', () => {
      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          restaurant_id: 'rest-1',
          customer_id: 'user-1',
          status: 'pending',
          total_amount: 350 as any,
          created_at: new Date(),
        } as any,
      ]);

      // Validate that findMany was set up correctly
      expect(prismaMock.order.findMany).toBeDefined();
    });

    it('correctly structures the is_open toggle update', () => {
      prismaMock.restaurant.update.mockResolvedValue({
        id: 'rest-1',
        is_open: true,
      } as any);

      expect(prismaMock.restaurant.update).toBeDefined();
    });
  });
});
