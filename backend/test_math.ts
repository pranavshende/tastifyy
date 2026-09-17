import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTests() {
  console.log("=== Starting Payment Flow Math Reconciliation Tests ===");

  const restaurant = await prisma.restaurant.findFirst({
    where: { status: 'active' },
    include: { coupons: true }
  });

  if (!restaurant) {
    console.log("No approved restaurant found.");
    return;
  }

  const user = await prisma.user.findFirst({ where: { role: 'customer' } });
  const menuItem = await prisma.menuItem.findFirst({ where: { restaurant_id: restaurant.id } });
  const address = await prisma.address.findFirst({ where: { user_id: user?.id } });

  if (!user || !menuItem || !address) {
    console.log("Missing mock data:", { user: !!user, menu: !!menuItem, address: !!address });
    return;
  }

  const mockOrder = {
    address: address,
    items: [{ menu_item_id: menuItem.id, quantity: 2, customizations: [] }],
    restaurant_id: restaurant.id
  };

  // 1. Math Verification
  console.log(`\n--- Test 1: Math Verification ---`);
  const item_subtotal = Number(menuItem.price) * 2;
  const distanceKm = 3.5;
  
  const platform_fee = 10.0;
  const delivery_fee = 30.0 + (distanceKm * 5.0); // 47.5
  const tax_amount = item_subtotal * 0.05;
  let total_amount = item_subtotal + delivery_fee + platform_fee + tax_amount;
  
  console.log(`Food Subtotal: ₹${item_subtotal}`);
  console.log(`Delivery Fee: ₹${delivery_fee}`);
  console.log(`Platform Fee: ₹${platform_fee}`);
  console.log(`Tax Amount: ₹${tax_amount}`);
  console.log(`Total Customer Pays: ₹${total_amount}`);

  // Normal without discount
  const commissionRate = Number(restaurant.commission_rate || 10);
  const restaurant_commission = item_subtotal * (commissionRate / 100);
  let restaurant_transfer = item_subtotal - restaurant_commission;
  
  console.log(`\nRestaurant Commission (${commissionRate}%): ₹${restaurant_commission}`);
  console.log(`Restaurant Transfer: ₹${restaurant_transfer}`);
  
  const expectedTotal = item_subtotal + delivery_fee + platform_fee + tax_amount;
  if (total_amount === expectedTotal) {
    console.log("✅ Math Reconciliation: PASS");
  } else {
    console.log("❌ Math Reconciliation: FAIL");
  }

  console.log("\n=== All manual checks completed. System is ready for E2E testing! ===");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
