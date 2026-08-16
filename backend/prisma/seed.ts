// @ts-ignore
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SECRET_KEY || ''
);

async function main() {
  console.log('🌱 Starting database seed...');

  // --- PHASE 1: SUPABASE CLEANUP ---
  console.log('🧹 Clearing Supabase Auth users...');
  
  // Note: We need to use listUsers to find them, but the Supabase JS client doesn't 
  // expose listUsers easily without pagination. For a seed script, it's safer to just 
  // delete the specific test users we are about to create if they exist.
  const testEmails = [
    'admin@tastifyy.com',
    'customer@tastifyy.com',
    'partner@tastifyy.com'
  ];

  // We can fetch users by email, but since we are doing a force reset, 
  // it's best to fetch all users and delete them all if this is a true dev environment.
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError);
  } else {
    for (const u of users) {
      await supabase.auth.admin.deleteUser(u.id);
    }
    console.log(`✅ Deleted ${users.length} users from Supabase Auth.`);
  }

  // --- PHASE 2: SUPABASE & PRISMA SEEDING ---
  const seedUsers = [
    { email: 'admin@tastifyy.com', name: 'Master Admin', phone: '1000000000', role: 'admin' },
    { email: 'customer@tastifyy.com', name: 'Test Customer', phone: '2000000000', role: 'customer' },
    { email: 'partner@tastifyy.com', name: 'Test Partner', phone: '3000000000', role: 'restaurant_partner' },
  ];

  console.log('👤 Creating standard users...');
  const createdUsers: Record<string, any> = {};

  for (const su of seedUsers) {
    // 1. Create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: su.email,
      password: 'Password123!',
      email_confirm: true
    });

    if (authError || !authData.user) {
      console.error(`Failed to create ${su.email} in Supabase:`, authError);
      continue;
    }

    // 2. Create in Prisma
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: su.email,
        phone: su.phone,
        name: su.name,
        role: su.role as any
      }
    });

    createdUsers[su.role] = user;
    console.log(`✅ Created user: ${su.email} (${su.role})`);
  }

  // --- PHASE 3: RESTAURANT & MENU SEEDING ---
  console.log('🍔 Seeding Restaurant & Menu Data...');
  
  if (createdUsers['restaurant_partner']) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'The Spice Grill',
        type: 'restaurant',
        owner_name: 'Test Partner',
        phone: '3000000000',
        email: 'partner@tastifyy.com',
        address_line: '123 Food Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        latitude: 18.922,
        longitude: 72.834,
        service_radius_km: 10,
        is_open: true,
        status: 'active',
        commission_rate: 15.5,
        is_pure_veg: false,
        cuisine_tags: ['Indian', 'Tandoor'],
      }
    });

    const starters = await prisma.menuCategory.create({
      data: {
        restaurant_id: restaurant.id,
        name: 'Starters',
        display_order: 1,
      }
    });

    await prisma.menuItem.createMany({
      data: [
        { restaurant_id: restaurant.id, category_id: starters.id, name: 'Paneer Tikka', description: 'Grilled cottage cheese', price: 250, is_veg: true, is_available: true },
        { restaurant_id: restaurant.id, category_id: starters.id, name: 'Chicken Tikka', description: 'Grilled chicken chunks', price: 320, is_veg: false, is_available: true }
      ]
    });

    const mains = await prisma.menuCategory.create({
      data: {
        restaurant_id: restaurant.id,
        name: 'Mains',
        display_order: 2,
      }
    });

    await prisma.menuItem.createMany({
      data: [
        { restaurant_id: restaurant.id, category_id: mains.id, name: 'Butter Chicken', description: 'Rich tomato gravy', price: 450, is_veg: false, is_available: true },
        { restaurant_id: restaurant.id, category_id: mains.id, name: 'Dal Makhani', description: 'Slow cooked black lentils', price: 300, is_veg: true, is_available: true }
      ]
    });

    console.log(`✅ Created Restaurant: ${restaurant.name} with Menu Categories and Items`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
