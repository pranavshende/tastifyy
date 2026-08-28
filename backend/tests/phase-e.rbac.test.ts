/**
 * Phase E — Role-Based Access Control (RBAC):
 * Each role must be blocked from routes it doesn't own.
 */
import { jest } from '@jest/globals';
import request from 'supertest';

describe('Phase E — Role-Based Navigation & RBAC Enforcement', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('Admin-only routes block unauthenticated access', () => {
    const adminRoutes = [
      ['GET', '/api/admin/profile'],
      ['GET', '/api/analytics/admin'],
      ['GET', '/api/admin/restaurants'],
      ['GET', '/api/admin/audit-logs'],
    ];

    adminRoutes.forEach(([method, route]) => {
      it(`${method} ${route} → 401 without token`, async () => {
        const res = await (request(app) as any)[method!.toLowerCase()](route!);
        expect([401, 403]).toContain(res.status);
      });
    });
  });

  describe('Customer-only routes block unauthenticated access', () => {
    const customerRoutes = [
      ['GET', '/api/customer/profile'],
      ['POST', '/api/reviews'],
    ];

    customerRoutes.forEach(([method, route]) => {
      it(`${method} ${route} → 401 without token`, async () => {
        const res = await (request(app) as any)[method!.toLowerCase()](route!);
        expect([401, 403]).toContain(res.status);
      });
    });
  });

  describe('Delivery-only routes block unauthenticated access', () => {
    const deliveryRoutes = [
      ['GET', '/api/delivery/active-orders'],
      ['GET', '/api/delivery/earnings'],
    ];

    deliveryRoutes.forEach(([method, route]) => {
      it(`${method} ${route} → 401 without token`, async () => {
        const res = await (request(app) as any)[method!.toLowerCase()](route!);
        expect([401, 403]).toContain(res.status);
      });
    });
  });
});
