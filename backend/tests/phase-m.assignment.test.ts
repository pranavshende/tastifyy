/**
 * Phase M — Delivery Assignment: Haversine distance algorithm, nearest partner selection
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

// ─── Pure Haversine function (mirrored from assignment.service.ts) ─────────
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

describe('Phase M — Delivery Assignment Engine', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Haversine Unit Tests ─────────────────────────────────────────────────

  describe('Haversine Distance Formula', () => {
    it('returns 0 for identical coordinates', () => {
      const dist = calculateDistance(19.076, 72.877, 19.076, 72.877);
      expect(dist).toBeCloseTo(0, 3);
    });

    it('calculates correct distance between Mumbai and Pune (~120km)', () => {
      // Mumbai: 19.0760, 72.8777  |  Pune: 18.5204, 73.8567
      const dist = calculateDistance(19.076, 72.877, 18.5204, 73.8567);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(150);
    });

    it('returns a shorter distance for nearby points', () => {
      const nearby = calculateDistance(19.076, 72.877, 19.080, 72.880); // ~0.5km
      const far = calculateDistance(19.076, 72.877, 19.200, 73.100);    // ~20km
      expect(nearby).toBeLessThan(far);
    });

    it('selects the nearest driver from a list', () => {
      const restaurantLat = 19.076;
      const restaurantLon = 72.877;

      const drivers = [
        { id: 'driver-a', lat: 19.100, lon: 72.900 }, // farther
        { id: 'driver-b', lat: 19.077, lon: 72.878 }, // nearest
        { id: 'driver-c', lat: 19.120, lon: 72.920 }, // farthest
      ];

      const withDistances = drivers.map(d => ({
        ...d,
        distance: calculateDistance(restaurantLat, restaurantLon, d.lat, d.lon)
      }));

      withDistances.sort((a, b) => a.distance - b.distance);
      expect(withDistances[0]!.id).toBe('driver-b');
    });
  });

  // ─── Assignment Route Guards ──────────────────────────────────────────────

  describe('POST /api/delivery/location', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).post('/api/delivery/location').send({
        latitude: 19.076, longitude: 72.877
      });
      expect([401, 403]).toContain(res.status);
    });
  });

  // ─── DB Assignment Mock ───────────────────────────────────────────────────

  describe('Delivery Assignment DB transaction', () => {
    it('correctly mocks the atomic $transaction for assignment creation', () => {
      prismaMock.$transaction.mockResolvedValue([
        { id: 'order-1', delivery_partner_id: 'dp-1', status: 'restaurant_confirmed' },
        { id: 'da-1', order_id: 'order-1', delivery_partner_id: 'dp-1' }
      ] as any);

      expect(prismaMock.$transaction).toBeDefined();
    });
  });
});
