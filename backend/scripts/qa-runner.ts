import axios from 'axios';
import { prisma } from '../src/utils/prisma';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Comprehensive QA Test Suite...');
  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      testsFailed++;
      throw new Error(message);
    }
    console.log(`✅ PASSED: ${message}`);
    testsPassed++;
  };

  try {
    console.log('\n--- 🛠 Phase 1: Test Data Setup ---');
    
    // Clear out test users and restaurants if they exist to start fresh
    const oldUsers = await prisma.user.findMany({ where: { phone: { in: ['+919999999990', '+919999999991', '+919999999992', '+919999999993'] } } });
    for (const u of oldUsers) {
      await prisma.orderItem.deleteMany({ where: { order: { customer_id: u.id } } });
      await prisma.order.deleteMany({ where: { customer_id: u.id } });
      await prisma.address.deleteMany({ where: { user_id: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }

    const oldRests = await prisma.restaurant.findMany({ where: { phone: { in: ['9999999992', '9999999993'] } } });
    for (const r of oldRests) {
      await prisma.orderItem.deleteMany({ where: { order: { restaurant_id: r.id } } });
      await prisma.order.deleteMany({ where: { restaurant_id: r.id } });
      await prisma.menuItemCustomizationOption.deleteMany({ where: { customization: { menu_item: { restaurant_id: r.id } } } });
      await prisma.menuItemCustomization.deleteMany({ where: { menu_item: { restaurant_id: r.id } } });
      await prisma.menuItem.deleteMany({ where: { restaurant_id: r.id } });
      await prisma.menuCategory.deleteMany({ where: { restaurant_id: r.id } });
      await prisma.restaurantPartner.deleteMany({ where: { restaurant_id: r.id } });
      await prisma.restaurant.delete({ where: { id: r.id } });
    }

    // Create Test Customer A & B
    const customerA = await prisma.user.create({
      data: { name: 'Test Customer A', phone: '+919999999990', role: 'customer' }
    });

    const ownerA = await prisma.user.create({
      data: { name: 'Owner A', phone: '+919999999992', role: 'restaurant_partner' }
    });
    const ownerB = await prisma.user.create({
      data: { name: 'Owner B', phone: '+919999999993', role: 'restaurant_partner' }
    });

    // Create Restaurants
    const restaurantA = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant A', type: 'restaurant', owner_name: 'Owner A', phone: '9999999992', city: 'Test', state: 'Test', address_line: 'Test', pincode: '111111', latitude: 0, longitude: 0, service_radius_km: 10, is_pure_veg: false, commission_rate: 10, is_open: true, status: 'active', approval_status: 'approved', account_status: 'active', visibility_status: 'visible',
        partners: { create: { name: 'Owner A', phone: '+919999999992', role: 'owner' } }
      }
    });

    const restaurantB = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant B', type: 'restaurant', owner_name: 'Owner B', phone: '9999999993', city: 'Test', state: 'Test', address_line: 'Test', pincode: '111111', latitude: 0, longitude: 0, service_radius_km: 10, is_pure_veg: true, commission_rate: 10, is_open: true, status: 'active', approval_status: 'approved', account_status: 'active', visibility_status: 'visible',
        partners: { create: { name: 'Owner B', phone: '+919999999993', role: 'owner' } }
      }
    });

    console.log('\n--- 🔐 Phase 2: OTP & Auth Flow ---');

    try {
      await axios.post(`${API_URL}/auth/otp/send`, { phone: '+919999999990', role: 'customer' });
      assert(true, 'OTP Request sent successfully');
    } catch (e: any) {
      if (e.response && e.response.status === 429) {
        assert(true, 'OTP Request rate limited (Expected if re-running script quickly)');
      } else {
        throw e;
      }
    }
    
    const jwt = await import('jsonwebtoken');
    const generateToken = (user: any) => jwt.default.sign({ sub: user.id, role: user.role, phone: user.phone }, process.env.JWT_SECRET || 'fallback_development_secret', { expiresIn: '1d' });
    
    const tokenCustA = generateToken(customerA);
    const tokenOwnerA = generateToken(ownerA);
    const tokenOwnerB = generateToken(ownerB);

    const apiCustA = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${tokenCustA}` } });
    const apiOwnerA = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${tokenOwnerA}` } });
    const apiOwnerB = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${tokenOwnerB}` } });

    const meRes = await apiCustA.get('/auth/me');
    assert(meRes.data.user.phone === '+919999999990', 'Auth token correctly resolves to Customer A');

    console.log('\n--- 🍽 Phase 3: Menu & Variants API ---');

    const catRes = await apiOwnerA.post('/menu/categories', { name: 'Pizza', display_order: 1 });
    const categoryId = catRes.data.data.id;
    assert(!!categoryId, 'Restaurant A created Menu Category');

    const FormData = (await import('form-data')).default;
    const form = new FormData();
    const csvContent = `Name,Description,Price,Category,IsVeg,PrepTimeMins\nTest Margherita,Classic,199,Pizza,true,15\nTest Veg Biryani,Rice,149,Biryani,true,20`;
    form.append('file', Buffer.from(csvContent, 'utf-8'), { filename: 'menu.csv', contentType: 'text/csv' });
    
    const bulkRes = await apiOwnerA.post('/menu/bulk-import', form, { headers: form.getHeaders() });
    assert(bulkRes.data.data.created === 2, 'Bulk CSV import created 2 items');

    const menuItems = await prisma.menuItem.findMany({ where: { restaurant_id: restaurantA.id } });
    const pizzaItem = menuItems.find(m => m.name === 'Test Margherita');
    const biryaniItem = menuItems.find(m => m.name === 'Test Veg Biryani');
    
    await apiOwnerA.post(`/menu/items/${pizzaItem!.id}/variants`, {
      group_name: 'Size',
      options: [
        { label: 'Small', additional_price: 0 },
        { label: 'Medium', additional_price: 50 },
        { label: 'Large', additional_price: 100 }
      ]
    });
    
    await apiOwnerA.post(`/menu/items/${biryaniItem!.id}/variants`, {
      group_name: 'Portion',
      options: [
        { label: 'Half', additional_price: 0 },
        { label: 'Full', additional_price: 100 }
      ]
    });

    const pizzaVariantsDb = await prisma.menuItemCustomization.findFirst({ where: { menu_item_id: pizzaItem!.id, variant_group: true }, include: { options: true } });
    assert(pizzaVariantsDb?.options.length === 3, 'Pizza variants created successfully in DB');

    await apiOwnerA.post('/menu/addons', {
      group_name: 'Extras',
      options: [
        { label: 'Water Bottle', additional_price: 20 },
        { label: 'Extra Cheese', additional_price: 50 }
      ]
    });

    const addonsDb = await prisma.menuItemCustomization.findFirst({ where: { is_addon: true }, include: { options: true } });
    assert(addonsDb?.options.length === 2, 'Restaurant-level add-ons created successfully');

    let idorCaught = false;
    try {
      await apiOwnerB.post(`/menu/items/${pizzaItem!.id}/variants`, { group_name: 'Hack', options: [{ label: 'Hacked', additional_price: 0 }] });
      console.error('🚨 IDOR Vulnerability: Request succeeded unexpectedly!');
    } catch (e: any) {
      if (e.response && (e.response.status === 403 || e.response.status === 404)) {
        idorCaught = true;
      } else {
        console.error(`🚨 IDOR check failed with unexpected status: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
      }
    }
    assert(idorCaught, 'IDOR blocked: Restaurant B cannot modify Restaurant A menu');

    console.log('\n--- 🛒 Phase 4: Customer Order Flow & Financials ---');
    
    const pizzaMedOption = pizzaVariantsDb!.options.find(o => o.label === 'Medium')!;
    const waterOption = addonsDb!.options.find(o => o.label === 'Water Bottle')!;
    const cheeseOption = addonsDb!.options.find(o => o.label === 'Extra Cheese')!;

    const address = await prisma.address.create({
      data: { user_id: customerA.id, label: 'home', address_line: 'Test', city: 'Test', state: 'Test', pincode: '111', latitude: 0, longitude: 0 }
    });

    const order1 = await prisma.order.create({
      data: {
        customer_id: customerA.id,
        restaurant_id: restaurantA.id,
        delivery_address_id: address.id,
        status: 'delivered',
        payment_method: 'cod',
        payment_status: 'success',
        item_subtotal: 767,
        delivery_fee: 40,
        platform_fee: 10,
        discount_amount: 118,
        restaurant_discount_share: 100,
        platform_discount_share: 18,
        tax_amount: 0,
        total_amount: 699,
        restaurant_commission: 66.7,
        restaurant_transfer: 600.3,
        idempotency_key: 'test_order_1',
        order_items: {
          create: [
            {
              menu_item_id: pizzaItem!.id,
              name_snapshot: 'Test Margherita',
              price_snapshot: 199,
              quantity: 2,
              subtotal: 598,
              customizations_snapshot: [
                {
                  id: pizzaVariantsDb!.id,
                  group_name: 'Size',
                  is_addon: false,
                  variant_group: true,
                  options: [{ id: pizzaMedOption.id, label: 'Medium', additional_price: 50 }]
                },
                {
                  id: addonsDb!.id,
                  group_name: 'Extras',
                  is_addon: true,
                  variant_group: false,
                  options: [{ id: cheeseOption.id, label: 'Extra Cheese', additional_price: 50 }]
                }
              ]
            },
            {
              menu_item_id: biryaniItem!.id,
              name_snapshot: 'Test Veg Biryani',
              price_snapshot: 149,
              quantity: 1,
              subtotal: 169,
              customizations_snapshot: [
                {
                  id: addonsDb!.id,
                  group_name: 'Extras',
                  is_addon: true,
                  variant_group: false,
                  options: [{ id: waterOption.id, label: 'Water Bottle', additional_price: 20 }]
                }
              ]
            }
          ]
        }
      }
    });
    
    console.log('\n--- 📊 Phase 5: Analytics Verification ---');
    
    const analyticsRes = await apiOwnerA.get('/analytics/restaurant?period=today');
    const analytics = analyticsRes.data.data;

    assert(analytics.kpis.range_revenue === 767, `Total gross sales should be 767 (Got: ${analytics.kpis.range_revenue})`);
    assert(analytics.kpis.range_discounts === 100, `Total restaurant discount should be 100 (Got: ${analytics.kpis.range_discounts})`);
    assert(analytics.kpis.range_net_revenue === 600.3, `Net sales should be 600.3 (Got: ${analytics.kpis.range_net_revenue})`);

    const pizzaAnalytics = analytics.menuItemEarnings.find((i: any) => i.name === 'Test Margherita');
    assert(pizzaAnalytics.units_sold === 2, `Pizza units sold = 2 (Got: ${pizzaAnalytics.units_sold})`);
    assert(pizzaAnalytics.gross_revenue === 598, `Pizza gross revenue = 598 (Got: ${pizzaAnalytics.gross_revenue})`);

    const biryaniAnalytics = analytics.menuItemEarnings.find((i: any) => i.name === 'Test Veg Biryani');
    assert(biryaniAnalytics.gross_revenue === 169, `Biryani gross revenue = 169 (Got: ${biryaniAnalytics.gross_revenue})`);

    assert(Math.abs(pizzaAnalytics.contribution_pct - (598/767)*100) < 0.1, `Pizza contribution % should be approx 77.96%`);

    console.log('\n--- ⏳ Phase 6: Historical Price Integrity ---');
    
    await prisma.menuItem.update({ where: { id: pizzaItem!.id }, data: { price: 299 } });
    
    const historicalRes = await apiOwnerA.get('/analytics/restaurant?period=today');
    const historicalPizzaAnalytics = historicalRes.data.data.menuItemEarnings.find((i: any) => i.name === 'Test Margherita');
    assert(historicalPizzaAnalytics.gross_revenue === 598, `Historical price isolation verified: Pizza gross revenue remains 598 despite price hike.`);

    console.log('\n--- 🔍 Phase 7: Customer Restaurant Listing (Filters) ---');
    
    const vegRes = await apiCustA.get('/customer/restaurants?filter=veg');
    console.log('VEG FILTER RESULT:', vegRes.data.data.map((r: any) => ({ id: r.id, name: r.name, is_pure_veg: r.is_pure_veg })));
    assert(vegRes.data.data.some((r: any) => r.id === restaurantB.id), 'Veg filter includes Restaurant B');
    assert(!vegRes.data.data.some((r: any) => r.id === restaurantA.id), 'Veg filter excludes Restaurant A');

  } catch (error) {
    console.error('🚨 TEST SCRIPT FAILED:', error);
  } finally {
    console.log(`\n🏁 Test Run Complete. Passed: ${testsPassed} | Failed: ${testsFailed}`);
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runTests();
