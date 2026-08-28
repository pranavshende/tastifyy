import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Auth & RBAC E2E', () => {
  let app: any;

  beforeAll(async () => {
    // Dynamically import app so mocks in setup.ts are applied
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a customer', async () => {
      // Setup mock returns
      prismaMock.user.create.mockResolvedValue({
        id: 'test-uuid',
        email: 'test@customer.com',
        phone: '1234567890',
        name: 'Test Customer',
        role: 'customer',
        profile_photo_url: null,
        dob: null,
        is_active: true,
        fcm_token: null,
        created_at: new Date(),
        updated_at: new Date()
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@customer.com',
          password: 'Password123',
          phone: '1234567890',
          name: 'Test Customer',
          role: 'customer'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('customer');
      expect(res.body.session.access_token).toBe('fake-token');
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    });

    it('should block self-registration of admins', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@tastifyy.com',
          password: 'Password123',
          phone: '1234567890',
          name: 'Test Admin',
          role: 'admin'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
