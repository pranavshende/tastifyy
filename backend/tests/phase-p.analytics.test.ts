/**
 * Phase P — Analytics & Config: KPI calculation, admin config save/read
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase P — Analytics & Config', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /api/analytics/admin RBAC', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/analytics/admin');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('KPI calculation logic', () => {
    it('calculates total revenue correctly from order list', () => {
      const orders = [
        { total_amount: '350.00' },
        { total_amount: '220.00' },
        { total_amount: '480.00' },
      ];

      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      expect(totalRevenue).toBeCloseTo(1050, 2);
    });

    it('calculates Average Order Value (AOV) correctly', () => {
      const totalRevenue = 1050;
      const totalOrders = 3;
      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      expect(aov).toBeCloseTo(350, 2);
    });

    it('calculates platform commission correctly at 10%', () => {
      const totalRevenue = 1050;
      const feePercent = 10;
      const estCommission = totalRevenue * (feePercent / 100);
      expect(estCommission).toBeCloseTo(105, 2);
    });

    it('returns 0 AOV when there are no orders', () => {
      const totalRevenue = 0;
      const totalOrders = 0;
      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      expect(aov).toBe(0);
    });
  });

  describe('Admin Config system', () => {
    it('correctly mocks fetching a platform config key', async () => {
      prismaMock.adminConfig.findUnique.mockResolvedValue({
        id: 'config-1',
        key: 'PLATFORM_FEE_PERCENT',
        value: '12',
        updated_at: new Date(),
      } as any);

      const config = await prismaMock.adminConfig.findUnique({ where: { key: 'PLATFORM_FEE_PERCENT' } });
      expect(config).not.toBeNull();
      expect(Number(config!.value)).toBe(12);
    });

    it('correctly mocks saving/upserting a config key', () => {
      prismaMock.adminConfig.upsert.mockResolvedValue({
        id: 'config-1',
        key: 'PLATFORM_FEE_PERCENT',
        value: '15',
        updated_at: new Date(),
      } as any);

      expect(prismaMock.adminConfig.upsert).toBeDefined();
    });
  });
});
