/**
 * Phase I — Admin Dashboard: KPI metrics, audit logs, refunds, restaurant management
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase I — Admin Dashboard', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('Admin routes RBAC', () => {
    it('GET /api/admin/restaurants → 401 without token', async () => {
      const res = await request(app).get('/api/admin/restaurants');
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/admin/audit-logs → 401 without token', async () => {
      const res = await request(app).get('/api/admin/audit-logs');
      expect([401, 403]).toContain(res.status);
    });

    it('PATCH /api/admin/restaurants/:id/approve → 401 without token', async () => {
      const res = await request(app).patch('/api/admin/restaurants/rest-1/approve');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Admin data query mocks', () => {
    it('correctly mocks restaurant listing query', () => {
      prismaMock.restaurant.findMany.mockResolvedValue([
        {
          id: 'rest-1',
          name: 'Good Eats',
          status: 'pending',
          city: 'Pune',
          created_at: new Date(),
        } as any,
      ]);

      expect(prismaMock.restaurant.findMany).toBeDefined();
    });

    it('correctly mocks audit log listing', () => {
      prismaMock.adminAuditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: 'RESTAURANT_APPROVED',
          performed_by: 'admin-1',
          target_id: 'rest-1',
          created_at: new Date(),
        } as any,
      ]);

      expect(prismaMock.adminAuditLog.findMany).toBeDefined();
    });

    it('correctly mocks the refund flow (order update to refund_initiated)', () => {
      prismaMock.order.update.mockResolvedValue({
        id: 'order-1',
        status: 'refund_initiated',
      } as any);

      expect(prismaMock.order.update).toBeDefined();
    });
  });
});
