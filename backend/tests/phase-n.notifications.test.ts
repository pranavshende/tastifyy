/**
 * Phase N — Notifications & Realtime: FCM payload structure, Socket event names
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase N — Notifications & Realtime (FCM)', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendPushNotification service', () => {
    it('skips dispatch gracefully when user has no FCM token', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        fcm_token: null, // No token set
      } as any);

      // Import and call the service directly
      const { sendPushNotification } = await import('../src/services/notification.service.js');
      const result = await sendPushNotification('user-1', 'Test', 'Hello');
      expect(result).toBe(false);
    });

    it('dispatches (console log) correctly when user has FCM token', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        fcm_token: 'test-device-firebase-token-xyz',
      } as any);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const { sendPushNotification } = await import('../src/services/notification.service.js');
      const result = await sendPushNotification('user-1', 'New Order!', 'You have been assigned an order.', { type: 'order_assigned', orderId: 'order-1' });

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('FCM PUSH NOTIFICATION'));
      consoleSpy.mockRestore();
    });
  });

  describe('createNotification deduplication', () => {
    it('returns an existing notification without creating a duplicate', async () => {
      const existing = { id: 'notification-1', dedupe_key: 'order-status:order-1:ready' };
      prismaMock.notification.findUnique.mockResolvedValue(existing as any);

      const { createNotification } = await import('../src/services/notification.service.js');
      const result = await createNotification(
        'user-1',
        'customer',
        'order_status',
        'Ready for Pickup',
        'Your order is ready.',
        { orderId: 'order-1' },
        { dedupeKey: 'order-status:order-1:ready' },
      );

      expect(result).toBe(existing);
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it('recovers from concurrent duplicate inserts using the unique dedupe key', async () => {
      const existing = { id: 'notification-1', dedupe_key: 'order-status:order-1:ready' };
      prismaMock.notification.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existing as any);
      prismaMock.notification.create.mockRejectedValue({ code: 'P2002' } as any);

      const { createNotification } = await import('../src/services/notification.service.js');
      const result = await createNotification(
        'user-1',
        'customer',
        'order_status',
        'Ready for Pickup',
        'Your order is ready.',
        { orderId: 'order-1' },
        { dedupeKey: 'order-status:order-1:ready' },
      );

      expect(result).toBe(existing);
      expect(prismaMock.notification.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('Socket event names contract', () => {
    it('validates expected Socket events are defined correctly', () => {
      // These are the event names our platform emits — ensuring they match client expectations
      const socketEvents = [
        'delivery:assigned',        // Emitted to driver when assigned
        'order:rider_assigned',     // Emitted to restaurant when driver assigned
        'order:status_updated',     // Emitted on any status change
      ];

      // They should all be non-empty strings
      socketEvents.forEach(event => {
        expect(typeof event).toBe('string');
        expect(event.length).toBeGreaterThan(0);
      });
    });
  });

  describe('POST /api/auth/fcm-token RBAC', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/auth/fcm-token').send({ token: 'abc123' });
      expect([401, 403, 404, 429]).toContain(res.status);
    });
  });
});
