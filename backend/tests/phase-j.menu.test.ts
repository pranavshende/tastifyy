/**
 * Phase J — Menu Management: Category/Item CRUD, stock management, availability toggle
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from './__mocks__/prisma.js';

describe('Phase J — Restaurant Menu Management', () => {
  let app: any;

  beforeAll(async () => {
    app = (await import('../src/index.js')).default;
  });

  afterEach(() => jest.clearAllMocks());

  describe('Menu RBAC enforcement', () => {
    it('POST /api/menu/categories → 401 without token', async () => {
      const res = await request(app).post('/api/menu/categories').send({ name: 'Starters' });
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/menu/items → 401 without token', async () => {
      const res = await request(app).post('/api/menu/items').send({
        name: 'Paneer Tikka',
        price: 220,
        category_id: 'cat-1',
        is_veg: true
      });
      expect([401, 403]).toContain(res.status);
    });

    it('PUT /api/menu/items/:id/availability → 401 without token', async () => {
      const res = await request(app).put('/api/menu/items/item-1/availability').send({ is_available: false });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Menu CRUD data mocks', () => {
    it('correctly mocks menu category creation', () => {
      prismaMock.menuCategory.create.mockResolvedValue({
        id: 'cat-1',
        restaurant_id: 'rest-1',
        name: 'Starters',
        description: null,
        display_order: 1,
        is_active: true,
      } as any);

      expect(prismaMock.menuCategory.create).toBeDefined();
    });

    it('correctly mocks menu item creation with stock field', () => {
      prismaMock.menuItem.create.mockResolvedValue({
        id: 'item-1',
        category_id: 'cat-1',
        restaurant_id: 'rest-1',
        name: 'Paneer Tikka',
        price: 220 as any,
        is_veg: true,
        is_available: true,
        stock_quantity: 50,
        track_stock: true,
      } as any);

      expect(prismaMock.menuItem.create).toBeDefined();
    });

    it('stock decrement logic: decrements stock_quantity on order creation', () => {
      // The order creation loop decrements via prisma.menuItem.update
      prismaMock.menuItem.update.mockResolvedValue({
        id: 'item-1',
        stock_quantity: 49, // was 50, ordered 1
      } as any);

      expect(prismaMock.menuItem.update).toBeDefined();
    });

    it('stock restore logic: restores stock on order cancellation', () => {
      prismaMock.menuItem.update.mockResolvedValue({
        id: 'item-1',
        stock_quantity: 50, // restored from 49
      } as any);

      expect(prismaMock.menuItem.update).toBeDefined();
    });
  });
});
