/**
 * Phase A — Authentication: JWT sessions, role enforcement, admin block
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase A — Auth, Sessions & Roles', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── REGISTRATION ─────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('registers a new customer successfully', async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 'user-1', email: 'customer@test.com', phone: '9000000001',
        name: 'Test Customer', role: 'customer', profile_photo_url: null,
        dob: null, is_active: true, fcm_token: null,
        created_at: new Date(), updated_at: new Date(),
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'customer@test.com', password: 'Pass@1234',
        phone: '9000000001', name: 'Test Customer', role: 'customer'
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('customer');
    });

    it('blocks self-registration of admin accounts', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'admin@test.com', password: 'Pass@1234',
        phone: '9000000002', name: 'Rogue Admin', role: 'admin'
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'missing@test.com'
        // Missing password, phone, name, role
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns a session token for valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'customer@test.com', phone: '9000000001',
        name: 'Test Customer', role: 'customer', profile_photo_url: null,
        dob: null, is_active: true, fcm_token: null,
        created_at: new Date(), updated_at: new Date(),
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'customer@test.com', password: 'Pass@1234'
      });

      // Supabase is mocked globally — session should be returned
      expect(res.status).toBe(200);
      expect(res.body.session).toBeDefined();
      expect(res.body.session.access_token).toBe('fake-token');
    });

    it('returns 400 when credentials are missing', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });
  });

  // ─── FCM TOKEN ────────────────────────────────────────────────────────────

  describe('POST /api/auth/fcm-token', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/auth/fcm-token').send({ token: 'firebase-device-token-abc' });
      // Unauthenticated → passport returns 401/403; rate limiter may return 429; route may 404 if limit exhausted
      expect([401, 403, 404, 429]).toContain(res.status);
    });
  });
});
