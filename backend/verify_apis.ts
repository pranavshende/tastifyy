import { prisma } from './src/utils/prisma.ts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'fallback_development_secret';

function createToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } as any });
}

async function verify() {
  console.log('--- Starting API Verification ---');
  try {
    // 1. Get test users
    const admin = await prisma.user.findFirst({ where: { role: 'admin', is_active: true } });
    const customer = await prisma.user.findFirst({ where: { role: 'customer', is_active: true } });
    
    const deliveryPartner = await prisma.deliveryPartner.findFirst();
    let deliveryUser = null;
    if (deliveryPartner) {
        deliveryUser = await prisma.user.findFirst({ where: { id: deliveryPartner.user_id } });
    }

    const restaurantPartner = await prisma.restaurantPartner.findFirst();
    let restaurantUser = null;
    if (restaurantPartner) {
        restaurantUser = await prisma.user.findFirst({ where: { phone: restaurantPartner.phone } });
    }

    if (!admin) console.warn('⚠️ No active admin found, skipping admin routes');
    if (!customer) console.warn('⚠️ No active customer found, skipping customer routes');
    if (!deliveryUser) console.warn('⚠️ No active delivery partner found, skipping delivery routes');
    if (!restaurantUser) console.warn('⚠️ No active restaurant partner found, skipping restaurant routes');

    const PORT = process.env.PORT || 5000;
    const API_BASE = `http://localhost:${PORT}/api`;

    async function fetchApi(path: string, token: string, method = 'GET', body?: any) {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      console.log(`[${method}] ${path} -> Status: ${res.status}, Success: ${data.success}`);
      if (!data.success) console.error('  Error:', data.error);
      return data;
    }

    // 1. Verify Admin Routes
    if (admin) {
      console.log('\n--- Verifying Admin Analytics ---');
      const token = createToken(admin.id);
      await fetchApi('/analytics/admin', token);
    }

    // 2. Verify Restaurant Routes
    if (restaurantUser) {
      console.log('\n--- Verifying Restaurant Analytics & Reviews ---');
      const token = createToken(restaurantUser.id);
      await fetchApi('/analytics/restaurant', token);
      await fetchApi(`/reviews/restaurant/${restaurantPartner!.restaurant_id}`, token);
    }

    // 3. Verify Delivery Routes
    if (deliveryUser) {
      console.log('\n--- Verifying Delivery Earnings & History ---');
      const token = createToken(deliveryUser.id);
      await fetchApi('/delivery/earnings', token);
      await fetchApi('/delivery/orders/history', token);
    }

    // 4. Verify Customer Route
    if (customer) {
      console.log('\n--- Verifying Customer Review Status ---');
      const token = createToken(customer.id);
      await fetchApi('/reviews/order/dummy-order-id', token);
    }

    console.log('\n--- Verification Complete ---');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
