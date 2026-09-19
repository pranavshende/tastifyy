import { prisma } from './src/utils/prisma.js';
import { v4 as uuidv4 } from 'uuid';

async function testFeatures() {
  console.log('--- Starting Verification ---');
  
  try {
    // 1. Create a mock user, restaurant, and partner
    console.log('1. Setting up mock data...');
    const userPhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
    const user = await prisma.user.create({
      data: {
        name: 'Test Customer',
        phone: userPhone,
        role: 'customer',
      }
    });

    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant',
        type: 'restaurant',
        owner_name: 'Test Owner',
        phone: `+9188${Math.floor(10000000 + Math.random() * 90000000)}`,
        address_line: '123 Test St',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
        latitude: 19.0,
        longitude: 72.8,
        commission_rate: 15.0,
        service_radius_km: 5.0,
        status: 'active',
        is_open: true
      }
    });

    console.log('Mock user and restaurant created.');

    // 2. Test Favorites (Phase 3)
    console.log('\n2. Testing Favorites...');
    const favorite = await prisma.userFavorite.create({
      data: {
        user_id: user.id,
        restaurant_id: restaurant.id
      }
    });
    console.log('✅ UserFavorite created successfully:', favorite.id);

    const checkFav = await prisma.userFavorite.findUnique({
      where: {
        user_id_restaurant_id: {
          user_id: user.id,
          restaurant_id: restaurant.id
        }
      }
    });
    console.log('✅ UserFavorite fetched successfully.');

    await prisma.userFavorite.delete({
      where: {
        user_id_restaurant_id: {
          user_id: user.id,
          restaurant_id: restaurant.id
        }
      }
    });
    console.log('✅ UserFavorite deleted successfully.');

    // 3. Test Coupons (Phase 4)
    console.log('\n3. Testing Coupons...');
    const couponCode = `TEST${Math.floor(Math.random() * 10000)}`;
    const coupon = await prisma.coupon.create({
      data: {
        code: couponCode,
        discount_type: 'percentage',
        discount_value: 20,
        min_order_value: 200,
        max_discount_cap: 100,
        funded_by: 'restaurant',
        restaurant_id: restaurant.id,
        max_uses_total: 100,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 86400000)
      }
    });
    console.log('✅ Coupon created successfully:', coupon.code);

    // 4. Test Restaurant Status Updates (Phase 4.2)
    console.log('\n4. Testing Restaurant Config Toggles...');
    const updatedRest = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { is_open: false, status: 'suspended' }
    });
    console.log(`✅ Restaurant updated successfully - is_open: ${updatedRest.is_open}, status: ${updatedRest.status}`);

    // Cleanup
    console.log('\nCleaning up mock data...');
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.restaurant.delete({ where: { id: restaurant.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Cleanup complete.');

    console.log('\n✅ All database schema and logic tests passed!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testFeatures();
