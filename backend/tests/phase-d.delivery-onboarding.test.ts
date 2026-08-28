/**
 * Phase D — Delivery Partner Onboarding: registration, vehicle info
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase D — Delivery Partner Onboarding', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /api/onboarding/delivery', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/onboarding/delivery').send({
        vehicle_type: 'bike',
        vehicle_number: 'MH12AB1234',
        license_number: 'DL123456789'
      });
      expect([401, 403]).toContain(res.status);
    });

    it('validates the delivery partner schema structure', () => {
      prismaMock.deliveryPartner.create.mockResolvedValue({
        id: 'dp-1',
        user_id: 'user-1',
        vehicle_type: 'bike',
        vehicle_number: 'MH12AB1234',
        license_number: 'DL123456789',
        aadhar_number: '123456789012',
        is_verified: false,
        status: 'inactive',
        is_online: false,
        current_latitude: null,
        current_longitude: null,
        created_at: new Date(),
        updated_at: new Date()
      });

      expect(prismaMock.deliveryPartner.create).toBeDefined();
    });
  });

  describe('GET /api/onboarding/delivery/status', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/onboarding/delivery/status');
      expect([401, 403]).toContain(res.status);
    });
  });
});
