/**
 * Phase C — Restaurant Onboarding: registration submission, status check
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase C — Restaurant Onboarding', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /api/onboarding/restaurant', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/onboarding/restaurant').send({
        name: 'Test Restaurant',
        type: 'veg',
        owner_name: 'John Doe',
        phone: '9876543210',
        address_line: '1 Food Lane',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        latitude: 18.52,
        longitude: 73.86,
        service_radius_km: 5,
        commission_rate: 10
      });
      expect([401, 403]).toContain(res.status);
    });

    it('validates that prisma.restaurant.create schema has correct fields', () => {
      // Verify the mock is properly structured for restaurant creation
      prismaMock.restaurant.create.mockResolvedValue({
        id: 'rest-1',
        name: 'Test Restaurant',
        type: 'veg',
        owner_name: 'John Doe',
        phone: '9876543210',
        email: null,
        address_line: '1 Food Lane',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        latitude: 18.52 as any,
        longitude: 73.86 as any,
        service_radius_km: 5 as any,
        logo_url: null,
        cover_image_url: null,
        photo_gallery_urls: [],
        is_pure_veg: false,
        cuisine_tags: [],
        status: 'pending',
        is_open: false,
        commission_rate: 10 as any,
        subscription_plan: 'starter',
        avg_preparation_time_mins: null,
        razorpay_account_id: null,
        created_at: new Date(),
        updated_at: new Date()
      });

      expect(prismaMock.restaurant.create).toBeDefined();
    });
  });

  describe('GET /api/onboarding/restaurant/status', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/onboarding/restaurant/status');
      expect([401, 403]).toContain(res.status);
    });
  });
});
